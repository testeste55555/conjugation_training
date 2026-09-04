import { loadAppData } from './data-loader.js';
import { createConjugationEngine } from './conjugation.js';
import { initPractice } from './practice.js';
import { initRules } from './rules-ui.js';

const el=id=>document.getElementById(id);

async function boot(){
  try{
    const data=await loadAppData();
    const conjugator=createConjugationEngine(data.wordByLemma);

    const practice=initPractice({DATA:data.DATA,FORM_META:data.FORM_META,conjugator});
    const rules=initRules({
      DATA:data.DATA,FORM_META:data.FORM_META,ruleExamples:data.ruleExamples,
      wordById:data.wordById,conjugator
    });

    let page='practice';

    function setPage(nextPage){
      page=nextPage;practice.setPage(nextPage);
      el('practicePage').hidden=nextPage!=='practice';
      el('rulesPage').hidden=nextPage!=='rules';

      for(const [id,name] of [['practicePageBtn','practice'],['rulesPageBtn','rules']]){
        el(id).classList.toggle('active',nextPage===name);
        el(id).setAttribute('aria-pressed',nextPage===name);
      }

      if(nextPage==='rules')rules.renderRulePage();
      else practice.fitCard();
    }

    el('practicePageBtn').onclick=()=>setPage('practice');
    el('rulesPageBtn').onclick=()=>setPage('rules');

    document.addEventListener('keydown',e=>{
      if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||
        e.target.closest('input,select,textarea,[contenteditable="true"]')||
        (e.code==='Space'&&e.target.closest('button')))return;

      if(page==='rules'){
        if(e.code==='Space'||e.key==='ArrowRight'){e.preventDefault();rules.nextStep();}
        return;
      }

      if(e.code==='Space'){e.preventDefault();practice.showAnswer();}
      if(e.key==='ArrowRight'){
        e.preventDefault();
        practice.state.mode==='individual'?practice.judge(true):practice.nextQuestion();
      }
      if(e.key==='ArrowLeft'&&practice.state.mode==='individual'){
        e.preventDefault();practice.judge(false);
      }
    });
  }catch(error){
    console.error(error);
    document.body.innerHTML=`
      <main style="max-width:760px;margin:40px auto;padding:24px;font-family:sans-serif">
        <h1>データを よみこめませんでした</h1>
        <p>GitHub Pages などのWebサーバーから開いてください。</p>
        <pre style="white-space:pre-wrap">${escapeHtml(error.message)}</pre>
      </main>`;
  }
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

boot();
