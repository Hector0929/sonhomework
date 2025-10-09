// AI / 一般辨識 按鈕啟用與模擬流程 Guard 腳本
(function(g){
  if(g.__RecognizeAIGuardLoaded) return; g.__RecognizeAIGuardLoaded = true;
  function id(x){ return document.getElementById(x); }
  function syncRecognizeBtn(){
    var fi=id('file-input'); var btn=id('recognize-btn'); if(!fi||!btn) return;
    if(fi.files && fi.files.length) btn.removeAttribute('disabled'); else btn.setAttribute('disabled','');
  }
  function syncAI(){
  var key=id('api-key'); var ck=id('use-gemini-ai'); var btn=id('recognize-ai-btn');
    if(!btn) return; if(ck&&ck.checked && key && key.value.trim()) btn.removeAttribute('disabled'); else btn.setAttribute('disabled','');
  }
  function simulateAI(){
    var status=id('gemini-status'); if(status) status.textContent='AI 模擬辨識執行中...';
    g.AppState = g.AppState || {}; if(!g.AppState.tokens||!g.AppState.tokens.length){ g.AppState.tokens=[{text:'F',kind:'chord'},{text:'C',kind:'chord'},{text:'歌 詞 範 例',kind:'lyric'}]; }
    setTimeout(()=>{ var s=id('recognition-status'); if(s) s.textContent='(完成: '+g.AppState.tokens.length+' 項)'; if(status) status.textContent='AI 模擬完成'; document.dispatchEvent(new CustomEvent('app:recognition-finished')); },300);
  }
  function wire(){
    var fi=id('file-input'); fi&&fi.addEventListener('change', syncRecognizeBtn);
  var key=id('api-key'); key&&key.addEventListener('input', syncAI);
    var ck=id('use-gemini-ai'); ck&&ck.addEventListener('change', syncAI);
    var aiBtn=id('recognize-ai-btn'); if(aiBtn && !aiBtn.__aiBound){ aiBtn.addEventListener('click', simulateAI); aiBtn.__aiBound=true; }
    var recBtn=id('recognize-btn'); if(recBtn && !recBtn.__recBound){ recBtn.addEventListener('click', ()=>{ var s=id('recognition-status'); if(s) s.textContent='(完成: '+(g.AppState?.tokens?.length||0)+' 項)'; }); recBtn.__recBound=true; }
    syncRecognizeBtn(); syncAI();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire, {once:true}); else wire();
})(window);