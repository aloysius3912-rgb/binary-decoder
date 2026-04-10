/* ---------- State & helpers ---------- */
const state = { current: null, userBits: [], answered: false }; 
const $ = (s) => document.querySelector(s);

const host = $("#svgHost"),
  inputZone = $("#inputZone"),
  ttWrap = $("#ttWrap"),
  feedback = $("#feedback"),
  promptEl = $("#prompt");

/* ---------- Event Listeners ---------- */
window.addEventListener("DOMContentLoaded", () => { 
    newQuestion(); 
    
    // Block Truth Table from opening if not answered
    document.getElementById("ttDetails").addEventListener("click", (e) => {
        if (!state.answered) {
            e.preventDefault(); 
            feedback.innerHTML = "⚠️ Please check your answer before viewing the truth table.";
            feedback.className = "feedback";
        }
    });
});

document.getElementById("mode").addEventListener("change", newQuestion);
// Polarity listener removed!

// Next Button with Hard Block logic
const nextBtn = document.getElementById("nextBtn");
if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
        if (!state.answered) {
            e.preventDefault();
            return;
        }
        newQuestion();
    });
}

document.getElementById("checkBtn").addEventListener("click", () => { if (!state.current) return; checkAnswer(); });
document.addEventListener("click", (e) => { const d = document.getElementById("settings"); if (d && !d.contains(e.target)) d.removeAttribute("open"); });

/* ---------- Core Logic ---------- */
function newQuestion() {
    // Lock Next Button & Truth table at the start of a new question
    state.answered = false;
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.style.pointerEvents = "none";
        nextBtn.style.opacity = "0.5";
    }
    
    const ttDetails = document.getElementById("ttDetails");
    if (ttDetails) ttDetails.open = false;

    const q = generateQuestion();
    state.current = q;
    state.userBits = Array(q.meta.n).fill(0);
    renderQuestion(q);
}

function indexFromBits(bits) { return bits.reduce((acc, b) => (acc << 1) | (b ? 1 : 0), 0); }
function toBits(v, n) { return Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1); }

function choose(map) {
  const items = Object.entries(map);
  let r = Math.random() * items.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of items) { if ((r -= w) <= 0) return k; }
  return items.at(-1);
}

// Global Parser for Boolean Math
function parseBooleanExpression(expr, ctx) {
    let parsed = expr;
    for (let key in ctx) {
        parsed = parsed.replace(new RegExp("\\b" + key + "\\b", "g"), ctx[key]);
    }
    parsed = parsed.replace(/([0-1])'/g, "(~$1 & 1)");
    parsed = parsed.replace(/\*/g, "&");
    parsed = parsed.replace(/\+/g, "|");
    parsed = parsed.replace(/⊕/g, "^");
    return new Function('return ' + parsed)();
}

/* ---------- Question Generation ---------- */
function generateQuestion() {
  const mode = $("#mode").value;
  const pol = "AH"; // Forced to always be Active High!
  
  // SUPPORT FOR 4-to-16 (n=4)
  const n = (mode === "2") ? 2 : (mode === "3") ? 3 : (mode === "4") ? 4 : (Math.floor(Math.random() * 3) + 2);
  const qtype = choose({ forward: 0.5, inverse: 0.5 });
  const enabled = true; 

  let meta = { n, polarity: pol, enabled, qtype };
  let prompt, ui;

  if (qtype === "forward") {
    // Dynamically uses W, X, Y, Z based on size
    const vars = n === 4 ? ['W', 'X', 'Y', 'Z'] : (n === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y']);
    const ops = ['*', '+', '⊕'];

    function randomExpr() {
        const type = Math.random();
        const v1 = vars[Math.floor(Math.random() * vars.length)];
        let v2 = vars[Math.floor(Math.random() * vars.length)];
        while (v1 === v2) v2 = vars[Math.floor(Math.random() * vars.length)];
        const op = ops[Math.floor(Math.random() * ops.length)];
        
        if (type < 0.25) return v1;
        if (type < 0.5) return v1 + "'";
        return v1 + op + v2;
    }

    const exprs = [];
    for (let i = 0; i < n; i++) {
        exprs.push(randomExpr());
    }

    const inputBits = Array.from({length: vars.length}, () => Math.random() < 0.5 ? 0 : 1);
    const inputStr = inputBits.join('');

    const context = {};
    vars.forEach((v, i) => context[v] = inputBits[i]);

    const iVals = exprs.map(e => parseBooleanExpression(e, context) ? 1 : 0);
    
    let idx = 0;
    for (let i = 0; i < n; i++) {
        idx = (idx << 1) | iVals[i];
    }

    meta.bits = iVals; 
    meta.exprs = exprs;
    meta.inputBits = inputBits; 
    meta.assertedOutput = `Y${idx}`;

    const eqStrings = exprs.map((e, i) => `I${n - 1 - i} = ${e}`);
    prompt = `If <strong>${eqStrings.join(', ')}</strong>.<br>What is the output activated when the input ${vars.join('')} is <strong>${inputStr}</strong>?`;

    ui = {
      mode: "pick-output",
      options: Array.from({ length: 1 << n }, (_, i) => `Y${i}`),
      correct: `Y${idx}`
    };

  } else {
    const bits = Array.from({ length: n }, () => Math.random() < .5 ? 0 : 1);
    const idx = indexFromBits(bits);
    meta.bits = bits;
    meta.inputBits = bits; 
    meta.assertedOutput = `Y${idx}`;

    prompt = `Given asserted output <strong>Y${idx}</strong>, set the inputs.`;
    ui = { mode: "set-inputs", given: `Y${idx}` };
  }
  
  return { meta, prompt, ui };
}

/* ---------- UI Rendering ---------- */
function renderQuestion(q) {
  promptEl.innerHTML = q.prompt;
  inputZone.innerHTML = "";
  feedback.innerHTML = "";
  feedback.className = "feedback";

  drawDecoderSVG(q.meta);

  if (q.ui.mode === "pick-output") {
    const grid = document.createElement('div'); grid.className = "answers";
    for (const opt of q.ui.options) {
      const id = `o-${crypto.randomUUID()}`;
      const lab = document.createElement('label'); lab.className = "radio"; lab.setAttribute("for", id);
      const inp = document.createElement('input'); inp.type = "radio"; inp.name = "outpick"; inp.value = opt; inp.id = id;
      const span = document.createElement('span'); span.textContent = opt; lab.append(inp, span); grid.append(lab);
      inp.addEventListener('change', () => drawDecoderSVG(state.current.meta));
    } 
    inputZone.append(grid);
  } else if (q.ui.mode === "set-inputs") {
    const wrap = document.createElement('div'); wrap.className = "bits";
    
    // Dynamically generates I3, I2, I1, I0 based on n
    const names = Array.from({ length: q.meta.n }, (_, i) => `I${q.meta.n - 1 - i}`);
    names.forEach((nm, i) => wrap.append(renderToggle(nm, i, false)));
    inputZone.append(wrap);
  }

  renderTruthTable(q.meta);
}

// 0 / 1 Toggle Buttons
function renderToggle(name, index, value) {
  const holder = document.createElement('div'); holder.className = "bit";
  const lab = document.createElement('div'); lab.className = "kbd"; lab.textContent = name;
  
  const t = document.createElement('button');
  t.className = "toggle-btn";
  t.dataset.val = value ? "1" : "0";
  t.textContent = t.dataset.val;
  
  t.addEventListener('click', () => {
    const next = t.dataset.val === "0" ? "1" : "0";
    t.dataset.val = next;
    t.textContent = next;
    
    state.userBits[index] = Number(next);
    drawDecoderSVG(state.current.meta);
    renderTruthTable(state.current.meta); 
  });
  
  holder.append(lab, t); return holder;
}

function getSelectedOutput() {
  const sel = document.querySelector('input[name="outpick"]:checked');
  return sel ? sel.value : null;
}

function computeDisplayBits(meta) {
  const size = 1 << meta.n;
  const q = state.current;
  let activeIdx = null;

  if (q.ui.mode === "set-inputs") {
    activeIdx = indexFromBits(state.userBits);
  } else if (q.ui.mode === "pick-output") {
    const sel = getSelectedOutput();
    if (sel && sel.startsWith("Y")) {
      activeIdx = Number(sel.slice(1));
    }
  } else {
    activeIdx = indexFromBits(meta.bits);
  }

  const idleVal = meta.polarity === "AH" ? 0 : 1;
  const activeVal = meta.polarity === "AH" ? 1 : 0;
  
  const display = Array(size).fill(idleVal);
  if (activeIdx !== null && meta.enabled) {
    display[activeIdx] = activeVal;
  }
  return display;
}

function drawDecoderSVG(meta) {
  const { n, bits, enabled, polarity } = meta;
  const size = 1 << n;
  
  // SVG scales vertically if n=4 (4x16) to fit all 16 pins comfortably!
  const h = n === 4 ? 550 : 350; 
  const boxH = n === 4 ? 460 : 260; 
  const w = 400; 
  const boxW = 180; 
  const cx = (w - boxW) / 2, cy = (h - boxH) / 2;
  const sw = 4; 

  const s = createSVG(w, h);
  s.append(rect(cx, cy, boxW, boxH, 12, "#1e293b", "#334155", sw));
  
  // Changed arrows to "to" and removed the AH polarity text!
  s.append(text(cx + boxW / 2, cy + 40, `${n}-to-${size} DEC`, { anchor: "middle", size: 18, weight: 700, fill: "#fff" }));

  const inputNames = Array.from({ length: n }, (_, i) => `I${n - 1 - i}`);
  const iTop = cy + (n === 4 ? 60 : 80);
  const iBot = cy + boxH - (n === 4 ? 60 : 80);
  const iStep = inputNames.length === 1 ? 0 : (iBot - iTop) / (inputNames.length - 1);

  inputNames.forEach((nm, i) => {
    const y = iTop + i * iStep;
    s.append(line(20, cx, y, y, sw, "#64748b"));
    s.append(text(cx + 15, y + 6, nm, { size: 16, fill: "#94a3b8" }));

    let displayValue = "?";
    const q = state.current;
    
    if (q.ui.mode === "set-inputs") {
      displayValue = String(state.userBits[i]);
    } else if (q.ui.mode === "pick-output" && meta.exprs) {
      displayValue = meta.exprs[i];
    }

    s.append(text(cx - 15, y - 8, displayValue, { anchor: "end", size: 15, fill: "#4facfe", weight: "bold" }));
  });

  const bitsToShow = computeDisplayBits(meta);
  const oTop = cy + 40, oBot = cy + boxH - 40, oStep = (size === 1 ? 0 : (oBot - oTop) / (size - 1));

  for (let i = 0; i < size; i++) {
    const y = oTop + i * oStep;
    s.append(text(cx + boxW - 15, y + 5, `Y${i}`, { anchor: "end", fill: "#94a3b8" }));
    const isActive = (polarity === "AH" && bitsToShow[i] === 1) || (polarity === "AL" && bitsToShow[i] === 0);
    const wireColor = isActive ? "#4facfe" : "#64748b";
    s.append(line(cx + boxW, w - 20, y, y, sw, wireColor));
    s.append(text(w - 30, y - 5, String(bitsToShow[i]), { anchor: "start", size: 16, fill: isActive ? "#4facfe" : "#fff", weight: "bold" }));
  }

  const enX = cx + boxW / 2;
  const enY = cy + boxH;
  s.append(text(enX, enY - 15, "EN", { anchor: "middle", fill: "#94a3b8" }));
  s.append(line(enX, enX, enY, h - 20, sw, "#64748b"));
  s.append(text(enX + 20, h - 25, String(enabled ? 1 : 0), { anchor: "start", size: 18, fill: enabled ? "#4facfe" : "#ef4444", weight: "bold" }));

  host.innerHTML = ""; host.append(s);
}

function createSVG(w, h) { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", `0 0 ${w} ${h}`); s.setAttribute("width", "100%"); s.setAttribute("height", "100%"); return s; }
function rect(x, y, w, h, rx, fill, stroke, sw) { const r = document.createElementNS("http://www.w3.org/2000/svg", "rect"); r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", rx); r.setAttribute("fill", fill); r.setAttribute("stroke", stroke); r.setAttribute("stroke-width", sw); return r; }
function line(x1, x2, y1, y2, sw, color = "#fff") { const l = document.createElementNS("http://www.w3.org/2000/svg", "line"); l.setAttribute("x1", x1); l.setAttribute("x2", x2); l.setAttribute("y1", y1); l.setAttribute("y2", y2); l.setAttribute("stroke", color); l.setAttribute("stroke-width", sw); l.setAttribute("stroke-linecap", "round"); return l; }
function text(x, y, txt, { anchor = "start", size = 14, weight = "normal", fill = "#000" } = {}) { const t = document.createElementNS("http://www.w3.org/2000/svg", "text"); t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("fill", fill); t.setAttribute("font-size", size); t.setAttribute("font-weight", weight); t.setAttribute("text-anchor", anchor); t.textContent = txt; return t; }

/* ---------- TRUTH TABLE LOGIC (STANDARDIZED) ---------- */
function renderTruthTable(meta) {
  const container = document.getElementById('ttWrap');
  if(!container) return;

  const n = meta.n;
  const vars = n === 4 ? ['W', 'X', 'Y', 'Z'] : (n === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y']);

  let html = `<table class="tt-table" style="width: 100%; border-collapse: collapse; text-align: center;">
      <thead>
          <tr>`;
  vars.forEach(v => html += `<th class="mono">${v}</th>`);
  
  html += `<th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">I${n-1}</th>`;
  for(let i = n - 2; i >= 0; i--) {
      html += `<th class="mono">I${i}</th>`;
  }
  
  html += `<th class="mono">EN</th>
           <th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">OUTPUT ACTIVATED</th>
          </tr>
      </thead>
      <tbody>`;

  let currentVal = 0;
  if (state.current.ui.mode === "set-inputs") {
      currentVal = indexFromBits(state.userBits); 
  } else {
      currentVal = indexFromBits(meta.inputBits); 
  }

  const numRows = 1 << n;
  for (let i = 0; i < numRows; i++) {
      let context = {};
      let rowHtml = '';
      
      vars.forEach((v, index) => {
          const bit = (i >> (n - 1 - index)) & 1;
          context[v] = bit;
          rowHtml += `<td class="mono">${bit}</td>`;
      });

      let iVals = [];
      if (meta.exprs) {
          iVals = meta.exprs.map(expr => parseBooleanExpression(expr, context) ? 1 : 0);
      } else {
          iVals = vars.map(v => context[v]);
      }

      let decIdx = 0;
      for(let j=0; j<n; j++) {
          decIdx = (decIdx << 1) | iVals[j];
      }

      const isMatch = (i === currentVal);
      const rowClass = isMatch ? 'style="background: rgba(34, 197, 94, 0.15);"' : '';

      html += `<tr ${rowClass}>${rowHtml}`;
      
      iVals.forEach((val, idx) => {
          const border = idx === 0 ? 'border-left: 2px solid rgba(255,255,255,0.1); ' : '';
          html += `<td class="mono" style="${border}color: #4facfe; font-weight: bold;">${val}</td>`;
      });

      html += `<td class="mono" style="color: #9aa4b2;">1</td>`;
      html += `<td class="mono" style="border-left: 2px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: bold; font-size: 1.1rem;">Y${decIdx}</td>`;
      html += `</tr>`;
  }
  
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function getUserAnswer(q) {
  if (q.ui.mode === "pick-output") { 
      const sel = document.querySelector('input[name="outpick"]:checked'); 
      return sel ? sel.value : null; 
  }
  if (q.ui.mode === "set-inputs") { 
      return { bits: state.userBits }; 
  }
  return null;
}

function checkAnswer() {
  const q = state.current, ans = getUserAnswer(q); let ok = false, msg = "";
  
  if (q.ui.mode === "pick-output") { 
      if (ans == null) { 
          feedback.innerHTML = "⚠️ Please select an output first."; 
          feedback.className = "feedback"; 
          return; 
      } 
      else { ok = (ans === q.ui.correct); msg = ok ? "Correct! Well done." : `Incorrect. Try again.`; } 
  }
  else if (q.ui.mode === "set-inputs") { 
      const idxUser = indexFromBits(ans.bits);
      const targetIdx = Number(q.ui.given.replace("Y", ""));
      ok = (idxUser === targetIdx); 
      msg = ok ? "Correct inputs set." : "Incorrect inputs. Check the truth table."; 
  }

  feedback.innerHTML = msg;
  feedback.className = `feedback ${ok ? 'good' : 'bad'}`;

  // UNLOCK Next Button & Truth Table!
  state.answered = true;
  if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.style.pointerEvents = "auto";
      nextBtn.style.opacity = "1";
  }
}