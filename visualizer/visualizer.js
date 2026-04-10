document.addEventListener('DOMContentLoaded', () => {

    // --- SETUP HTML ELEMENTS ---
    const decoderSize = document.getElementById('decoder-size');
    const logicType = document.getElementById('logic-type');

    const inpW = document.getElementById('inp-w');
    const inpX = document.getElementById('inp-x');
    const inpY = document.getElementById('inp-y');
    const inpZ = document.getElementById('inp-z');
    const inpEn = document.getElementById('inp-en');
    
    const colW = document.getElementById('col-w');
    const colZ = document.getElementById('col-z'); 

    const lblW = document.getElementById('lbl-w');
    const lblX = document.getElementById('lbl-x');
    const lblY = document.getElementById('lbl-y');
    const lblZ = document.getElementById('lbl-z');

    const errorDiv = document.getElementById('input-error');
    const mintermBtns = document.querySelectorAll('.minterm-btn');
    const container = document.getElementById('diagram-container');

    // Failsafe HTML Sync Check
    if (!container || !inpW) {
        if (container) container.innerHTML = `<div style="color:#ef4444; padding: 40px; text-align:center; font-family:Montserrat; font-weight:bold; font-size:1.2rem;">⚠️ Error: HTML and JS do not match.<br><br>Please make sure you pasted the new visualizer.html code and pressed Ctrl+S to save!</div>`;
        return; 
    }

    let currentN = 3;

    // --- INPUT VALIDATION ENGINE ---
    // FIX: Corrected the broken EN regex from /^?$/ to /^[01]?$/
    function validateInputs() {
        let isValid = true;
        let errorMsg = "";

        const allowedLogic = /^[wxyz01+\-'\(\)⊕*\s]*$/i;
        
        [inpW, inpX, inpY, inpZ].forEach(inp => {
            if (!allowedLogic.test(inp.value)) {
                isValid = false;
                inp.style.borderColor = "#ef4444"; 
                errorMsg = "Invalid input! Only W, X, Y, Z, 0, 1 and + - ' ( ) ⊕ * are allowed.";
            } else {
                inp.style.borderColor = "";
            }
        });

        // FIXED: was /^?$/ which is a broken regex that never matches
        const allowedEn = /^[01]?$/;
        if (!allowedEn.test(inpEn.value)) {
            isValid = false;
            inpEn.style.borderColor = "#ef4444";
            errorMsg = "Invalid input! EN must be 0 or 1.";
        } else {
            inpEn.style.borderColor = "";
        }

        errorDiv.textContent = errorMsg;
        return isValid;
    }

    // --- DYNAMIC UI CONFIGURATION ---
    function updateUI() {
        const size = decoderSize.value;
        currentN = size === '4x16' ? 4 : (size === '3x8' ? 3 : 2);
        
        // FIX: Show/Hide Input Columns correctly per decoder size
        // 4-to-16: show W, X, Y, Z
        // 3-to-8:  hide W, show X, Y, Z
        // 2-to-4:  hide W and Z, show only X and Y
        colW.style.display = currentN === 4 ? 'flex' : 'none';
        colZ.style.display = currentN >= 3 ? 'flex' : 'none';

        // Update Labels (I3, I2, I1, I0 based on size)
        if (currentN === 4) {
            lblW.textContent = "I3";
            lblX.textContent = "I2";
            lblY.textContent = "I1";
            lblZ.textContent = "I0";
        } else if (currentN === 3) {
            lblX.textContent = "I2";
            lblY.textContent = "I1";
            lblZ.textContent = "I0";
        } else {
            // 2-to-4: only X and Y are visible
            lblX.textContent = "I1";
            lblY.textContent = "I0";
        }

        // Show/Hide Minterm Buttons and deselect any that fall outside range
        const maxMinterms = 1 << currentN;
        mintermBtns.forEach(btn => {
            const m = parseInt(btn.dataset.m);
            if (m >= maxMinterms) {
                btn.style.display = 'none';
                btn.classList.remove('active');
            } else {
                btn.style.display = 'inline-block';
            }
        });

        drawCircuit();
    }

    // --- DYNAMIC SVG CIRCUIT GENERATOR ---
    function drawCircuit() {
        // Always draw — validation errors show in errorDiv but don't block the diagram
        const isLow = logicType.value === 'low';
        const n = currentN;
        const maxPins = 1 << n;
        
        const h = n === 4 ? 650 : 450;
        const decH = n === 4 ? 540 : (n === 3 ? 350 : 250);
        const decW = 200;
        const decX = 120, decY = 50; 
        const gateX = 540, gateY = h / 2;
        const pinExt = 25; 

        const wireColor = "#64748b";
        const wireActive = "#ffffff";
        const textColor = "#9aa4b2";
        const boxFill = "#1e293b";
        const boxStroke = "#334155";
        
        let svg = `<svg style="width: 100%; min-height: ${h}px;" viewBox="40 10 660 ${h}">`;

        // 1. Get Active Minterms to Route Wires
        let activeMinterms = [];
        mintermBtns.forEach(btn => {
            if (btn.classList.contains('active')) activeMinterms.push(parseInt(btn.dataset.m));
        });

        // 2. Draw Wires (Curved Bezier Lines to Logic Gate)
        const startX = decX + decW + pinExt + (isLow ? 8 : 0);
        
        activeMinterms.forEach((pinIdx, arrayIdx) => {
            const pinY = decY + 85 + (pinIdx * ((decH - 120) / Math.max(1, maxPins - 1)));
            const spread = n === 4 ? 12 : 20; 
            const totalHeight = (activeMinterms.length - 1) * spread;
            const targetY = (gateY - (totalHeight / 2)) + (arrayIdx * spread);

            svg += `<path d="M ${startX} ${pinY} C ${startX+60} ${pinY}, ${gateX-60} ${targetY}, ${gateX} ${targetY}" 
                      fill="none" stroke="${wireActive}" stroke-width="2.5" style="filter: drop-shadow(0px 0px 5px rgba(79, 172, 254, 0.8));" />`;
            
            svg += `<circle cx="${startX}" cy="${pinY}" r="4" fill="${wireActive}" style="filter: drop-shadow(0px 0px 4px rgba(79, 172, 254, 0.8));" />`;
        });

        // 3. Draw Main Decoder Box
        svg += `<rect x="${decX}" y="${decY}" width="${decW}" height="${decH}" rx="12" fill="${boxFill}" stroke="${boxStroke}" stroke-width="3"/>`;
        svg += `<text x="${decX + decW/2}" y="${decY + 40}" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="bold" font-size="20" fill="#fff">${n}-to-${maxPins} Decoder</text>`;
        svg += `<text x="${decX + decW/2}" y="${decY + 60}" text-anchor="middle" font-family="monospace" font-size="14" fill="${isLow ? '#ef4444' : '#64748b'}">${isLow ? 'AL' : 'AH'}</text>`;

        // 4. Draw Output Pins
        for(let i = 0; i < maxPins; i++) {
            const y = decY + 85 + (i * ((decH - 120) / Math.max(1, maxPins - 1)));
            svg += `<line x1="${decX+decW}" y1="${y}" x2="${decX+decW+pinExt}" y2="${y}" stroke="${wireColor}" stroke-width="2.5"/>`;
            svg += `<text x="${decX+decW-10}" y="${y+5}" text-anchor="end" font-family="monospace" font-size="${n===4?13:16}" font-weight="bold" fill="${textColor}" ${isLow ? 'text-decoration="overline"' : ''}>Y${i}</text>`;
            if(isLow) svg += `<circle cx="${decX+decW+5}" cy="${y}" r="4" fill="${boxFill}" stroke="${wireColor}" stroke-width="2.5"/>`;
        }

        // 5. Draw Input Pins — use correct variable names per decoder size
        // Apply simplifyVar so diagram labels reflect double-negation cancellation (X'' → X)
        const currentInputs = n === 4
            ? [inpW.value, inpX.value, inpY.value, inpZ.value]
            : n === 3
                ? [inpX.value, inpY.value, inpZ.value]
                : [inpX.value, inpY.value]; // 2-to-4 uses only X and Y

        for(let i = 0; i < n; i++) {
            const spacing = decH / (n + 1);
            const pinY = decY + ((i + 1) * spacing); 
            
            svg += `<line x1="${decX}" y1="${pinY}" x2="${decX - 40}" y2="${pinY}" stroke="${wireColor}" stroke-width="3"/>`;
            svg += `<text x="${decX + 15}" y="${pinY + 5}" font-family="monospace" font-weight="bold" font-size="16" fill="${textColor}">I${n-1-i}</text>`;
            
            // Simplify the label: X'' → X, X''' → X', etc.
            let eqText = simplifyVar(currentInputs[i].toUpperCase()) || "?";
            if (eqText.length > 5) eqText = eqText.substring(0, 4) + ".."; 
            svg += `<text x="${decX - 50}" y="${pinY + 6}" text-anchor="end" font-family="monospace" font-weight="bold" font-size="20" fill="#4facfe">${eqText}</text>`;
        }

        // 6. Draw EN Pin
        svg += `<text x="${decX + decW/2 - 15}" y="${decY + decH - 10}" fill="${textColor}" font-size="14" font-weight="bold" font-family="monospace">EN</text>`;
        svg += `<line x1="${decX + decW/2}" y1="${decY + decH}" x2="${decX + decW/2}" y2="${decY + decH + 30}" stroke="${wireColor}" stroke-width="3"/>`;
        svg += `<text x="${decX + decW/2 + 15}" y="${decY + decH + 25}" fill="#4facfe" font-weight="bold" font-size="20" font-family="monospace">${inpEn.value || "1"}</text>`;

        // 7. Draw Logic Gate (faded if no minterms selected)
        const gateOpacity = activeMinterms.length === 0 ? "0.2" : "1";
        svg += `<g transform="translate(${gateX}, ${gateY - 40})" opacity="${gateOpacity}">`;
        
        if (!isLow) {
            // OR gate shape
            svg += `<path d="M 0,0 Q 30,0 60,40 Q 30,80 0,80 Q 20,40 0,0 Z" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
            svg += `<line x1="60" y1="40" x2="100" y2="40" stroke="${wireColor}" stroke-width="3"/>`;
        } else {
            // NAND gate shape
            svg += `<path d="M 0,0 L 30,0 Q 60,0 60,40 Q 60,80 30,80 L 0,80 Z" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
            svg += `<circle cx="66" cy="40" r="6" fill="${boxFill}" stroke="#4facfe" stroke-width="3"/>`;
            svg += `<line x1="72" y1="40" x2="100" y2="40" stroke="${wireColor}" stroke-width="3"/>`;
        }
        svg += `<text x="110" y="46" fill="#22c55e" font-size="24" font-weight="bold" font-family="monospace">F</text>`;
        svg += `</g>`;

        svg += `</svg>`;
        container.innerHTML = svg;
        
        updateFunctionText(activeMinterms);
    }

    // --- BOOLEAN STRING GENERATOR (F = ...) ---

    // Collapse any number of trailing primes using double-negation:
    // even count → remove all (X'' = X), odd count → keep one (X''' = X')
    function simplifyVar(v) {
        const base = v.replace(/'+$/, '');          // strip all trailing primes
        const primeCount = v.length - base.length;  // how many were stripped
        return primeCount % 2 === 0 ? base : base + "'";
    }

    // Toggle one negation, then simplify so X'' → X, X''' → X', etc.
    function negateVar(variable) {
        const simplified = simplifyVar(variable);
        if (simplified.endsWith("'")) return simplified.slice(0, -1);
        return simplified + "'";
    }

    function updateFunctionText(activeMinterms) {
        const textObj = document.getElementById('function-text');
        const n = currentN;

        // Simplify user-typed values before using them (handles X'' → X, etc.)
        const vW = simplifyVar(inpW.value.toUpperCase()) || 'W';
        const vX = simplifyVar(inpX.value.toUpperCase()) || 'X';
        const vY = simplifyVar(inpY.value.toUpperCase()) || 'Y';
        const vZ = simplifyVar(inpZ.value.toUpperCase()) || 'Z';

        if (activeMinterms.length === 0) {
            textObj.textContent = `F = 0`;
            return;
        }

        let terms = activeMinterms.map(m => {
            let term = "";
            if (n === 4) {
                term += (m & 8) ? vW : negateVar(vW);
                term += (m & 4) ? vX : negateVar(vX);
                term += (m & 2) ? vY : negateVar(vY);
                term += (m & 1) ? vZ : negateVar(vZ);
            } else if (n === 3) {
                term += (m & 4) ? vX : negateVar(vX);
                term += (m & 2) ? vY : negateVar(vY);
                term += (m & 1) ? vZ : negateVar(vZ);
            } else {
                // 2-to-4: uses I1 = X, I0 = Y
                term += (m & 2) ? vX : negateVar(vX);
                term += (m & 1) ? vY : negateVar(vY);
            }
            return term;
        });

        textObj.textContent = `F = ${terms.join(' + ')}`;
    }

    // --- EVENT LISTENERS ---
    decoderSize.addEventListener('change', updateUI);
    logicType.addEventListener('change', drawCircuit);

    [inpW, inpX, inpY, inpZ].forEach(inp => {
        inp.addEventListener('input', () => {
            // Simplify live: X'' → X, X''' → X', etc.
            const simplified = simplifyVar(inp.value.toUpperCase());
            if (simplified !== inp.value.toUpperCase()) {
                const cursor = inp.selectionStart;
                inp.value = simplified;
                inp.setSelectionRange(cursor, cursor);
            }
            validateInputs();
            drawCircuit();
        });
    });

    inpEn.addEventListener('input', () => {
        validateInputs();
        drawCircuit();
    });

    mintermBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            drawCircuit();
        });
    });

    // Initialize on load
    updateUI();
});