import {mark,highlightLast,highlightSuffix,formLine,formPair,highlightChanged} from './rules-helpers.js';

export function createG2RuleModel({pattern,family,RULE_FAMILY_META,conjugateVerb}){
  const familyNote=RULE_FAMILY_META[family]?.note??'';
  const words=pattern.words;

  if(family==='teTaFamily'){
    return {
      title:'2グループ　／　て・た系',intro:'へんかを みます。',
      familyNote,special:false,
      step1:words.map(w=>highlightLast(w,'る')),
      step2:[
        formLine('て形',mark('る','old-part')+' → '+mark('て','new-part')),
        formLine('た形',mark('る','old-part')+' → '+mark('た','new-part'))
      ],
      step3:words.map(w=>formPair(
        highlightChanged(w,conjugateVerb(w,'g2','te')),
        highlightChanged(w,conjugateVerb(w,'g2','ta'))
      )),
      notes:['ここを みる','て形・た形','できあがり'],
      summary:formPair(
        mark('る','old-part')+' → '+mark('て','new-part'),
        mark('る','old-part')+' → '+mark('た','new-part')
      )
    };
  }

  if(family==='dict'){
    const sources=words.map(w=>conjugateVerb(w,'g2','masu'));
    return {
      title:'2グループ　／　じしょ形',intro:'へんかを みます。',
      familyNote,special:false,
      step1:sources.map(s=>highlightSuffix(s,'ます')),
      step2:[mark('ます','old-part')+' → '+mark('る','new-part')],
      step3:words.map((w,i)=>highlightChanged(sources[i],w)),
      notes:['ここを みる','ます → る','できあがり'],
      summary:mark('ます','old-part')+' → '+mark('る','new-part')
    };
  }

  const form=family==='masuFamily'?'masu':family==='naiFamily'?'nai':'potential';
  const add=family==='masuFamily'?'ます':family==='naiFamily'?'ない':'られる';
  return {
    title:'2グループ　／　'+RULE_FAMILY_META[family].label,intro:'へんかを みます。',
    familyNote,special:false,
    step1:words.map(w=>highlightLast(w,'る')),
    step2:[mark('る','old-part')+' → '+mark(add,'new-part')],
    step3:words.map(w=>highlightChanged(w,conjugateVerb(w,'g2',form))),
    notes:['ここを みる','る → '+add,'できあがり'],
    summary:mark('る','old-part')+' → '+mark(add,'new-part')
  };
}
