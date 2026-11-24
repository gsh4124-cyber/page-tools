(() => {
  // Aggregate one completed use only. Never include the throw result or entered content.
  window.RandomPickerToolMetrics={record(tool){
    if(!['yut','dice'].includes(tool)||location.hostname!=='random-ppobgi.pages.dev'||
      new URLSearchParams(location.search).has('qa')||navigator.webdriver||/HeadlessChrome|Playwright/i.test(navigator.userAgent||''))return;
    try{fetch('/api/tool-uses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tool}),credentials:'omit',cache:'no-store',keepalive:true}).catch(()=>{});}catch{}
  }};
})();
