(() => {
  const verseSelect=document.querySelector("#verseSelect"),verses=document.querySelector("#verses"),comparePanel=document.querySelector("#comparePanel"),compareRows=document.querySelector("#compareRows"),chapterTitle=document.querySelector("#chapterTitle");
  if(!verseSelect||!verses||!chapterTitle)return;
  const bookSelect=document.querySelector("#bookSelect"),chapterSelect=document.querySelector("#chapterSelect"),translationSelect=document.querySelector("#translationSelect");
  let highlightTimer=null,lastRenderedReference="";

  function pickerOpen(){return document.activeElement===verseSelect;}

  function populateVerseSelect(){
    if(pickerOpen()) return;
    const verseElements=[...verses.querySelectorAll(".verse[data-verse]")];
    // Ignore the transient empty reader while a different book is loading.
    if(!verseElements.length)return;
    const reference=[translationSelect?.value,bookSelect?.value,chapterSelect?.value].join(":");
    const referenceChanged=reference!==lastRenderedReference;
    const previous=verseSelect.value;
    const nextValues=verseElements.map(element=>String(Number(element.dataset.verse))).filter(value=>value!=="0");
    const currentValues=[...verseSelect.options].map(option=>option.value);
    if(nextValues.length===currentValues.length&&nextValues.every((value,index)=>value===currentValues[index])){
      if(referenceChanged)verseSelect.value="1";
      lastRenderedReference=reference;
      return;
    }
    verseSelect.innerHTML="";
    verseElements.forEach(element=>{const verse=Number(element.dataset.verse);if(!verse)return;const option=document.createElement("option");option.value=String(verse);option.textContent=`${verse}절`;verseSelect.append(option)});
    const stillExists=!referenceChanged&&previous&&verseElements.some(element=>element.dataset.verse===previous);
    verseSelect.value=stillExists?previous:"1";
    lastRenderedReference=reference;
    window.BibleI18n?.apply?.();
  }

  function schedulePopulate(){
    if(pickerOpen()) return;
    requestAnimationFrame(populateVerseSelect);
  }

  function clearHighlights(){document.querySelectorAll(".verse.verse-picked,.compare-row.verse-picked").forEach(node=>node.classList.remove("verse-picked"));if(highlightTimer)clearTimeout(highlightTimer)}
  function jumpToVerse(verse){clearHighlights();if(!verse)return;const compareVisible=comparePanel&&!comparePanel.hidden,selector=`[data-verse="${CSS.escape(String(verse))}"]`,target=compareVisible?compareRows?.querySelector(`.compare-row${selector}`):verses.querySelector(`.verse${selector}`);if(!target)return;target.classList.add("verse-picked");target.scrollIntoView({behavior:"smooth",block:"center"});highlightTimer=setTimeout(()=>target.classList.remove("verse-picked"),3500)}

  verseSelect.addEventListener("change",()=>jumpToVerse(verseSelect.value));
  verseSelect.addEventListener("blur",()=>setTimeout(populateVerseSelect,0));
  const observer=new MutationObserver(schedulePopulate);
  observer.observe(verses,{childList:true,subtree:true});
  window.BibleVersePicker={sync:populateVerseSelect};
  populateVerseSelect();
})();