(() => {
  if (typeof TRANSLATIONS === 'undefined') return;
  Object.assign(TRANSLATIONS, {
    almeida1819:{id:'almeida1819',name:'Almeida 1819 (Bíblia Livre)',language:'Português',rights:'Public Domain',type:'midvash',lang:'pt',slug:'almeida-livre'},
    svd:{id:'svd',name:'الكتاب المقدس فان دايك',language:'العربية',rights:'Public Domain',type:'midvash',lang:'ar',slug:'svd'}
  });
  const select=document.querySelector('#translationSelect');
  if(!select) return;
  const additions=[['almeida1819','Almeida 1819'],['svd','Smith–Van Dyck']];
  for(const [value,label] of additions){
    if(!select.querySelector(`option[value="${value}"]`)){
      const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);
    }
  }
  let saved='';
  try{saved=localStorage.getItem('bible-reader-translation')||'';}catch(_){}
  const requested=window.__BIBLE_TRANSLATION__ || new URLSearchParams(location.search).get('translation') || saved;
  if(requested && TRANSLATIONS[requested]){
    try{localStorage.setItem('bible-reader-translation',requested)}catch(_){}
    if(select.value!==requested){select.value=requested;select.dispatchEvent(new Event('change',{bubbles:true}));}
  }
})();
