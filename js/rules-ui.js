import{VERB_TYPES,lastChar,dropLast,iStem,aStem,eStem}from'./conjugation.js';
const el=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),mark=(s,c)=>s?`<span class="${c}">${esc(s)}</span>`:'';
export function initRules({DATA,FORM_META,ruleExamples,wordById,conjugator}){
 const{conjugateVerb,answerFor}=conjugator,F=ruleExamples.families,S={type:'g1',family:'masuFamily',pattern:0,step:1};
 const ws=ids=>ids.map(id=>wordById.get(id)?.lemma).filter(Boolean),families=t=>VERB_TYPES.has(t)?['masuFamily','naiFamily','teTaFamily','dict','potential']:DATA[t].forms;
 function patterns(){
  if(S.type==='g1'){
   if(S.family==='teTaFamily')return ruleExamples.g1.teTaPatterns.map(p=>({...p,words:ws(p.wordIds)}));
   return ruleExamples.g1.endingOrder.map(e=>{let w=ws(ruleExamples.g1.endingExamples[e]||[]);return{ending:e,words:w,label:S.family==='dict'&&w[0]?`${conjugateVerb(w[0],'g1','masu')} → ${w[0]}`:e}})
  }
  if(S.type==='g2')return ruleExamples.g2.patterns.map(p=>({...p,words:ws(p.wordIds)}));
  if(S.type==='g3')return ruleExamples.g3.patterns.map(p=>({...p,words:ws(p.wordIds)}));
  return ws(ruleExamples.adjectives[S.type].wordIds).map(w=>({label:w,words:[w]}));
 }
 function renderRulePage(){
  let box=el('ruleTypeTabs');box.innerHTML='';
  for(const[k,d]of Object.entries(DATA)){let b=document.createElement('button');b.className='tab'+(S.type===k?' active':'');b.textContent=d.label;b.setAttribute('aria-pressed',S.type===k);b.onclick=()=>{S.type=k;S.family=VERB_TYPES.has(k)?'masuFamily':DATA[k].forms[0];S.pattern=0;S.step=1;renderRulePage()};box.appendChild(b)}
  box=el('ruleFamilyChips');box.innerHTML='';el('ruleFamilyLabel').textContent=VERB_TYPES.has(S.type)?'2　ルールを えらぶ':'2　かたちを えらぶ';
  for(const f of families(S.type)){let b=document.createElement('button');b.className='chip'+(S.family===f?' active':'');b.textContent=VERB_TYPES.has(S.type)?F[f].label:FORM_META[f].label;b.setAttribute('aria-pressed',S.family===f);b.onclick=()=>{S.family=f;S.pattern=0;S.step=1;renderRulePage()};box.appendChild(b)}
  const ps=patterns();box=el('rulePatternChips');box.innerHTML='';el('rulePatternLabel').textContent=S.type==='g1'?'3　へんかを えらぶ':S.type==='g3'?'3　れいを えらぶ':S.type==='g2'?'3　れい':'3　れいを えらぶ';
  ps.forEach((p,i)=>{let b=document.createElement('button');b.className='chip'+(S.pattern===i?' active':'');b.textContent=p.label;b.setAttribute('aria-pressed',S.pattern===i);b.onclick=()=>{S.pattern=i;S.step=1;[...box.querySelectorAll('.chip')].forEach((x,j)=>{x.classList.toggle('active',j===i);x.setAttribute('aria-pressed',j===i)});renderSteps()};box.appendChild(b)});el('rulePatternPanel').hidden=ps.length<=1&&S.type==='g2';renderSteps()
 }
 const last=(w,s)=>esc(w.slice(0,-s.length))+mark(s,'old-part'),suf=(w,s)=>w.endsWith(s)?esc(w.slice(0,-s.length))+mark(s,'old-part'):esc(w),changed=(a,b)=>{let A=[...a],B=[...b],i=0;while(i<A.length&&i<B.length&&A[i]===B[i])i++;return esc(B.slice(0,i).join(''))+mark(B.slice(i).join(''),'new-part')},line=(l,c)=>`<div class="form-line"><span class="form-mini-label">${esc(l)}</span><span>${c}</span></div>`,pair=(a,b)=>`<div class="form-pair">${line('て形',a)}${line('た形',b)}</div>`,note=f=>F[f]?.note||'';
 function g1(p){
  const f=S.family,w=p.words;
  if(f==='teTaFamily')return{title:'1グループ　／　て・た系',intro:p.special?'「いく」は とくべつです。':'へんかを みます。',familyNote:note(f),special:!!p.special,s1:w.map(x=>last(x,lastChar(x))),s2:[line('て形',mark(p.label,'old-part')+' → '+mark(p.te,'new-part')),line('た形',mark(p.label,'old-part')+' → '+mark(p.ta,'new-part'))],s3:w.map(x=>pair(changed(x,conjugateVerb(x,'g1','te')),changed(x,conjugateVerb(x,'g1','ta'))),n:['ここを みる','て形・た形','できあがり'],summary:pair(mark(p.label,'old-part')+' → '+mark(p.te,'new-part'),mark(p.label,'old-part')+' → '+mark(p.ta,'new-part'))};
  const e=p.ending;
  if(f==='dict'){let src=w.map(x=>conjugateVerb(x,'g1','masu'));return{title:'1グループ　／　じしょ形',intro:'へんかを みます。',familyNote:note(f),special:false,s1:src.map(x=>suf(x,iStem[e]+'ます')),s2:[mark(iStem[e]+'ます','old-part')+' → '+mark(e,'new-part')],s3:w.map((x,i)=>changed(src[i],x)),n:['ここを みる',iStem[e]+'ます → '+e,'できあがり'],summary:mark(iStem[e]+'ます','old-part')+' → '+mark(e,'new-part')}}
  let mp=f==='masuFamily'?iStem:f==='naiFamily'?aStem:eStem,r=mp[e],form=f==='masuFamily'?'masu':f==='naiFamily'?'nai':'potential';return{title:`1グループ　／　${F[f].label}`,intro:'へんかを みます。',familyNote:note(f),special:false,s1:w.map(x=>last(x,e)),s2:[mark(e,'old-part')+' → '+mark(r,'new-part')],s3:w.map(x=>changed(x,conjugateVerb(x,'g1',form))),n:['ここを みる',e+' → '+r,'できあがり'],summary:mark(e,'old-part')+' → '+mark(r,'new-part')}
 }
 function g2(p){
  const f=S.family,w=p.words;
  if(f==='teTaFamily')return{title:'2グループ　／　て・た系',intro:'へんかを みます。',familyNote:note(f),special:false,s1:w.map(x=>last(x,'る')),s2:[line('て形',mark('る','old-part')+' → '+mark('て','new-part')),line('た形',mark('る','old-part')+' → '+mark('た','new-part'))],s3:w.map(x=>pair(changed(x,conjugateVerb(x,'g2','te')),changed(x,conjugateVerb(x,'g2','ta'))),n:['ここを みる','て形・た形','できあがり'],summary:pair(mark('る','old-part')+' → '+mark('て','new-part'),mark('る','old-part')+' → '+mark('た','new-part'))};
  if(f==='dict'){let src=w.map(x=>conjugateVerb(x,'g2','masu'));return{title:'2グループ　／　じしょ形',intro:'へんかを みます。',familyNote:note(f),special:false,s1:src.map(x=>suf(x,'ます')),s2:[mark('ます','old-part')+' → '+mark('る','new-part')],s3:w.map((x,i)=>changed(src[i],x)),n:['ここを みる','ます → る','できあがり'],summary:mark('ます','old-part')+' → '+mark('る','new-part')}}
  let form=f==='masuFamily'?'masu':f==='naiFamily'?'nai':'potential',to=f==='masuFamily'?'ます':f==='naiFamily'?'ない':'られる';return{title:`2グループ　／　${F[f].label}`,intro:'へんかを みます。',familyNote:note(f),special:false,s1:w.map(x=>last(x,'る')),s2:[mark('る','old-part')+' → '+mark(to,'new-part')],s3:w.map(x=>changed(x,conjugateVerb(x,'g2',form))),n:['ここを みる','る → '+to,'できあがり'],summary:mark('る','old-part')+' → '+mark(to,'new-part')}
 }
 function g3(p){
  const f=S.family,w=p.words,isS=p.key==='suru',old=isS?'する':'くる';
  if(f==='teTaFamily'){let te=isS?'して':'きて',ta=isS?'した':'きた';return{title:'3グループ　／　て・た系',intro:'この かたちは とくべつです。',familyNote:note(f),special:true,s1:w.map(x=>suf(x,old)),s2:[line('て形',mark(old,'old-part')+' → '+mark(te,'new-part')),line('た形',mark(old,'old-part')+' → '+mark(ta,'new-part'))],s3:w.map(x=>pair(changed(x,conjugateVerb(x,'g3','te')),changed(x,conjugateVerb(x,'g3','ta'))),n:['かたちを みる','て形・た形','できあがり'],summary:pair(mark(old,'old-part')+' → '+mark(te,'new-part'),mark(old,'old-part')+' → '+mark(ta,'new-part'))}}
  if(f==='dict'){let src=w.map(x=>conjugateVerb(x,'g3','masu')),from=isS?'します':'きます';return{title:'3グループ　／　じしょ形',intro:'ます形から、じしょ形に もどします。',familyNote:note(f),special:true,s1:src.map(esc),s2:[mark(from,'old-part')+' → '+mark(old,'new-part')],s3:w.map((x,i)=>changed(src[i],x)),n:['ます形を みる','かえる','じしょ形'],summary:mark(from,'old-part')+' → '+mark(old,'new-part')}}
  let form=f==='masuFamily'?'masu':f==='naiFamily'?'nai':'potential',sample=conjugateVerb(old,'g3',form);return{title:`3グループ　／　${F[f].label}`,intro:'この かたちは とくべつです。',familyNote:note(f),special:true,s1:w.map(x=>suf(x,old)),s2:[mark(old,'old-part')+' → '+mark(sample,'new-part')],s3:w.map(x=>changed(x,conjugateVerb(x,'g3',form))),n:['かたちを みる','かえる','できあがり'],summary:mark(old,'old-part')+' → '+mark(sample,'new-part')}
 }
 function adj(p){let w=p.words[0],a=answerFor({type:S.type,word:w,form:S.family});return{title:`${DATA[S.type].label}　／　${FORM_META[S.family].prompt}`,intro:'',familyNote:'',special:w==='いい',s1:[esc(w)],s2:[esc(w)+' → '+esc(a)],s3:[changed(w,a)],n:['ことばを みる','かえる','できあがり'],summary:esc(w)+' → '+esc(a)}}
 function model(){let ps=patterns(),p=ps[Math.min(S.pattern,ps.length-1)];return S.type==='g1'?g1(p):S.type==='g2'?g2(p):S.type==='g3'?g3(p):adj(p)}
 function renderSteps(){let m=model();el('ruleTitle').textContent=m.title;el('ruleException').hidden=!m.special;el('ruleIntro').textContent=m.intro;el('familyNote').hidden=!m.familyNote;el('familyNote').textContent=m.familyNote||'';let labels=['みる','かえる','できあがり'],steps=[m.s1,m.s2,m.s3].map((items,i)=>({label:labels[i],items,n:m.n[i]||''}));el('ruleSteps').innerHTML=steps.map((s,i)=>`<div class="rule-step${i===1?' step-change':''}${i===2?' step-final':''}${i>=S.step?' step-hidden':''}${i===S.step-1?' revealing':''}"><div class="step-label"><span>${i+1}</span>${s.label}</div><div class="step-list">${s.items.map(x=>`<div class="step-word">${x}</div>`).join('')}</div><div class="step-note">${esc(s.n)}</div></div>`).join('');let sum=el('ruleSummary');sum.classList.toggle('waiting',S.step<3);sum.innerHTML=S.step===3?m.summary:'「つぎを みる」を おして ください。';el('ruleStepCount').textContent=S.step+' / 3';el('ruleStepBtn').disabled=S.step===3;el('ruleRestartBtn').disabled=S.step===1}
 function nextStep(){if(S.step<3){S.step++;renderSteps()}}
 el('ruleStepBtn').onclick=nextStep;el('ruleRestartBtn').onclick=()=>{S.step=1;renderSteps()};return{renderRulePage,nextStep}
}
