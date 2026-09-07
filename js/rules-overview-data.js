import {createRulePath, rulePatternLabel} from './rules-source.js';

export const OVERVIEW_TARGETS = Object.freeze({
  verb:['masu','masen','mashita','masendeshita','te','nai','ta','dict','nakatta','potential','imperative','prohibitive'],
  adjective:['nowYes','nowNo','pastYes','pastNo','connect','kuAdj','naAdj']
});
export const OVERVIEW_DERIVED = Object.freeze(['masen','mashita','masendeshita','nakatta']);
export const OVERVIEW_ADJECTIVE_FORMS = Object.freeze({
  connect:{iadj:'teAdj',nadj:'deAdj'},
  kuAdj:{iadj:'kuAdj'},
  naAdj:{nadj:'naAdj'}
});
const GROUPS = Object.freeze({g1:'1グループ',g2:'2グループ',g3:'3グループ',iadj:'いけいようし',nadj:'なけいようし'});
const adjectiveForm=(type,target)=>OVERVIEW_ADJECTIVE_FORMS[target]?.[type] ??
  (['nowYes','nowNo','pastYes','pastNo'].includes(target)?target:null);

function changedSuffix(source,target){
  const a=[...source],b=[...target];
  let i=0;
  while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  return {from:source,to:target,old:a.slice(i).join(''),replacement:b.slice(i).join('')};
}

export function overviewTargetLabel(target,formMeta){
  if(target==='connect')return 'つなぐかたち';
  if(!formMeta[target])throw new Error('一覧の活用形が不正です: '+target);
  return formMeta[target].label;
}

export function overviewSourceLabel(source){
  return source==='masu'?'ます形から':'じしょ形から';
}

export function buildOverview({pos,target,sourceForm='masu',ruleExamples,wordById,conjugator,FORM_META}){
  if(!OVERVIEW_TARGETS[pos]?.includes(target))throw new Error('一覧の活用形が不正です。');
  if(!['masu','dict'].includes(sourceForm))throw new Error('一覧の起点が不正です。');
  const {conjugateVerb,answerFor}=conjugator;
  const fromIds=ids=>ids.map(id=>{
    const word=wordById.get(id);
    if(!word)throw new Error('例示語が見つかりません: '+id);
    return word;
  });
  const groups=[];
  if(pos==='verb'){
    // All patterns are kept. For te/ta, show the shared six categories rather
    // than every word; for other forms use all eight canonical ending groups.
    const g1patterns=['te','ta'].includes(target)
      ?ruleExamples.g1.teTaPatterns
      :ruleExamples.g1.endingOrder.map(ending=>({
        key:ending,label:ending,wordIds:ruleExamples.g1.endingExamples[ending]
      }));
    const patterns=[
      ['g1',g1patterns],
      ['g2',ruleExamples.g2.patterns],
      ['g3',ruleExamples.g3.patterns]
    ];
    for(const [type,items] of patterns){
      const rows=items.map(pattern=>{
        const word=fromIds(pattern.wordIds)[0];
        const path=createRulePath(word.lemma,type,target,sourceForm,conjugateVerb);
        return {
          key:type+'/'+pattern.key,type,form:target,patternKey:pattern.key,wordId:word.id,
          label:rulePatternLabel({...pattern,words:[word.lemma]},type,target,sourceForm,conjugateVerb),
          source:path.source,target:path.target,operations:path.operations,
          special:!!pattern.special,sourceForm,
          detail:{type,form:target,patternKey:pattern.key,wordId:word.id,source:sourceForm}
        };
      });
      groups.push({type,label:GROUPS[type],rows,collapsed:type==='g1'&&rows.length>1});
    }
  }else{
    for(const type of ['iadj','nadj']){
      const form=adjectiveForm(type,target);
      if(!form)continue;
      const words=fromIds(ruleExamples.adjectives[type].wordIds);
      const rows=words.map((word,index)=>{
        const source=word.lemma;
        const result=answerFor({type,word:source,form});
        return {
          key:type+'/'+form+'/'+word.id,type,form,patternKey:source,wordId:word.id,
          label:index===0?'れい':source,source,target:result,
          operations:[changedSuffix(source,result)],
          special:source==='いい',sourceForm:null,
          detail:{type,form,patternKey:source,wordId:word.id}
        };
      });
      groups.push({type,label:GROUPS[type],rows,collapsed:false});
    }
  }
  return {pos,target,sourceForm,groups};
}
