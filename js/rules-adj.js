import {dropLast} from './conjugation.js';
import {escapeHtml,mark} from './rules-helpers.js';

export function createAdjectiveRuleModel({type,word,form,DATA,FORM_META,answerFor}){
  const final=answerFor({type,word,form});
  let prefix='',old='',replacement='',append='',action='とる',note='',special=false;
  const adjSuffix={nowYes:'です',nowNo:'くないです',pastYes:'かったです',pastNo:'くなかったです',teAdj:'くて',kuAdj:'く'};

  if(type==='iadj'){
    if(form==='nowYes'){
      prefix=word;action='そのまま';append='です';note='「い」は とりません。';
    }else if(word==='いい'){
      old='いい';replacement='よ';append=adjSuffix[form];action='かえる';special=true;note='「いい」→「よ」';
    }else{
      prefix=dropLast(word);old='い';append=adjSuffix[form];note='さいごの「い」を とります。';
    }
  }else{
    prefix=word;append=final.slice(prefix.length);action='そのまま';
    note=word==='きれい'
      ?'「きれい」は なけいようしです。「い」は とりません。'
      :'ことばは そのまま。うしろに つけます。';
  }

  const before=escapeHtml(prefix)+mark(old,'old-part');
  const middle=escapeHtml(prefix)+(
    action==='とる'?mark(old,'old-part removed'):
    action==='かえる'?mark(replacement,'new-part'):
    escapeHtml(old)
  );
  const after=escapeHtml(prefix)+mark(replacement+append,'new-part');

  return {
    title:DATA[type].label+'　／　'+FORM_META[form].prompt,
    intro:note,familyNote:'',special,
    step1:[before],step2:[middle],step3:[after],
    notes:[old?'ここを みる':'ことばを みる',action,append?'つける':'できあがり'],
    summary:escapeHtml(word)+' → '+escapeHtml(final)
  };
}
