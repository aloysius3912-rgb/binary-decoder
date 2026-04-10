document.addEventListener('DOMContentLoaded', () => {

  /* ========== Navigation Highlighting ========== */
  const navLinks = document.querySelectorAll('.side-nav-link');
  const sections = document.querySelectorAll('section[id]');
  
  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === current) {
        link.classList.add('active');
      }
    });
  }

/* ========== "Contents" Back to Top ========== */
  const contentsHeader = document.querySelector('.side-nav-header');
  if (contentsHeader) {
      contentsHeader.addEventListener('click', (e) => {
          e.preventDefault();
          // This forces the browser to look at the very top header and smoothly scroll up to it
          document.querySelector('.main-header').scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
          });
      });
  }
  
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  /* ========== Decoder Logic ========== */
  const polInputs = Array.from(document.querySelectorAll('input[name="pol"]'));
  const getPolarity = () => polInputs.find(r => r.checked)?.value || 'high';

  function computeOneHot(idx, size, pol, enabled=true){
    if(!enabled){const fill=(pol==='high'?0:1);return new Array(size).fill(fill);}
    const arr=new Array(size).fill(pol==='high'?0:1);arr[idx]=(pol==='high'?1:0);return arr;
  }
  
  function bindBitButton(id,onChange){
    const el=document.getElementById(id);
    if(!el) return () => 0;
    const set=(v)=>{el.dataset.value=String(v);el.textContent=String(v);el.classList.toggle('on',v==1)};
    el.addEventListener('click',()=>{const v=el.dataset.value==='1'?0:1;set(v);onChange();});
    set(Number(el.dataset.value||0));return ()=>Number(el.dataset.value||0);
  }

  /* 2→4 + EN */
  const getA24 = bindBitButton('bitA24', update24);
  const getB24 = bindBitButton('bitB24', update24);
  const enRadios = Array.from(document.querySelectorAll('input[name="en24"]'));
  const ab24 = document.getElementById('ab24');
  const ystr24 = document.getElementById('ystr24');
  const tbody24 = document.getElementById('tbody24');
  const rows24 = [];
  
  if (tbody24) {
      for(let a=0;a<2;a++)for(let b=0;b<2;b++){
        const tr=document.createElement('tr');
        tr.innerHTML=[`<td class="mono" data-en>1</td>`,`<td class="mono">${a}</td>`,`<td class="mono">${b}</td>`,...Array.from({length:4},(_,i)=>`<td class="mono" data-y="${i}">0</td>`)].join('');
        tbody24.appendChild(tr);
        rows24.push({a,b,tr});
      }
  }
  
  function getEN(){
      const checked = enRadios.find(r=>r.checked);
      return checked ? checked.value === '1' : true;
  }
  
  function update24(){
    if(!ab24) return;
    const A=getA24(),B=getB24();
    const pol=getPolarity();
    const en=getEN();
    const idx=(A<<1)|B;
    const arr=computeOneHot(idx,4,pol,en);
    ab24.textContent=`${A}${B}`;
    ystr24.textContent=arr.map(v=>v|0).join('');
    rows24.forEach(({a,b,tr})=>{
      const rIdx=(a<<1)|b;
      const rArr=computeOneHot(rIdx,4,pol,en);
      tr.classList.toggle('active',en&&a===A&&b===B);
      tr.querySelector('[data-en]').textContent=en?'1':'0';
      tr.querySelectorAll('td[data-y]').forEach((td,i)=>td.textContent=rArr[i]);
    });
  }

  /* 3→8 */
  const getA = bindBitButton('bitA',()=>{update38();});
  const getB = bindBitButton('bitB',()=>{update38();});
  const getC = bindBitButton('bitC',()=>{update38();});
  const abc = document.getElementById('abc');
  const ystr = document.getElementById('ystr');
  const tbody38 = document.getElementById('tbody38');
  const rows38 = [];
  
  if(tbody38) {
      for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++){
        const tr=document.createElement('tr');
        tr.innerHTML=[`<td class="mono">${a}</td>`,`<td class="mono">${b}</td>`,`<td class="mono">${c}</td>`,...Array.from({length:8},(_,i)=>`<td class="mono" data-y="${i}">0</td>`)].join('');
        tbody38.appendChild(tr);
        rows38.push({a,b,c,tr});
      }
  }
  
  function update38(){
    if(!abc) return;
    const A=getA(),B=getB(),C=getC();
    const pol=getPolarity();
    const idx=(A<<2)|(B<<1)|C;
    const arr=computeOneHot(idx,8,pol,true);
    abc.textContent=`${A}${B}${C}`;
    ystr.textContent=arr.map(v=>v|0).join('');
    rows38.forEach(({a,b,c,tr})=>{
      const rIdx=(a<<2)|(b<<1)|c;
      const rArr=computeOneHot(rIdx,8,pol,true);
      tr.classList.toggle('active',a===A&&b===B&&c===C);
      tr.querySelectorAll('td[data-y]').forEach((td,i)=>td.textContent=rArr[i]);
    });
  }

  polInputs.forEach(el=>el.addEventListener('change',()=>{update24();update38();}));
  enRadios.forEach(el=>el.addEventListener('change',update24));
  
  // Initialize on load
  update24();
  update38();
});

/* Sample questions checker */
function checkQ(qid, correct){
  const sel = document.querySelector(`input[name="${qid}"]:checked`);
  const out = document.getElementById(qid+'r');
  if(!sel){ out.textContent='Select an option.'; out.style.color='#ef4444'; return; }
  if(sel.value===correct){ out.textContent='Correct ✓'; out.style.color='#22c55e'; }
  else{ out.textContent=`Incorrect. Expected ${correct}`; out.style.color='#ef4444'; }
}
window.checkQ = checkQ;