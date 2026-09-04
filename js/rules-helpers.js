const escapeMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};

export const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>escapeMap[c]);
export const mark=(text,cls)=>text?'<span class="'+cls+'">'+escapeHtml(text)+'</span>':'';

export function highlightLast(word,suffix){
  return escapeHtml(word.slice(0,-suffix.length))+mark(suffix,'old-part');
}

export function highlightSuffix(word,suffix){
  return word.endsWith(suffix)
    ? escapeHtml(word.slice(0,-suffix.length))+mark(suffix,'old-part')
    : escapeHtml(word);
}

export function formLine(label,content){
  return '<div class="form-line"><span class="form-mini-label">'+escapeHtml(label)+'</span><span>'+content+'</span></div>';
}

export function formPair(teContent,taContent){
  return '<div class="form-pair">'+formLine('て形',teContent)+formLine('た形',taContent)+'</div>';
}

export function highlightChanged(source,final){
  const a=[...source],b=[...final];
  let i=0;
  while(i<a.length&&i<b.length&&a[i]===b[i]) i++;
  return escapeHtml(b.slice(0,i).join(''))+mark(b.slice(i).join(''),'new-part');
}
