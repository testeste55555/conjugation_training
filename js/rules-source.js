import {lastChar, iStem, aStem, eStem} from './conjugation.js';
import {escapeHtml, mark, highlightSuffix, highlightChanged, formLine} from './rules-helpers.js';
import {familyCompletions, RULE_FAMILY_FORMS} from './rules-family.js';

export const RULE_SOURCE_IDS = Object.freeze(['masu','dict']);
export const VERB_RULE_FAMILIES = Object.freeze([
  'masuFamily','naiFamily','te','ta','dict','potential','imperative','prohibitive'
]);
const PRINCIPAL = Object.freeze({
  masuFamily:'masu', naiFamily:'nai', te:'te', ta:'ta', dict:'dict',
  potential:'potential', imperative:'imperative', prohibitive:'prohibitive'
});
const G1_TE_TA = Object.freeze({
  'う':['って','った'], 'つ':['って','った'], 'る':['って','った'],
  'む':['んで','んだ'], 'ぶ':['んで','んだ'], 'ぬ':['んで','んだ'],
  'く':['いて','いた'], 'ぐ':['いで','いだ'], 'す':['して','した']
});
const G3_ENDINGS = Object.freeze({
  suru:{
    masu:'します',masen:'しません',mashita:'しました',masendeshita:'しませんでした',
    te:'して',nai:'しない',ta:'した',dict:'する',nakatta:'しなかった',
    potential:'できる',imperative:'しろ'
  },
  kuru:{
    masu:'きます',masen:'きません',mashita:'きました',masendeshita:'きませんでした',
    te:'きて',nai:'こない',ta:'きた',dict:'くる',nakatta:'こなかった',
    potential:'こられる',imperative:'こい'
  }
});
const suffix = (oldText,newText) => ({old:oldText,replacement:newText});
const text = value => escapeHtml(value);
const transform = (oldText,newText) => mark(oldText,'old-part')+' → '+mark(newText,'new-part');
const append = value => mark('じしょ形','old-part')+' ＋ '+mark(value,'new-part');

function g1Ending(word,form) {
  const ending=lastChar(word);
  if(form==='te'||form==='ta') {
    const pair=word==='いく'?['って','った']:G1_TE_TA[ending];
    if(!pair) throw new Error('1グループの語尾が不正です: '+word);
    return pair[form==='te'?0:1];
  }
  const i=iStem[ending],a=aStem[ending],e=eStem[ending];
  const endings={
    masu:i+'ます',masen:i+'ません',mashita:i+'ました',masendeshita:i+'ませんでした',
    nai:a+'ない',nakatta:a+'なかった',dict:ending,potential:e+'る',imperative:e
  };
  if(!(form in endings)) throw new Error('活用形が不正です: '+form);
  return endings[form];
}

function endingsFor(word,type,form,sourceForm) {
  if(type==='g1') {
    const ending=lastChar(word);
    return suffix(sourceForm==='masu'?iStem[ending]+'ます':ending,g1Ending(word,form));
  }
  if(type==='g2') {
    const endings={
      masu:'ます',masen:'ません',mashita:'ました',masendeshita:'ませんでした',
      te:'て',nai:'ない',ta:'た',dict:'る',nakatta:'なかった',
      potential:'られる',imperative:'ろ'
    };
    return suffix(sourceForm==='masu'?'ます':'る',endings[form]);
  }
  if(type==='g3') {
    const subtype=word==='くる'?'kuru':'suru';
    const endings=G3_ENDINGS[subtype];
    if(!word.endsWith(subtype==='kuru'?'くる':'する'))throw new Error('3グループの原形が不正です。');
    return suffix(endings[sourceForm],endings[form]);
  }
  throw new Error('動詞のグループが不正です。');
}

function makeOperation(from,oldText,replacement) {
  if(!from.endsWith(oldText))throw new Error('変化する部分が一致しません: '+from);
  const to=from.slice(0,from.length-oldText.length)+replacement;
  return {from,to,old:oldText,replacement};
}

/** A path is a sequence of actual word forms, not an additional answer database. */
export function createRulePath(word,type,form,sourceForm,conjugateVerb) {
  if(!RULE_SOURCE_IDS.includes(sourceForm))throw new Error('起点が不正です。');
  const source=sourceForm==='masu'?conjugateVerb(word,type,'masu'):word;
  const target=conjugateVerb(word,type,form);
  const operations=[];
  let current=source;
  if(source===target) return {word,type,form,sourceForm,source,target,operations};

  if(form==='prohibitive') {
    if(sourceForm==='masu') {
      const {old,replacement}=endingsFor(word,type,'dict','masu');
      const op=makeOperation(current,old,replacement);
      operations.push(op);
      current=op.to;
    }
    operations.push(makeOperation(current,'','な'));
  } else {
    const {old,replacement}=endingsFor(word,type,form,sourceForm);
    operations.push(makeOperation(current,old,replacement));
  }
  if(operations.at(-1)?.to!==target)throw new Error('ルールと正答が一致しません: '+word+'/'+form+'/'+sourceForm);
  return {word,type,form,sourceForm,source,target,operations};
}

export function rulePatternLabel(pattern,type,family,sourceForm,conjugateVerb) {
  if(type==='g1') {
    if(family==='te'||family==='ta') {
      return pattern.label;
    }
    if(family==='dict'&&sourceForm==='masu'&&pattern.words[0])
      return conjugateVerb(pattern.words[0],'g1','masu')+' → '+pattern.words[0];
    return sourceForm==='masu'?iStem[pattern.ending]+'ます':pattern.ending;
  }
  return pattern.label;
}

function operationHtml(op) {
  return op.old===''?append(op.replacement):transform(op.old,op.replacement);
}
function sourceHtml(path) {
  const old=path.operations[0]?.old;
  return old?highlightSuffix(path.source,old):text(path.source);
}
function completion(path) {
  return highlightChanged(path.source,path.target);
}
function examplePaths(word,type,family,sourceForm,conjugateVerb) {
  const forms=RULE_FAMILY_FORMS[family]||[PRINCIPAL[family]];
  if(forms.some(form=>!form))throw new Error('ルール系列が不正です。');
  return Object.fromEntries(forms.map(form=>[form,createRulePath(word,type,form,sourceForm,conjugateVerb)]));
}

function prohibitionRule(paths,sourceForm) {
  if(sourceForm==='dict')return [append('な')];
  const first=paths[0].prohibitive.operations[0];
  return [
    formLine('① じしょ形',operationHtml(first)),
    '<div class="rule-intermediates">'+paths.map(entry=>{
      const path=entry.prohibitive;
      return formLine('じしょ形',highlightChanged(path.source,path.operations[0].to));
    }).join('')+'</div>',
    formLine('② きんし形',append('な'))
  ];
}

export function createVerbRuleModel({
  type,pattern,family,sourceForm='masu',RULE_FAMILY_META,conjugateVerb,FORM_META
}) {
  if(!VERB_RULE_FAMILIES.includes(family))throw new Error('ルール系列が不正です。');
  const words=pattern.words;
  if(!words.length)throw new Error('ルールの例示語がありません。');
  const paths=words.map(word=>examplePaths(word,type,family,sourceForm,conjugateVerb));
  const forms=RULE_FAMILY_FORMS[family]||[PRINCIPAL[family]];
  const principal=forms[0];
  const mainPaths=paths.map(entry=>entry[principal]);
  const identity=mainPaths.every(path=>path.operations.length===0);
  const special=type==='g3'||((family==='te'||family==='ta')&&!!pattern.special);
  const familyNote=RULE_FAMILY_META[family]?.note??'';
  const sourceLabel=sourceForm==='masu'?'ます形':'じしょ形';

  let step2,summary;
  if(identity) {
    step2=[text('そのまま')];
    summary=text('そのまま');
  } else if(family==='prohibitive') {
    step2=prohibitionRule(paths,sourceForm);
    summary=sourceForm==='masu'
      ?'<div class="form-pair">'+formLine('① じしょ形',operationHtml(mainPaths[0].operations[0]))+formLine('② きんし形',append('な'))+'</div>'
      :append('な');
  } else {
    step2=[operationHtml(mainPaths[0].operations[0])];
    summary=step2[0];
  }

  const step3=words.map((word,i)=>{
    if(RULE_FAMILY_FORMS[family])
      return familyCompletions(word,type,family,FORM_META,conjugateVerb,sourceForm);
    return completion(mainPaths[i]);
  });

  let intro='へんかを みます。';
  if(identity)intro='この かたちは、もう できています。';
  else if(family==='prohibitive')intro=sourceForm==='masu'
    ?'まず じしょ形に もどしてから、「な」を つけます。'
    :'じしょ形に「な」を つけます。';
  else if(special)intro='この かたちは とくべつです。';
  else if(type==='g1'&&sourceForm==='masu')intro='ますを とってから、もじを かえます。';
  else if(type==='g2'&&sourceForm==='masu')intro='ます形の うしろを かえます。';

  return {
    title:({'g1':'1グループ','g2':'2グループ','g3':'3グループ'})[type]+'　／　'+RULE_FAMILY_META[family].label,
    intro,familyNote,special,sourceForm,sourceLabel,paths,
    step1:mainPaths.map(sourceHtml),step2,step3,
    notes:[sourceLabel+'を みる',identity?'そのまま':family==='prohibitive'?'じしょ形 ＋ な':'かえる','できあがり'],
    summary
  };
}
