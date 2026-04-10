/* ---------- Variables & State ---------- */
let currentMinterms = [];
let currentInputs = []; 
let currentN = 3;
let isAnswered = false; 

/* ---------- Initialization ---------- */
window.onload = function() {
    const modeDropdown = document.getElementById('mode');
    const logicDropdown = document.getElementById('logic-type');
    
    if (!modeDropdown) {
        const host = document.getElementById('svgHost');
        if (host) host.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">⚠️ <b>HTML/JS Mismatch</b><br>Please save your HTML file and hard refresh!</div>`;
        return;
    }

    generateQuestion();
    
    modeDropdown.addEventListener('change', generateQuestion);
    if (logicDropdown) logicDropdown.addEventListener('change', generateQuestion);
    
    const nextBtn = document.getElementById("nextBtn");
    if(nextBtn) {
        nextBtn.addEventListener("click", (e) => {
            if(!isAnswered) { e.preventDefault(); return; }
            generateQuestion();
        });
    }

    const checkBtn = document.getElementById("checkBtn");
    if(checkBtn) checkBtn.addEventListener("click", submit);

    const ttDetails = document.getElementById('ttDetails');
    if(ttDetails) {
        ttDetails.addEventListener("click", (e) => {
            if(!isAnswered) {
                e.preventDefault(); 
                const fb = document.getElementById('solution-container');
                fb.style.display = 'block'; fb.className = 'feedback';
                fb.innerHTML = "⚠️ Please submit an answer before viewing the truth table.";
            }
        });
    }

    document.addEventListener("click", (e) => { 
        const d = document.getElementById("settings"); 
        if (d && !d.contains(e.target)) d.removeAttribute("open"); 
    });
};

/* ---------- Core Generation ---------- */
function generateQuestion() {
    isAnswered = false;
    const nextBtn = document.getElementById("nextBtn");
    if(nextBtn) {
        nextBtn.disabled = true;
        nextBtn.style.pointerEvents = "none"; 
        nextBtn.style.opacity = "0.5";        
    }

    const fb = document.getElementById('solution-container');
    if(fb) { fb.style.display = 'none'; fb.className = 'feedback'; fb.innerHTML = ''; }

    const userAns = document.getElementById('userAns');
    if(userAns) { userAns.value = ''; userAns.focus(); }
    
    const ttDetails = document.getElementById('ttDetails');
    if(ttDetails) ttDetails.open = false; 

    const mode = document.getElementById('mode').value;
    currentN = (mode === "2") ? 2 : (mode === "3") ? 3 : (mode === "4") ? 4 : (Math.floor(Math.random() * 3) + 2);

    const vars = currentN === 4 ? ['W', 'X', 'Y', 'Z'] : (currentN === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y']);
    currentInputs = [];
    for(let i=0; i<currentN; i++) {
        const isInverted = Math.random() < 0.3; 
        currentInputs[i] = isInverted ? vars[i] + "'" : vars[i];
    }

    const maxMinterms = 1 << currentN;
    const count = Math.floor(Math.random() * (currentN === 4 ? 4 : 3)) + 2; 
    const terms = new Set();
    while(terms.size < count) terms.add(Math.floor(Math.random() * maxMinterms));
    currentMinterms = Array.from(terms).sort((a,b) => a-b);

    populateInputsUI();
    generateHelperButtons(vars);
    drawCircuit(currentMinterms);
    renderTruthTable();
}

function populateInputsUI() {
    const container = document.getElementById('randomized-inputs-container');
    if (!container) return;
    container.innerHTML = '';
    
    for (let i = 0; i < currentN; i++) {
        container.innerHTML += `
            <div class="rand-row">
                <span class="lbl-blue">I${currentN - 1 - i}</span>
                <div class="rand-val">${currentInputs[i]}</div>
            </div>
        `;
    }
}

function generateHelperButtons(vars) {
    const helperBtns = document.getElementById('helper-btns');
    if (!helperBtns) return;
    helperBtns.innerHTML = '';
    
    const buttonsToGenerate = [...vars, "'", "+"]; 
    
    buttonsToGenerate.forEach(b => {
        helperBtns.innerHTML += `<button class="logic-btn" data-char="${b}">${b}</button>`;
    });

    let activeInput = document.getElementById('userAns');
    document.querySelectorAll('.logic-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (activeInput) { activeInput.value += e.target.dataset.char; activeInput.focus(); }
        });
    });
}

function renderTruthTable() {
    const container = document.getElementById('tt-content');
    if(!container) return;

    const vars = currentN === 4 ? ['W', 'X', 'Y', 'Z'] : (currentN === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y']);

    let html = `<table class="tt-table" style="width: 100%; border-collapse: collapse; text-align: center;">
        <thead><tr>`;
    
    vars.forEach(v => html += `<th class="mono">${v}</th>`);
    
    html += `<th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">I${currentN-1}</th>`;
    for(let i = currentN - 2; i >= 0; i--) { html += `<th class="mono">I${i}</th>`; }
    
    html += `<th class="mono">EN</th>
             <th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">OUTPUT ACTIVATED</th>
             </tr></thead><tbody>`;

    const maxRows = 1 << currentN;
    for (let i = 0; i < maxRows; i++) {
        let ctx = {};
        let rowHtml = '';
        
        vars.forEach((v, idx) => {
            const bit = (i >> (currentN - 1 - idx)) & 1;
            ctx[v] = bit;
            rowHtml += `<td class="mono">${bit}</td>`;
        });
        
        let decIdx = 0;
        let iVals = [];
        for(let k=0; k<currentN; k++) {
            let rawVal = ctx[vars[k]];
            let finalBit = currentInputs[k].includes("'") ? (rawVal ? 0 : 1) : rawVal;
            iVals.push(finalBit);
            decIdx = (decIdx << 1) | finalBit;
        }
        
        const isConnected = currentMinterms.includes(decIdx);
        const rowClass = isConnected ? 'style="background: rgba(34, 197, 94, 0.15);"' : '';

        html += `<tr ${rowClass}>${rowHtml}`;
        
        iVals.forEach((val, idx) => {
            const border = idx === 0 ? 'border-left: 2px solid rgba(255,255,255,0.1); ' : '';
            html += `<td class="mono" style="${border}color: #4facfe; font-weight: bold;">${val}</td>`;
        });
        
        html += `<td class="mono" style="color: #9aa4b2;">1</td>`;
        html += `<td class="mono" style="border-left: 2px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: bold; font-size: 1.1rem;">Y${decIdx}</td></tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function evaluateBooleanString(expr, w, x, y, z) {
    let parsed = expr.toUpperCase();
    
    parsed = parsed.replace(/^F\s*=\s*/i, '');
    parsed = parsed.replace(/['"‘’`´′″]/g, "'"); 
    parsed = parsed.replace(/\s+/g, '');

    if (!parsed) return 0;
    
    parsed = parsed.replace(/W'/g, "(!W)");
    parsed = parsed.replace(/X'/g, "(!X)");
    parsed = parsed.replace(/Y'/g, "(!Y)");
    parsed = parsed.replace(/Z'/g, "(!Z)");
    parsed = parsed.replace(/0'/g, "(!0)");
    parsed = parsed.replace(/1'/g, "(!1)");

    let safetyCount = 0;
    while (parsed.includes(")'") && safetyCount < 100) {
        let idx = parsed.indexOf(")'");
        let openIdx = -1;
        let depth = 0;
        for (let i = idx - 1; i >= 0; i--) {
            if (parsed[i] === ')') depth++;
            else if (parsed[i] === '(') {
                if (depth === 0) { openIdx = i; break; }
                else depth--;
            }
        }
        if (openIdx !== -1) {
            let inside = parsed.substring(openIdx, idx + 1); 
            parsed = parsed.substring(0, openIdx) + "(!(" + inside.substring(1, inside.length-1) + "))" + parsed.substring(idx + 2);
        } else {
            throw new Error("Mismatched brackets"); 
        }
        safetyCount++;
    }

    parsed = parsed.replace(/([WXYZ01\)])([WXYZ01\(])/g, '$1*$2');
    parsed = parsed.replace(/([WXYZ01\)])([WXYZ01\(])/g, '$1*$2'); 
    parsed = parsed.replace(/([WXYZ01\)])([WXYZ01\(])/g, '$1*$2'); 
    
    parsed = parsed.replace(/W/g, w).replace(/X/g, x).replace(/Y/g, y).replace(/Z/g, z);

    parsed = parsed.replace(/\*/g, "&");               
    parsed = parsed.replace(/\+/g, "|");               
    parsed = parsed.replace(/⊕/g, "^");                

    return new Function('return ' + parsed)() ? 1 : 0;
}

function submit() {
    const userExpr = document.getElementById('userAns').value.trim();
    const fb = document.getElementById('solution-container');
    
    if(!userExpr) {
        fb.style.display = 'block'; fb.className = 'feedback'; 
        fb.innerHTML = "⚠️ Please key in an answer first."; return; 
    }

    let isCorrect = true;
    let failCase = null;
    const vars = currentN === 4 ? ['W', 'X', 'Y', 'Z'] : (currentN === 3 ? ['X', 'Y', 'Z'] : ['X', 'Y']);

    for(let i=0; i < (1 << currentN); i++) {
        let ctx = {};
        let failStr = "";
        for(let j=0; j<currentN; j++) {
            ctx[vars[j]] = (i >> (currentN - 1 - j)) & 1;
            failStr += ctx[vars[j]];
        }
        
        let decIdx = 0;
        for(let j=0; j<currentN; j++) {
            let val = ctx[vars[j]];
            if(currentInputs[j].includes("'")) val = val ? 0 : 1;
            decIdx = (decIdx << 1) | val;
        }
        
        const expected = currentMinterms.includes(decIdx) ? 1 : 0;
        
        const w = ctx['W'] !== undefined ? ctx['W'] : 0;
        const x = ctx['X'] !== undefined ? ctx['X'] : 0;
        const y = ctx['Y'] !== undefined ? ctx['Y'] : 0;
        const z = ctx['Z'] !== undefined ? ctx['Z'] : 0;

        try {
            const userResult = evaluateBooleanString(userExpr, w, x, y, z);
            if(userResult !== expected) {
                isCorrect = false; failCase = failStr; break;
            }
        } catch (e) {
            fb.style.display = 'block'; fb.className = 'feedback bad';
            fb.innerHTML = "<strong>Error:</strong> Invalid syntax. Check your logic operators or brackets."; return;
        }
    }

    fb.style.display = 'block';
    const answerKey = currentMinterms.map(m => getMintermString(m)).join(" + ");
    
    if(isCorrect) { 
        fb.className = 'feedback good'; 
        fb.innerHTML = `<strong>Correct! Well done.</strong><br><small style="color: #cbd5e1; margin-top: 5px; display: block;">Canonical: F = ${answerKey}</small>`; 
    } else { 
        fb.className = 'feedback bad'; 
        fb.innerHTML = `<strong>Incorrect.</strong> Mismatch at input = ${failCase}.<br><span style="margin-top: 5px; display: block;">The correct answer is: <strong style="letter-spacing: 1.5px; color: #fff;">${answerKey}</strong></span>`; 
    }

    isAnswered = true;
    const nextBtn = document.getElementById("nextBtn");
    if(nextBtn) { nextBtn.disabled = false; nextBtn.style.pointerEvents = "auto"; nextBtn.style.opacity = "1"; }
}

function getMintermString(pinIndex) {
    let parts = [];
    for(let k=0; k<currentN; k++) {
        const label = currentInputs[k]; 
        const bit = (pinIndex >> (currentN - 1 - k)) & 1;
        if (bit === 1) parts.push(label);
        else parts.push(label.includes("'") ? label.replace("'", "") : label + "'"); 
    }
    return parts.join("");
}

/* ---------- Draw Dynamic SVG Diagram ---------- */
function drawCircuit(activeMinterms) {
    const el = document.getElementById('svgHost');
    const logicDropdown = document.getElementById('logic-type');
    const isLow = logicDropdown ? logicDropdown.value === 'low' : false;

    if(!el) return;
    
    const n = currentN;
    const maxPins = 1 << n;
    
    const h = n === 4 ? 600 : 400;
    const decH = n === 4 ? 500 : (n === 3 ? 280 : 200);
    const decW = 200;
    const decX = 140, decY = 50; 
    const gateX = 560, gateY = h / 2;
    const pinExt = 25; 

    const wireColor = "#64748b", wireActive = "#ffffff", textColor = "#9aa4b2", boxFill = "#1e293b", boxStroke = "#334155";
    let svg = `<svg width="100%" height="100%" viewBox="50 0 700 ${h}">`;

    // FIX: startX is permanently fixed to the end of the wire, with NO offset!
    const startX = decX + decW + pinExt;

    activeMinterms.forEach((pinIdx, arrayIdx) => {
        const pinY = decY + 80 + (pinIdx * ((decH - 110) / Math.max(1, maxPins - 1)));
        const spread = n === 4 ? 12 : 20; 
        const totalHeight = (activeMinterms.length - 1) * spread;
        const targetY = (gateY - (totalHeight / 2)) + (arrayIdx * spread);

        svg += `<path d="M ${startX} ${pinY} C ${startX+80} ${pinY}, ${gateX-60} ${targetY}, ${gateX} ${targetY}" 
                  fill="none" stroke="${wireActive}" stroke-width="3" style="filter: drop-shadow(0px 0px 4px rgba(255,255,255,0.2));" />`;
        
        // FIX: The white active dot is placed flawlessly over the end of the line
        svg += `<circle cx="${startX}" cy="${pinY}" r="4.5" fill="${wireActive}" style="filter: drop-shadow(0px 0px 4px rgba(255,255,255,0.8));"/>`;
    });

    svg += `<rect x="${decX}" y="${decY}" width="${decW}" height="${decH}" rx="12" fill="${boxFill}" stroke="${boxStroke}" stroke-width="3"/>`;
    svg += `<text x="${decX + decW/2}" y="${decY + 40}" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="bold" font-size="20" fill="#fff">${n}-to-${maxPins} Decoder</text>`;
    svg += `<text x="${decX + decW/2}" y="${decY + 60}" text-anchor="middle" font-family="monospace" font-size="14" fill="${isLow ? '#ef4444' : '#64748b'}">${isLow ? 'AL' : 'AH'}</text>`;

    for(let i=0; i<maxPins; i++) {
        const y = decY + 80 + (i * ((decH - 110) / Math.max(1, maxPins - 1)));
        
        // Draw the grey pin line strictly to startX
        svg += `<line x1="${decX+decW}" y1="${y}" x2="${startX}" y2="${y}" stroke="${wireColor}" stroke-width="2.5"/>`;
        svg += `<text x="${decX+decW-10}" y="${y+5}" text-anchor="end" font-family="monospace" font-weight="bold" font-size="${n===4?13:16}" fill="${textColor}" ${isLow ? 'text-decoration="overline"' : ''}>Y${i}</text>`;
        
        // FIX: Draw the grey Inversion Bubble directly on the tip of the wire
        if(isLow) svg += `<circle cx="${startX}" cy="${y}" r="4.5" fill="${boxFill}" stroke="${wireColor}" stroke-width="2.5"/>`;
    }

    for(let i=0; i<n; i++) {
        const spacing = decH / (n + 1);
        const pinY = decY + ((i + 1) * spacing); 
        
        svg += `<line x1="${decX}" y1="${pinY}" x2="${decX - 40}" y2="${pinY}" stroke="${wireColor}" stroke-width="3"/>`;
        svg += `<text x="${decX + 15}" y="${pinY + 5}" font-weight="bold" font-size="18" fill="${textColor}">I${n-1-i}</text>`;
        svg += `<text x="${decX - 50}" y="${pinY + 5}" text-anchor="end" font-weight="bold" font-size="20" fill="#4facfe">${currentInputs[i]}</text>`;
    }

    svg += `<g transform="translate(${gateX}, ${gateY - 40})">`;
    if (!isLow) {
        svg += `<path d="M 0,0 Q 30,0 60,40 Q 30,80 0,80 Q 20,40 0,0 Z" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
        svg += `<line x1="60" y1="40" x2="100" y2="40" stroke="${wireColor}" stroke-width="3"/>`;
        svg += `<text x="110" y="46" fill="#22c55e" font-size="28" font-weight="bold" font-family="monospace">F</text>`;
    } else {
        svg += `<path d="M 0,0 L 30,0 Q 60,0 60,40 Q 60,80 30,80 L 0,80 Z" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
        svg += `<circle cx="66" cy="40" r="6" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
        svg += `<line x1="72" y1="40" x2="100" y2="40" stroke="${wireColor}" stroke-width="3"/>`;
        svg += `<text x="110" y="46" fill="#22c55e" font-size="28" font-weight="bold" font-family="monospace">F</text>`;
    }
    svg += `</g>`;

    svg += `</svg>`;
    el.innerHTML = svg;
}