import {buildOverview,OVERVIEW_TARGETS,OVERVIEW_DERIVED,overviewTargetLabel,overviewSourceLabel} from './rules-overview-data.js';
import {escapeHtml,mark} from './rules-helpers.js';

const el=id=>document.getElementById(id);
const esc=escapeHtml;
const posLabels={verb:'どうし',adjective:'けいようし'};

function operationHtml(op){
  if(op.old==='')return '<span class="overview-operation">'+mark('＋ '+op.replacement,'new-part')+'</span>';
  return '<span class="overview-operation">'+mark(op.old,'old-part')+
    '<span class="overview-arrow"> → </span>'+mark(op.replacement,'new-part')+'</span>';
}
function rowHtml(row,FORM_META){
  const operation=row.operations.length
    ?row.operations.map((op,i)=>{
      const label=row.operations.length>1?
        '<span class="overview-operation-label">'+(i===0?'① じしょ形':'② きんし形')+'</span>':'';
      return '<div class="overview-operation-row">'+label+operationHtml(op)+'</div>';
    }).join('')
    :'<span class="overview-operation">'+esc(row.source===row.target?'そのまま':'もとの かたちを かえます')+'</span>';
  return '<div class="overview-row">'+
    '<div class="overview-row-main"><div class="overview-row-label">'+esc(row.label)+
      (row.special?' <span class="overview-special">とくべつ</span>':'')+
    '</div><div class="overview-row-example"><span>'+esc(row.source)+'</span>'+
      '<span class="overview-arrow" aria-hidden="true">→</span>'+
      '<strong>'+esc(row.target)+'</strong></div>'+
    '<div class="overview-row-rule">'+operation+'</div></div>'+
    '<button class="smallbtn overview-detail-btn" type="button">くわしくみる</button>'+
    '</div>';
}

export function initOverview({DATA,FORM_META,ruleExamples,wordById,conjugator,sourceConfig,getSource,openDetail,onPosChange}){
  const state={pos:'verb',targets:{verb:'te',adjective:'nowYes'},derivedExpanded:false,g1Expanded:false};
  const wordByLemma=new Map([...wordById.values()].map(w=>[w.lemma,w]));
  const getTarget=()=>state.targets[state.pos];

  function syncFromDetail(type,family){
    if(['g1','g2','g3'].includes(type)){
      state.pos='verb';
      state.targets.verb=family==='masuFamily'?'masu':family==='naiFamily'?'nai':family;
    }else{
      state.pos='adjective';
      const mapped={teAdj:'connect',deAdj:'connect'};
      state.targets.adjective=mapped[family]||family;
    }
    state.derivedExpanded=false;
    state.g1Expanded=false;
  }

  function renderControls(){
    const posBox=el('overviewPosTabs');
    posBox.innerHTML='';
    for(const [pos,label] of Object.entries(posLabels)){
      const b=document.createElement('button');
      b.className='tab'+(state.pos===pos?' active':'');
      b.textContent=label;
      b.setAttribute('aria-pressed',String(state.pos===pos));
      b.onclick=()=>{
        state.pos=pos;
        state.derivedExpanded=false;
        state.g1Expanded=false;
        onPosChange();
      };
      posBox.appendChild(b);
    }
    const chips=el('overviewFormChips');
    chips.innerHTML='';
    for(const form of OVERVIEW_TARGETS[state.pos]){
      const b=document.createElement('button');
      const selected=getTarget()===form;
      b.className='chip'+(selected?' active':'');
      b.textContent=overviewTargetLabel(form,FORM_META);
      b.setAttribute('aria-pressed',String(selected));
      b.hidden=state.pos==='verb'&&OVERVIEW_DERIVED.includes(form)&&
        !state.derivedExpanded&&!selected;
      b.onclick=()=>{
        state.targets[state.pos]=form;
        state.g1Expanded=false;
        render();
      };
      chips.appendChild(b);
    }
    const more=el('overviewFormMoreBtn');
    more.hidden=state.pos!=='verb';
    more.textContent=state.derivedExpanded?'ほかの かたちを とじる':'ほかの かたちを みる';
    more.setAttribute('aria-expanded',String(state.derivedExpanded));
    el('overviewSourceNote').textContent=state.pos==='verb'
      ?overviewSourceLabel(getSource())
      :'けいようしの もとの かたちから';
    el('overviewTitle').textContent=overviewTargetLabel(getTarget(),FORM_META)+'の まとめ';
  }

  function renderRows(){
    const model=buildOverview({
      pos:state.pos,target:getTarget(),sourceForm:getSource(),
      ruleExamples,wordById,conjugator,FORM_META
    });
    const box=el('overviewGroups');
    box.innerHTML='';
    for(const group of model.groups){
      const section=document.createElement('section');
      section.className='overview-group';
      section.setAttribute('aria-label',group.label);
      const rows=group.collapsed&&!state.g1Expanded?group.rows.slice(0,1):group.rows;
      section.innerHTML='<div class="overview-group-heading"><h3>'+esc(group.label)+
        '</h3><span class="overview-count">'+group.rows.length+'パターン</span></div>'+
        '<div class="overview-rows">'+rows.map(row=>rowHtml(row,FORM_META)).join('')+'</div>';
      const buttons=section.querySelectorAll('.overview-detail-btn');
      buttons.forEach((button,i)=>button.onclick=()=>openDetail(rows[i].detail));
      if(group.collapsed){
        const more=document.createElement('button');
        more.className='smallbtn overview-group-more';
        more.textContent=state.g1Expanded?'1グループの へんかを とじる':'1グループの へんかを みる';
        more.setAttribute('aria-expanded',String(state.g1Expanded));
        more.onclick=()=>{
          state.g1Expanded=!state.g1Expanded;
          renderRows();
        };
        section.appendChild(more);
      }
      box.appendChild(section);
    }
  }

  function model(){
    return buildOverview({
      pos:state.pos,target:getTarget(),sourceForm:getSource(),
      ruleExamples,wordById,conjugator,FORM_META
    });
  }

  function firstDetail(){
    return model().groups[0].rows[0].detail;
  }

  function render(){
    renderControls();
    renderRows();
  }

  el('overviewFormMoreBtn').onclick=()=>{
    state.derivedExpanded=!state.derivedExpanded;
    renderControls();
  };
  return {render,syncFromDetail,firstDetail,state};
}
