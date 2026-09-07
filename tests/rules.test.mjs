import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createConjugationEngine,iStem,aStem,eStem} from '../js/conjugation.js';
import {createG1RuleModel} from '../js/rules-g1.js';
import {createG2RuleModel} from '../js/rules-g2.js';
import {createG3RuleModel} from '../js/rules-g3.js';
import {createAdjectiveRuleModel} from '../js/rules-adj.js';
const vocab=JSON.parse(fs.readFileSync(new URL('../data/vocabulary.json',import.meta.url),'utf8'));
const forms=JSON.parse(fs.readFileSync(new URL('../data/forms.json',import.meta.url),'utf8'));
const rules=JSON.parse(fs.readFileSync(new URL('../data/rule-examples.json',import.meta.url),'utf8'));
const gold=JSON.parse(fs.readFileSync(new URL('./expected-forms.json',import.meta.url),'utf8'));
const byId=new Map(vocab.items.map(w=>[w.id,w]));
const engine=createConjugationEngine(new Map(vocab.items.map(w=>[w.lemma,w])));
const words=ids=>ids.map(id=>byId.get(id).lemma);
const plain=s=>s.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
import {RULE_FAMILY_FORMS} from '../js/rules-family.js';

test('All rule models and optional family forms',()=>{
  const failures=[];
  let models=0,examples=0;
  const families=['masuFamily','naiFamily','te','ta','dict','potential','imperative','prohibitive'];
  const modelFor={g1:createG1RuleModel,g2:createG2RuleModel,g3:createG3RuleModel};
  const labelLine=(html,label)=>{
    const lines=[...html.matchAll(/<div class="form-line">([\s\S]*?)<\/div>/g)];
    const values=lines.map(m=>plain(m[1]));
    return values.find(x=>x.startsWith(label)) || '';
  };
  function verify(type,family,pattern){
    const model=modelFor[type]({
      pattern,family,RULE_FAMILY_META:rules.families,
      conjugateVerb:engine.conjugateVerb,FORM_META:forms.forms
    });
    models++;
    if(family==='te'||family==='ta'){
      const ruleText=plain(model.step2.join(''));
      const expectedLabel=family==='te'?'て形':'た形';
      const otherLabel=family==='te'?'た形':'て形';
      if(ruleText.includes(otherLabel)||model.step3.some(x=>x.includes('form-pair')))
        failures.push({type,family,kind:'paired-output'});
      if(model.paths.some(x=>Object.keys(x).length!==1||!x[family]))
        failures.push({type,family,kind:'extra-target'});
    }
    if(model.step3.length!==pattern.words.length)failures.push({type,family,kind:'example-count'});
    const expectedForms=RULE_FAMILY_FORMS[family]||[family];
    for(let i=0;i<pattern.words.length;i++){
      const word=pattern.words[i];
      examples++;
      const html=model.step3[i];
      if(RULE_FAMILY_FORMS[family]){
        const members=RULE_FAMILY_FORMS[family];
        if(!html.includes('class="family-extra" hidden'))failures.push({type,family,word,kind:'default-not-hidden'});
        const before=html.split('<div class="family-extra" hidden>')[0];
        if(!labelLine(before,forms.forms[members[0]].label).endsWith(gold[word][members[0]]))
          failures.push({type,family,word,kind:'principal'});
        for(const form of members.slice(1)){
          if(!labelLine(html,forms.forms[form].label).endsWith(gold[word][form]))
            failures.push({type,family,word,kind:'derived',form});
        }
      }else{
        const got=plain(html).replaceAll('て形','').replaceAll('た形','');
        const want=expectedForms.map(f=>gold[word][f]).join('');
        if(got!==want)failures.push({type,family,word,kind:'completion',got,want});
      }
      if(model.step1[i]===undefined)failures.push({type,family,word,kind:'missing-source'});
    }
    for(const value of [...model.step1,...model.step2,...model.step3,model.summary]){
      if(/undefined|null|NaN/.test(String(value)))failures.push({type,family,kind:'invalid-render'});
    }
  }
  for(const family of families){
    const g1patterns=(family==='te'||family==='ta')
      ?rules.g1.teTaPatterns.map(p=>({...p,words:words(p.wordIds)}))
      :rules.g1.endingOrder.map(ending=>({ending,words:words(rules.g1.endingExamples[ending])}));
    for(const pattern of g1patterns)verify('g1',family,pattern);
    for(const type of ['g2','g3'])
      for(const p of rules[type].patterns)verify(type,family,{...p,words:words(p.wordIds)});
  }
  for(const type of ['iadj','nadj']){
    const DATA=Object.fromEntries(Object.entries(forms.types).map(([k,v])=>[k,v]));
    for(const word of words(rules.adjectives[type].wordIds)){
      for(const form of forms.types[type].forms){
        const model=createAdjectiveRuleModel({type,word,form,DATA,FORM_META:forms.forms,answerFor:engine.answerFor});
        models++;examples++;
        if(plain(model.step3[0])!==gold[word][form])failures.push({type,word,form,kind:'adjective'});
      }
    }
  }
  assert.equal(models,108);
  assert.equal(examples,216);
  assert.deepEqual(failures,[]);
});
