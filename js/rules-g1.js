import {lastChar,iStem,aStem,eStem} from './conjugation.js';
import {mark,highlightLast,highlightSuffix,formLine,formPair,highlightChanged} from './rules-helpers.js';

export function createG1RuleModel({pattern,family,RULE_FAMILY_META,conjugateVerb}){
  const familyNote=RULE_FAMILY_META[family]?.note??'';

  if(family==='teTaFamily'){
    return {
      title:'1グループ　／　て・た系',
      intro:pattern.special?'「いく」は とくべつです。':'へんかを みます。',
      familyNote,special:!!pattern.special,
      step1:pattern.words.map(w=>highlightLast(w,lastChar(w))),
      step2:[
        formLine('て形',mark(pattern.label,'old-part')+' → '+mark(pattern.te,'new-part')),
        formLine('た形',mark(pattern.label,'old-part')+' → '+mark(pattern.ta,'new-part'))
      ],
      step3:pattern.words.map(w=>formPair(
        highlightChanged(w,conjugateVerb(w,'g1','te')),
        highlightChanged(w,conjugateVerb(w,'g1','ta'))
      )),
      notes:['ここを みる','て形・た形','できあがり'],
      summary:formPair(
        mark(pattern.label,'old-part')+' → '+mark(pattern.te,'new-part'),
        mark(pattern.label,'old-part')+' → '+mark(pattern.ta,'new-part')
      )
    };
  }

  const ending=pattern.ending;
  const words=pattern.words;

  if(family==='dict'){
    const sources=words.map(w=>conjugateVerb(w,'g1','masu'));
    return {
      title:'1グループ　／　じしょ形',intro:'へんかを みます。',
      familyNote,special:false,
      step1:sources.map(s=>highlightSuffix(s,iStem[ending]+'ます')),
      step2:[mark(iStem[ending]+'ます','old-part')+' → '+mark(ending,'new-part')],
      step3:words.map((w,i)=>highlightChanged(sources[i],w)),
      notes:['ここを みる',iStem[ending]+'ます → '+ending,'できあがり'],
      summary:mark(iStem[ending]+'ます','old-part')+' → '+mark(ending,'new-part')
    };
  }

  const map=family==='masuFamily'?iStem:family==='naiFamily'?aStem:eStem;
  const replacement=map[ending];
  const form=family==='masuFamily'?'masu':family==='naiFamily'?'nai':'potential';
  return {
    title:'1グループ　／　'+RULE_FAMILY_META[family].label,intro:'へんかを みます。',
    familyNote,special:false,
    step1:words.map(w=>highlightLast(w,ending)),
    step2:[mark(ending,'old-part')+' → '+mark(replacement,'new-part')],
    step3:words.map(w=>highlightChanged(w,conjugateVerb(w,'g1',form))),
    notes:['ここを みる',ending+' → '+replacement,'できあがり'],
    summary:mark(ending,'old-part')+' → '+mark(replacement,'new-part')
  };
}
