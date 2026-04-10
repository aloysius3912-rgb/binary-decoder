document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const sizeDropdown = document.getElementById('decoder-size');
    const typeDropdown = document.getElementById('output-type');
    
    // Input Fields & Rows
    const inputW = document.getElementById('input-w');
    const inputX = document.getElementById('input-x');
    const inputY = document.getElementById('input-y');
    const inputZ = document.getElementById('input-z');
    const inputEn = document.getElementById('input-en');
    
    const rowW = document.getElementById('row-input-w');
    const rowZ = document.getElementById('row-input-z');
    
    // Input Labels
    const lblInput1 = document.getElementById('lbl-input-1');
    const lblInput2 = document.getElementById('lbl-input-2');

    // --- DYNAMIC SVG DRAWING ---
    function drawDecoder() {
        const size = sizeDropdown.value;
        const isAH = typeDropdown.value === 'AH';
        const container = document.getElementById('diagram-container');
        
        const n = size === '4x16' ? 4 : (size === '3x8' ? 3 : 2);
        const maxPins = 1 << n;
        
        // Dynamically scale vertical height based on Pins
        const h = n === 4 ? 650 : 450;
        const decH = n === 4 ? 540 : (n === 3 ? 350 : 250);
        const w = "100%", decW = 180;
        const decX = 110, decY = 50; 
        const pinExt = 25; 

        const wireColor = "#475569", wireActive = "#ffffff", textColor = "#9aa4b2", boxFill = "#1e293b", boxStroke = "#334155";
        let svg = `<svg width="${w}" height="${h}" viewBox="0 0 400 ${h}">`;

        // 1. Draw Decoder Box
        svg += `<rect x="${decX}" y="${decY}" width="${decW}" height="${decH}" rx="10" fill="${boxFill}" stroke="${boxStroke}" stroke-width="2"/>`;
        svg += `<text x="${decX + decW/2}" y="${decY + 35}" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="bold" font-size="18" fill="#fff">${n}-to-${maxPins} Decoder</text>`;
        svg += `<text x="${decX + decW/2}" y="${decY + 55}" text-anchor="middle" font-family="monospace" font-size="14" fill="${isAH ? '#64748b' : '#ef4444'}">${isAH ? 'AH' : 'AL'}</text>`;

        // 2. Draw Output Pins
        for(let i=0; i<maxPins; i++) {
            const y = decY + 30 + (i * ((decH - 60) / Math.max(1, maxPins - 1)));
            svg += `<line x1="${decX+decW}" y1="${y}" x2="${decX+decW+pinExt}" y2="${y}" stroke="${wireColor}" stroke-width="2"/>`;
            svg += `<text x="${decX+decW-10}" y="${y+4}" text-anchor="end" font-family="monospace" font-size="${n===4?11:13}" fill="${textColor}">Y${i}</text>`;
            if(!isAH) svg += `<circle cx="${decX+decW+4}" cy="${y}" r="4" fill="${boxFill}" stroke="${wireColor}" stroke-width="2"/>`;
        }

        // 3. Draw Input Pins (PERFECT EVEN SPACING)
        const currentInputs = n === 4 ? [inputW.value, inputX.value, inputY.value, inputZ.value] 
                            : (n === 3 ? [inputX.value, inputY.value, inputZ.value] 
                            : [inputX.value, inputY.value]);

        for(let i=0; i<n; i++) {
            const spacing = decH / (n + 1);
            const pinY = decY + ((i + 1) * spacing); 
            
            svg += `<line x1="${decX}" y1="${pinY}" x2="${decX - 30}" y2="${pinY}" stroke="${wireColor}" stroke-width="2"/>`;
            svg += `<text x="${decX + 10}" y="${pinY + 4}" font-family="monospace" font-size="12" fill="${textColor}">I${n-1-i}</text>`;
            
            let eqText = currentInputs[i] || "?";
            if (eqText.length > 5) eqText = eqText.substring(0,4) + ".."; 
            svg += `<text x="${decX - 35}" y="${pinY + 4}" text-anchor="end" font-family="monospace" font-weight="bold" font-size="14" fill="#4facfe">${eqText}</text>`;
        }

        // 4. Draw EN Pin
        svg += `<text x="${decX + decW/2 - 10}" y="${decY + decH - 10}" fill="${textColor}" font-size="12" font-family="monospace">EN</text>`;
        svg += `<line x1="${decX + decW/2}" y1="${decY + decH}" x2="${decX + decW/2}" y2="${decY + decH + 30}" stroke="${wireColor}" stroke-width="2"/>`;
        svg += `<text x="${decX + decW/2 + 10}" y="${decY + decH + 25}" fill="#4facfe" font-weight="bold" font-family="monospace">${inputEn.value || "1"}</text>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    }

    // --- UI Listeners ---
    function updateInterface() {
        const size = sizeDropdown.value;
        const n = size === '4x16' ? 4 : (size === '3x8' ? 3 : 2);
        
        rowW.style.display = n === 4 ? 'flex' : 'none';
        rowZ.style.display = n >= 3 ? 'flex' : 'none';
        
        if (n === 4 || n === 3) {
            lblInput1.textContent = "I2:";
            lblInput2.textContent = "I1:";
        } else {
            lblInput1.textContent = "I1:";
            lblInput2.textContent = "I0:";
        }

        drawDecoder();
    }

    sizeDropdown.addEventListener('change', updateInterface);
    typeDropdown.addEventListener('change', drawDecoder);
    
    [inputW, inputX, inputY, inputZ, inputEn].forEach(input => {
        input.addEventListener('input', drawDecoder);
    });

    // Helper Buttons Logic
    let lastActiveInput = inputX;
    document.querySelectorAll('.dark-input').forEach(input => {
        input.addEventListener('focus', (e) => { lastActiveInput = e.target; });
    });

    document.querySelectorAll('.logic-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (lastActiveInput) {
                lastActiveInput.value += e.target.dataset.char;
                lastActiveInput.focus();
                drawDecoder(); 
            }
        });
    });

    updateInterface(); 

    // --- INDESTRUCTIBLE MATH PARSER FOR SOLVER ---
    function parseBooleanExpression(expr, context) {
        if (!expr || expr.trim() === '') return 0;
        let parsed = expr.toUpperCase();
        
        // 1. Sanitize (Fix smart quotes and remove spaces)
        parsed = parsed.replace(/['"‘’`´′″]/g, "'");
        parsed = parsed.replace(/\s+/g, '');

        if (!parsed) return 0;

        // 2. Handle Bracket Inversions (e.g., (X+Y)' -> (!(X+Y)) )
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
                return 'Err'; 
            }
            safetyCount++;
        }

        // 3. Handle Variable Inversions (e.g., X' -> (!X))
        parsed = parsed.replace(/([A-Z01])'/g, "(!$1)");

        // 4. Add Implicit ANDs (e.g., XY -> X*Y)
        parsed = parsed.replace(/([A-Z01\)])([A-Z01\(])/g, '$1*$2');
        parsed = parsed.replace(/([A-Z01\)])([A-Z01\(])/g, '$1*$2');
        parsed = parsed.replace(/([A-Z01\)])([A-Z01\(])/g, '$1*$2');

        // 5. Inject Context Variables (Swap X, Y, Z for 0s and 1s)
        for (let key in context) {
            parsed = parsed.replace(new RegExp("\\b" + key + "\\b", "g"), context[key]);
        }

        // 6. Convert logic operators to JS Bitwise operators
        parsed = parsed.replace(/\*/g, "&");
        parsed = parsed.replace(/\+/g, "|");
        parsed = parsed.replace(/⊕/g, "^");

        // 7. Evaluate safely
        try {
            return new Function('return ' + parsed)() ? 1 : 0;
        } catch (e) {
            return 'Err';
        }
    }

    // --- TRUTH TABLE GENERATION ---
    const solveBtn = document.getElementById('solve-btn');
    const resultsPanel = document.getElementById('results-panel');
    const truthTable = document.getElementById('truth-table');

    solveBtn.addEventListener('click', () => {
        const size = sizeDropdown.value;
        const isAH = typeDropdown.value === 'AH';
        const n = size === '4x16' ? 4 : (size === '3x8' ? 3 : 2);
        const numOutputs = 1 << n;
        
        const eqW = n === 4 ? inputW.value.toUpperCase() : '0';
        const eqX = inputX.value.toUpperCase();
        const eqY = inputY.value.toUpperCase();
        const eqZ = n >= 3 ? inputZ.value.toUpperCase() : '0';
        const eqEn = inputEn.value.toUpperCase();
        
        const allStr = (eqW + eqX + eqY + eqZ + eqEn).replace(/[^A-Z]/g, '');
        let vars = Array.from(new Set(allStr.split(''))).sort();
        
        const originalText = solveBtn.innerText;
        solveBtn.innerText = "SOLVING...";
        solveBtn.style.background = "#22c55e"; 

        setTimeout(() => {
            solveBtn.innerText = originalText;
            solveBtn.style.background = "#4facfe"; 
            
            if (vars.length > 5) { alert("Too many variables! Please use 5 or fewer unique letters."); return; }

            let numRows = Math.pow(2, vars.length);

            // 1. Header 
            let thead = '<thead><tr>';
            vars.forEach(v => thead += `<th class="mono">${v}</th>`); 
            
            thead += `<th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">I${n-1}</th>`;
            for(let i=n-2; i>=0; i--) thead += `<th class="mono">I${i}</th>`;
            
            thead += `<th class="mono">EN</th>`;
            
            for (let y = 0; y < numOutputs; y++) {
                thead += `<th class="mono" ${y===0 ? 'style="border-left: 2px solid rgba(255,255,255,0.1);"' : ''}>Y${y}</th>`;
            }
            thead += `<th class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">STATUS</th>`;
            thead += '</tr></thead>';

            let tbody = '<tbody>';

            // 2. Body
            for (let i = 0; i < numRows; i++) {
                let context = {};
                let rowHtml = '<tr>';
                
                vars.forEach((v, index) => {
                    let bit = (i >> (vars.length - 1 - index)) & 1;
                    context[v] = bit;
                    rowHtml += `<td class="mono">${bit}</td>`;
                });

                let valW = n === 4 ? parseBooleanExpression(eqW, context) : 0;
                let valX = parseBooleanExpression(eqX, context);
                let valY = parseBooleanExpression(eqY, context);
                let valZ = n >= 3 ? parseBooleanExpression(eqZ, context) : 0;
                let valEn = parseBooleanExpression(eqEn, context);

                let iVals = n === 4 ? [valW, valX, valY, valZ] : (n === 3 ? [valX, valY, valZ] : [valX, valY]);
                let hasError = iVals.includes('Err') || valEn === 'Err';

                iVals.forEach((val, idx) => {
                    const border = idx === 0 ? 'border-left: 2px solid rgba(255,255,255,0.1); ' : '';
                    rowHtml += `<td class="mono" style="${border}color: #4facfe; font-weight:bold;">${val !== 'Err' ? val : '-'}</td>`;
                });

                rowHtml += `<td class="mono" style="color: #9aa4b2;">${valEn !== 'Err' ? valEn : '-'}</td>`;

                let outStr = "";
                let inactiveBit = isAH ? 0 : 1;
                let activeBit = isAH ? 1 : 0;
                let yOutputs = Array(numOutputs).fill(inactiveBit);

                if (valEn === 1 && !hasError) {
                    let decIndex = 0;
                    iVals.forEach(val => decIndex = (decIndex << 1) | val);
                    yOutputs[decIndex] = activeBit;
                    outStr = `<span style="color:#22c55e;">Y${decIndex} Active</span>`;
                } else if (valEn === 0 && !hasError) {
                    outStr = `<span style="color:#9aa4b2;">Disabled</span>`;
                } else {
                    yOutputs = Array(numOutputs).fill('-');
                    outStr = `<span style="color:#ef4444;">Syntax Error</span>`;
                }

                for (let y = 0; y < numOutputs; y++) {
                    let color = (yOutputs[y] === activeBit) ? "#22c55e" : "#94a3b8";
                    rowHtml += `<td class="mono" ${y===0 ? 'style="border-left: 2px solid rgba(255,255,255,0.1);"' : ''}>
                                    <span style="color:${color}; ${yOutputs[y] === activeBit ? 'font-weight:bold;' : ''}">${yOutputs[y]}</span>
                                </td>`;
                }

                rowHtml += `<td class="mono" style="border-left: 2px solid rgba(255,255,255,0.1);">${outStr}</td>`;
                rowHtml += '</tr>';
                tbody += rowHtml;
            }
            tbody += '</tbody>';

            truthTable.innerHTML = thead + tbody;
            resultsPanel.style.display = 'block';
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

        }, 400); 
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('solve-btn').click();
    });

    // --- MODAL FUNCTION TABLE GENERATOR ---
    const diagramPanel = document.getElementById('diagram-panel');
    const modal = document.getElementById('function-table-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalTable = document.getElementById('modal-table');
    const modalTitle = document.getElementById('modal-title');

    diagramPanel.addEventListener('click', () => {
        const size = sizeDropdown.value;
        const isAH = typeDropdown.value === 'AH';
        const n = size === '4x16' ? 4 : (size === '3x8' ? 3 : 2);
        const numOutputs = 1 << n;
        const inactive = isAH ? 0 : 1;
        const active = isAH ? 1 : 0;

        modalTitle.textContent = `${n}-to-${numOutputs} Decoder Function Table (${isAH ? 'Active High' : 'Active Low'})`;

        let html = '<thead><tr>';
        html += `<th class="mono">EN</th>`;
        for(let i=n-1; i>=0; i--) html += `<th class="mono">I${i}</th>`;
        
        for(let i=0; i<numOutputs; i++) {
            html += `<th class="mono" ${i===0 ? 'style="border-left: 2px solid rgba(255,255,255,0.1);"' : ''}>Y${i}</th>`;
        }
        html += '</tr></thead><tbody>';

        html += `<tr><td class="mono" style="color:#ef4444; font-weight:bold;">0</td>`;
        for(let i=0; i<n; i++) html += `<td class="mono" style="color:#94a3b8;">X</td>`;
        for(let i=0; i<numOutputs; i++) {
            html += `<td class="mono" ${i===0 ? 'style="border-left: 2px solid rgba(255,255,255,0.1);"' : ''}>${inactive}</td>`;
        }
        html += `</tr>`;

        for(let i=0; i<numOutputs; i++) {
            html += `<tr><td class="mono" style="color:#22c55e; font-weight:bold;">1</td>`;
            for(let bit=n-1; bit>=0; bit--) {
                html += `<td class="mono">${(i >> bit) & 1}</td>`;
            }
            
            for(let y=0; y<numOutputs; y++) {
                let val = (y === i) ? active : inactive;
                let color = (val === active) ? (isAH ? "#22c55e" : "#ef4444") : "#94a3b8";
                html += `<td class="mono" ${y===0 ? 'style="border-left: 2px solid rgba(255,255,255,0.1);"' : ''} style="color:${color}; ${val===active ? 'font-weight:bold;' : ''}">${val}</td>`;
            }
            html += `</tr>`;
        }
        
        html += '</tbody>';
        modalTable.innerHTML = html;
        modal.style.display = "flex";
    });

    closeBtn.addEventListener('click', () => { modal.style.display = "none"; });
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none';
    });
});