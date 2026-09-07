import {VERB_TYPES} from './conjugation.js';
import {escapeHtml} from './rules-helpers.js';
import {VERB_RULE_FAMILIES,rulePatternLabel} from './rules-source.js';
import {createG1RuleModel} from './rules-g1.js';
import {createG2RuleModel} from './rules-g2.js';
import {createG3RuleModel} from './rules-g3.js';
import {createAdjectiveRuleModel} from './rules-adj.js';
import {initOverview} from './rules-overview.js';
import {OVERVIEW_DERIVED} from './rules-overview-data.js';

const el=id=>document.getElementById(id);
const isSeparatedForm=family=>family==='te'||family==='ta';

export function initRules({DATA,FORM_META,ruleExamples,wordById,conjugator,sourceConfig}) {
  const {conjugateVerb,answerFor}=conjugator;
  const RULE_FAMILY_META=ruleExamples.families;
  const ruleState={
    type:'g1',family:'masuFamily',pattern:0,example:0,step:1,
    extrasExpanded:false,source:sourceConfig.default,requestedForm:null
  };
  const wordsFromIds=ids=>ids.map(id=>wordById.get(id)?.lemma).filter(Boolean);
  const familyForms=type=>VERB_TYPES.has(type)?VERB_RULE_FAMILIES:DATA[type].forms;

  function g1Patterns(family){
    if(isSeparatedForm(family)){
      return ruleExamples.g1.teTaPatterns.map(p=>{
        const pattern={...p,words:wordsFromIds(p.wordIds)};
        return {...pattern,label:rulePatternLabel(pattern,'g1',family,ruleState.source,conjugateVerb)};
      });
    }
    return ruleExamples.g1.endingOrder.map(ending=>{
      const words=wordsFromIds(ruleExamples.g1.endingExamples[ending]??[]);
      const pattern={key:ending,ending,words};
      return {...pattern,label:rulePatternLabel(pattern,'g1',family,ruleState.source,conjugateVerb)};
    });
  }

  const g2Patterns=()=>ruleExamples.g2.patterns.map(p=>({...p,words:wordsFromIds(p.wordIds)}));
  const g3Patterns=()=>ruleExamples.g3.patterns.map(p=>({...p,words:wordsFromIds(p.wordIds)}));
  const adjectiveExamples=type=>wordsFromIds(ruleExamples.adjectives[type].wordIds)
    .map(word=>({key:word,label:word,words:[word]}));

  function patternsForRule(){
    if(ruleState.type==='g1')return g1Patterns(ruleState.family);
    if(ruleState.type==='g2')return g2Patterns();
    if(ruleState.type==='g3')return g3Patterns();
    return adjectiveExamples(ruleState.type);
  }

  function resetRule({pattern=false}={}){
    if(pattern){ruleState.pattern=0;ruleState.example=0;}
    ruleState.step=1;
    ruleState.extrasExpanded=false;
    if(pattern)ruleState.requestedForm=null;
  }

  let viewMode='detail';
  let returnToOverview=false;
  let overview;

  function renderExampleChips(pattern){
    const oneAtATime=VERB_TYPES.has(ruleState.type)&&isSeparatedForm(ruleState.family);
    const box=el('ruleExampleChips');
    const panel=el('ruleExamplePanel');
    box.innerHTML='';
    panel.hidden=!oneAtATime||pattern.words.length<=1;
    if(!oneAtATime)return;
    pattern.words.forEach((word,i)=>{
      const b=document.createElement('button');
      b.className='chip'+(ruleState.example===i?' active':'');
      b.textContent=ruleState.source==='masu'
        ?conjugateVerb(word,ruleState.type,'masu'):word;
      b.setAttribute('aria-pressed',String(ruleState.example===i));
      b.onclick=()=>{
        ruleState.example=i;
        ruleState.step=1;
        [...box.querySelectorAll('.chip')].forEach((chip,j)=>{
          const active=j===i;
          chip.classList.toggle('active',active);
          chip.setAttribute('aria-pressed',String(active));
        });
        renderRuleSteps();
      };
      box.appendChild(b);
    });
  }

  function renderSourceTabs(){
    const isVerb=viewMode==='overview'?overview.state.pos==='verb':VERB_TYPES.has(ruleState.type);
    el('ruleSourcePanel').hidden=!isVerb;
    const sources=el('ruleSourceTabs');
    sources.innerHTML='';
    if(isVerb){
      for(const option of sourceConfig.options){
        const b=document.createElement('button');
        b.className='tab'+(ruleState.source===option.value?' active':'');
        b.textContent=option.label;
        b.setAttribute('aria-pressed',String(ruleState.source===option.value));
        b.onclick=()=>{
          if(ruleState.source===option.value)return;
          ruleState.source=option.value;
          resetRule();
          renderRulePage();
          const selected=[...el('ruleSourceTabs').querySelectorAll('button')]
            .find(button=>button.getAttribute('aria-pressed')==='true');
          selected?.focus({preventScroll:true});
        };
        sources.appendChild(b);
      }
    }

  }

  function renderRulePage(){
    const isOverview=viewMode==='overview';
    el('ruleDetailView').hidden=isOverview;
    el('ruleOverviewView').hidden=!isOverview;
    for(const [id,active] of [['ruleDetailModeBtn',!isOverview],['ruleOverviewModeBtn',isOverview]]){
      const button=el(id);
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    }
    renderSourceTabs();
    if(isOverview){overview.render();return;}
    renderDetailPage();
  }

  function renderDetailPage(){
    const types=el('ruleTypeTabs');
    types.innerHTML='';
    for(const [key,data] of Object.entries(DATA)){
      const b=document.createElement('button');
      b.className='tab'+(ruleState.type===key?' active':'');
      b.textContent=data.label;
      b.setAttribute('aria-pressed',String(ruleState.type===key));
      b.onclick=()=>{
        ruleState.type=key;
        ruleState.family=VERB_TYPES.has(key)?'masuFamily':DATA[key].forms[0];
        resetRule({pattern:true});
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
      b.setAttribute('aria-pressed',String(ruleState.family===f));
      b.onclick=()=>{
        ruleState.family=f;
        resetRule({pattern:true});
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
      b.setAttribute('aria-pressed',String(ruleState.pattern===i));
      b.onclick=()=>{
        ruleState.pattern=i;
        ruleState.example=0;
        ruleState.step=1;
        [...patternBox.querySelectorAll('.chip')].forEach((chip,j)=>{
          const active=j===i;
          chip.classList.toggle('active',active);
          chip.setAttribute('aria-pressed',String(active));
        });
        renderExampleChips(p);
        renderRuleSteps();
      };
      patternBox.appendChild(b);
    });
    el('rulePatternPanel').hidden=patterns.length<=1&&ruleState.type==='g2';
    renderExampleChips(patterns[Math.min(ruleState.pattern,patterns.length-1)]);
    renderRuleSteps();
  }

  function currentRuleModel(){
    const patterns=patternsForRule();
    const selected=patterns[Math.min(ruleState.pattern,patterns.length-1)];
    const pattern=isSeparatedForm(ruleState.family)
      ?{...selected,words:[selected.words[Math.min(ruleState.example,selected.words.length-1)]]}
      :selected;
    const common={pattern,family:ruleState.family,RULE_FAMILY_META,conjugateVerb,FORM_META,sourceForm:ruleState.source};
    if(ruleState.type==='g1')return createG1RuleModel(common);
    if(ruleState.type==='g2')return createG2RuleModel(common);
    if(ruleState.type==='g3')return createG3RuleModel(common);
    return createAdjectiveRuleModel({
      type:ruleState.type,word:pattern.words[0],form:ruleState.family,
      DATA,FORM_META,answerFor
    });
  }

  function renderRuleSteps(){
    const m=currentRuleModel();
    const hasExtras=['masuFamily','naiFamily'].includes(ruleState.family);
    el('ruleExtraControls').hidden=!hasExtras;
    el('ruleBackToOverviewBtn').hidden=!returnToOverview;
    const requested=ruleState.requestedForm;
    const targetNote=el('ruleTargetNote');
    targetNote.hidden=!requested||!OVERVIEW_DERIVED.includes(requested);
    targetNote.textContent=targetNote.hidden?'':'いま みる かたち：'+FORM_META[requested].label;
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

    if(requested&&OVERVIEW_DERIVED.includes(requested)){
      for(const line of el('ruleSteps').querySelectorAll('.family-completions .form-line')){
        const label=line.querySelector('.form-mini-label');
        if(label?.textContent===FORM_META[requested].label)line.classList.add('requested-form');
      }
    }
    const showExtras=hasExtras&&ruleState.extrasExpanded;
    for(const extra of el('ruleSteps').querySelectorAll('.family-extra'))extra.hidden=!showExtras;
    const more=el('ruleExtraBtn');
    more.textContent=showExtras?'ほかの かたちを とじる':'ほかの かたちを みる';
    more.setAttribute('aria-expanded',String(showExtras));

    const summary=el('ruleSummary');
    summary.classList.toggle('waiting',ruleState.step<3);
    summary.innerHTML=ruleState.step===3?m.summary:'「つぎを みる」を おして ください。';
    el('ruleStepCount').textContent=ruleState.step+' / 3';
    el('ruleStepBtn').disabled=ruleState.step===3;
    el('ruleRestartBtn').disabled=ruleState.step===1;
  }

  function nextStep(){
    if(viewMode!=='detail')return;
    if(ruleState.step<3){ruleState.step++;renderRuleSteps();}
  }

  function showOverview(sync=true){
    if(sync)overview.syncFromDetail(ruleState.type,ruleState.family);
    viewMode='overview';
    returnToOverview=false;
    renderRulePage();
  }

  function openDetail(request){
    const {type,form,patternKey,wordId,source}=request;
    if(!DATA[type])throw new Error('ルールのグループが見つかりません。');
    const isVerb=VERB_TYPES.has(type);
    const family=isVerb
      ?form==='masu'||['masen','mashita','masendeshita'].includes(form)?'masuFamily'
        :form==='nai'||form==='nakatta'?'naiFamily':form
      :form;
    if(!(isVerb?VERB_RULE_FAMILIES.includes(family):DATA[type].forms.includes(family)))
      throw new Error('ルールの活用形が見つかりません。');
    if(isVerb&&source){
      if(!sourceConfig.options.some(option=>option.value===source))throw new Error('起点が不正です。');
      ruleState.source=source;
    }
    ruleState.type=type;
    ruleState.family=family;
    resetRule({pattern:true});
    ruleState.requestedForm=OVERVIEW_DERIVED.includes(form)?form:null;
    ruleState.extrasExpanded=!!ruleState.requestedForm;
    const patterns=patternsForRule();
    let index=patterns.findIndex(p=>p.key===patternKey);
    if(index<0&&wordId){
      const word=wordById.get(wordId)?.lemma;
      index=patterns.findIndex(p=>p.words.includes(word));
    }
    if(index<0)throw new Error('ルールの例示パターンが見つかりません。');
    ruleState.pattern=index;
    const word=wordById.get(wordId)?.lemma;
    if(word&&isSeparatedForm(family)){
      const example=patterns[index].words.indexOf(word);
      if(example>=0)ruleState.example=example;
    }
    viewMode='detail';
    returnToOverview=true;
    renderRulePage();
    el('ruleTitle').focus({preventScroll:true});
    el('ruleDetailView').scrollIntoView({block:'start',behavior:'auto'});
  }

  overview=initOverview({
    DATA,FORM_META,ruleExamples,wordById,conjugator,sourceConfig,
    getSource:()=>ruleState.source,openDetail,onPosChange:()=>renderRulePage()
  });

  el('ruleDetailModeBtn').onclick=()=>{
    if(viewMode==='overview'){openDetail(overview.firstDetail());return;}
    renderRulePage();
  };
  el('ruleOverviewModeBtn').onclick=()=>showOverview(viewMode!=='overview');
  el('ruleBackToOverviewBtn').onclick=()=>showOverview(false);

  el('ruleExtraBtn').onclick=()=>{
    ruleState.extrasExpanded=!ruleState.extrasExpanded;
    const show=ruleState.extrasExpanded;
    for(const extra of el('ruleSteps').querySelectorAll('.family-extra'))extra.hidden=!show;
    el('ruleExtraBtn').textContent=show?'ほかの かたちを とじる':'ほかの かたちを みる';
    el('ruleExtraBtn').setAttribute('aria-expanded',String(show));
  };
  el('ruleStepBtn').onclick=nextStep;
  el('ruleRestartBtn').onclick=()=>{ruleState.step=1;renderRuleSteps();};
  return {renderRulePage,nextStep,openDetail,showOverview,isOverview:()=>viewMode==='overview'};
}
