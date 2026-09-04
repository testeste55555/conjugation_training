import {VERB_TYPES} from './conjugation.js';
import {escapeHtml} from './rules-helpers.js';
import {createG1RuleModel} from './rules-g1.js';
import {createG2RuleModel} from './rules-g2.js';
import {createG3RuleModel} from './rules-g3.js';
import {createAdjectiveRuleModel} from './rules-adj.js';

const el=id=>document.getElementById(id);

export function initRules({DATA,FORM_META,ruleExamples,wordById,conjugator}) {
  const {conjugateVerb,answerFor}=conjugator;
  const RULE_FAMILY_META=ruleExamples.families;
  const ruleState={type:'g1',family:'masuFamily',pattern:0,step:1};
  const wordsFromIds=ids=>ids.map(id=>wordById.get(id)?.lemma).filter(Boolean);

  const familyForms=type=>VERB_TYPES.has(type)
    ?['masuFamily','naiFamily','teTaFamily','dict','potential']
    :DATA[type].forms;

  function g1Patterns(family){
    if(family==='teTaFamily'){
      return ruleExamples.g1.teTaPatterns.map(p=>({...p,words:wordsFromIds(p.wordIds)}));
    }
    return ruleExamples.g1.endingOrder.map(ending=>{
      const words=wordsFromIds(ruleExamples.g1.endingExamples[ending]??[]);
      return {
        key:ending,
        label:family==='dict'&&words[0]?conjugateVerb(words[0],'g1','masu')+' → '+words[0]:ending,
        ending,words
      };
    });
  }

  const g2Patterns=()=>ruleExamples.g2.patterns.map(p=>({...p,words:wordsFromIds(p.wordIds)}));
  const g3Patterns=()=>ruleExamples.g3.patterns.map(p=>({...p,words:wordsFromIds(p.wordIds)}));
  const adjectiveExamples=type=>wordsFromIds(ruleExamples.adjectives[type].wordIds).map(word=>({key:word,label:word,words:[word]}));

  function patternsForRule(){
    if(ruleState.type==='g1')return g1Patterns(ruleState.family);
    if(ruleState.type==='g2')return g2Patterns();
    if(ruleState.type==='g3')return g3Patterns();
    return adjectiveExamples(ruleState.type);
  }

  function renderRulePage(){
    const types=el('ruleTypeTabs');
    types.innerHTML='';

    for(const [key,data] of Object.entries(DATA)){
      const b=document.createElement('button');
      b.className='tab'+(ruleState.type===key?' active':'');
      b.textContent=data.label;
      b.setAttribute('aria-pressed',ruleState.type===key);
      b.onclick=()=>{
        ruleState.type=key;
        ruleState.family=VERB_TYPES.has(key)?'masuFamily':DATA[key].forms[0];
        ruleState.pattern=0;
        ruleState.step=1;
        renderRulePage();
      };
      types.appendChild(b);
    }

    const families=el('ruleFamilyChips');
    families.innerHTML='';
    el('ruleFamilyLabel').textContent=VERB_TYPES.has(ruleState.type)?'2　ルールを えらぶ':'2　かたちを えらぶ';

    for(const f of familyForms(ruleState.type)){
      const b=document.createElement('button');
      b.className='chip'+(ruleState.family===f?' active':'');
      b.textContent=VERB_TYPES.has(ruleState.type)?RULE_FAMILY_META[f].label:FORM_META[f].label;
      b.setAttribute('aria-pressed',ruleState.family===f);
      b.onclick=()=>{
        ruleState.family=f;
        ruleState.pattern=0;
        ruleState.step=1;
        renderRulePage();
      };
      families.appendChild(b);
    }

    const patterns=patternsForRule();
    const patternBox=el('rulePatternChips');
    patternBox.innerHTML='';
    el('rulePatternLabel').textContent=
      ruleState.type==='g1'?'3　へんかを えらぶ':
      ruleState.type==='g3'?'3　れいを えらぶ':
      ruleState.type==='g2'?'3　れい':'3　れいを えらぶ';

    patterns.forEach((p,i)=>{
      const b=document.createElement('button');
      b.className='chip'+(ruleState.pattern===i?' active':'');
      b.textContent=p.label;
      b.setAttribute('aria-pressed',ruleState.pattern===i);
      b.onclick=()=>{
        ruleState.pattern=i;
        ruleState.step=1;
        [...patternBox.querySelectorAll('.chip')].forEach((chip,j)=>{
          const active=j===i;
          chip.classList.toggle('active',active);
          chip.setAttribute('aria-pressed',active);
        });
        renderRuleSteps();
      };
      patternBox.appendChild(b);
    });

    el('rulePatternPanel').hidden=patterns.length<=1&&ruleState.type==='g2';
    renderRuleSteps();
  }

  function currentRuleModel(){
    const patterns=patternsForRule();
    const pattern=patterns[Math.min(ruleState.pattern,patterns.length-1)];
    const common={pattern,family:ruleState.family,RULE_FAMILY_META,conjugateVerb};

    if(ruleState.type==='g1')return createG1RuleModel(common);
    if(ruleState.type==='g2')return createG2RuleModel(common);
    if(ruleState.type==='g3')return createG3RuleModel(common);
    return createAdjectiveRuleModel({
      type:ruleState.type,
      word:pattern.words[0],
      form:ruleState.family,
      DATA,FORM_META,answerFor
    });
  }

  function renderRuleSteps(){
    const m=currentRuleModel();
    el('ruleTitle').textContent=m.title;
    el('ruleException').hidden=!m.special;
    el('ruleIntro').textContent=m.intro;
    el('familyNote').hidden=!m.familyNote;
    el('familyNote').textContent=m.familyNote||'';

    const labels=['みる','かえる','できあがり'];
    const steps=[m.step1,m.step2,m.step3].map((items,i)=>({label:labels[i],items,note:m.notes[i]||''}));

    el('ruleSteps').innerHTML=steps.map((s,i)=>
      '<div class="rule-step'+(i===1?' step-change':'')+(i===2?' step-final':'')+
      (i>=ruleState.step?' step-hidden':'')+(i===ruleState.step-1?' revealing':'')+
      '"><div class="step-label"><span>'+(i+1)+'</span>'+s.label+
      '</div><div class="step-list">'+s.items.map(x=>'<div class="step-word">'+x+'</div>').join('')+
      '</div><div class="step-note">'+escapeHtml(s.note)+'</div></div>'
    ).join('');

    const summary=el('ruleSummary');
    summary.classList.toggle('waiting',ruleState.step<3);
    summary.innerHTML=ruleState.step===3?m.summary:'「つぎを みる」を おして ください。';
    el('ruleStepCount').textContent=ruleState.step+' / 3';
    el('ruleStepBtn').disabled=ruleState.step===3;
    el('ruleRestartBtn').disabled=ruleState.step===1;
  }

  function nextStep(){
    if(ruleState.step<3){
      ruleState.step++;
      renderRuleSteps();
    }
  }

  el('ruleStepBtn').onclick=nextStep;
  el('ruleRestartBtn').onclick=()=>{
    ruleState.step=1;
    renderRuleSteps();
  };

  return {renderRulePage,nextStep};
}
