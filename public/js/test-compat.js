(function(g){
  if(g.__TestCompatLoaded) return; g.__TestCompatLoaded = true;
  // Fallback buildPrompt
  if(typeof g.buildPrompt !== 'function'){
    g.buildPrompt = function(){
      return '你是樂譜與歌詞辨識專家\n\n|F |C |Dm7 |Bb |\n\n請將和弦行置於上方，歌詞行置於下方，只輸出純文字。';
    };
  }
  // Fallback tokensToText
  if(typeof g.tokensToText !== 'function'){
    g.tokensToText = function(tokens){
      if(!Array.isArray(tokens)) return '';
      return tokens.map(t=>t.text||'').join(' ');
    };
  }
})(window);