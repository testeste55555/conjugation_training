import {escapeHtml,mark,highlightSuffix,formLine,formPair,highlightChanged} from './rules-helpers.js';

export function createG3RuleModel({pattern,family,RULE_FAMILY_META,conjugateVerb}){
  const familyNote=RULE_FAMILY_META[family]?.note??'';
  const words=pattern.words;
  const type='g3';

  if(family==='teTaFamily'){
    return {
      title:'3グループ　／　て・た系',intro:'この かたちは とくべつです。',
      familyNote,special:true,
      step1:words.map(w=>highlightSuffix(w,pattern.key==='suru'?'する':'くる')),
      step2:pattern.key==='suru'
        ?[
          formLine('て形',mark('する','old-part')+' → '+mark('して','new-part')),
          formLine('た形',mark('する','old-part')+' → '+mark('した','new-part'))
        ]:[
          formLine('て形',mark('くる','old-part')+' → '+mark('きて','new-part')),
          formLine('た形',mark('くる','old-part')+' → '+mark('きた','new-part'))
        ],
      step3:words.map(w=>formPair(
        highlightChanged(w,conjugateVerb(w,type,'te')),
        highlightChanged(w,conjugateVerb(w,type,'ta'))
      )),
      notes:['かたちを みる','て形・た形','できあがり'],
      summary:pattern.key==='suru'
        ?formPair(
          mark('する','old-part')+' → '+mark('して','new-part'),
          mark('する','old-part')+' → '+mark('した','new-part')
        )
        :formPair(
          mark('くる','old-part')+' → '+mark('きて','new-part'),
          mark('くる','old-part')+' → '+mark('きた','new-part')
        )
    };
  }

  if(family==='dict'){
    const sources=words.map(w=>conjugateVerb(w,type,'masu'));
    return {
      title:'3グループ　／　じしょ形',intro:'ます形から、じしょ形に もどします。',
      familyNote,special:true,
      step1:sources.map(s=>escapeHtml(s)),
      step2:[pattern.key==='suru'
        ?mark('します','old-part')+' → '+mark('する','new-part')
        :mark('きます','old-part')+' → '+mark('くる','new-part')],
      step3:words.map((w,i)=>highlightChanged(sources[i],w)),
      notes:['ます形を みる','かえる','じしょ形'],
      summary:pattern.key==='suru'?'します → する':'きます → くる'
    };
  }

  const form=family==='masuFamily'?'masu':family==='naiFamily'?'nai':'potential';
  return {
    title:'3グループ　／　'+RULE_FAMILY_META[family].label,
    intro:'この かたちは とくべつです。',
    familyNote,special:true,
    step1:words.map(w=>highlightSuffix(w,pattern.key==='suru'?'する':'くる')),
    step2:[pattern.key==='suru'
      ?mark('する','old-part')+' → '+mark(family==='masuFamily'?'し':family==='naiFamily'?'し':'できる','new-part')
      :mark('くる','old-part')+' → '+mark(family==='masuFamily'?'き':family==='naiFamily'?'こ':'こられる','new-part')],
    step3:words.map(w=>highlightChanged(w,conjugateVerb(w,type,form))),
    notes:['かたちを みる','かえる','できあがり'],
    summary:pattern.key==='suru'
      ?'する → '+conjugateVerb('する','g3',form)
      :'くる → '+conjugateVerb('くる','g3',form)
  };
}
