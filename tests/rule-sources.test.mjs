import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createConjugationEngine} from '../js/conjugation.js';
import {createRulePath,rulePatternLabel,VERB_RULE_FAMILIES} from '../js/rules-source.js';
import {createG1RuleModel} from '../js/rules-g1.js';
import {createG2RuleModel} from '../js/rules-g2.js';
import {createG3RuleModel} from '../js/rules-g3.js';
import {RULE_FAMILY_FORMS} from '../js/rules-family.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const vocabulary=read('../data/vocabulary.json');
const forms=read('../data/forms.json');
const examples=read('../data/rule-examples.json');
const gold=read('./expected-forms.json');
const byId=new Map(vocabulary.items.map(w=>[w.id,w]));
const engine=createConjugationEngine(new Map(vocabulary.items.map(w=>[w.lemma,w])));
const words=ids=>ids.map(id=>byId.get(id).lemma);
const plain=html=>html.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
const models={g1:createG1RuleModel,g2:createG2RuleModel,g3:createG3RuleModel};

test('Both source routes reproduce every independent canonical answer',()=>{
  let paths=0,operations=0;
  for(const item of vocabulary.items.filter(w=>w.pos==='verb')){
    for(const [form,want] of Object.entries(gold[item.lemma])){
      for(const sourceForm of ['masu','dict']){
        const path=createRulePath(item.lemma,item.conjugationType,form,sourceForm,engine.conjugateVerb);
        const source=sourceForm==='masu'?gold[item.lemma].masu:item.lemma;
        assert.equal(path.source,source);
        assert.equal(path.target,want);
        let cursor=source;
        for(const op of path.operations){
          assert.equal(op.from,cursor);
          assert.ok(cursor.endsWith(op.old));
          cursor=cursor.slice(0,cursor.length-op.old.length)+op.replacement;
          assert.equal(cursor,op.to);
          operations++;
        }
        assert.equal(cursor,want);
        if(source===want)assert.equal(path.operations.length,0);
        if(form==='prohibitive'){
          assert.equal(path.operations.length,sourceForm==='masu'?2:1);
          if(sourceForm==='masu')assert.equal(path.operations[0].to,item.lemma);
        }
        paths++;
      }
    }
  }
  assert.equal(paths,984);
  assert.ok(operations>0);
});

test('All rule examples and both routes are generated from the same engine',()=>{
  let count=0,completed=0;
  for(const sourceForm of ['masu','dict']){
    for(const family of VERB_RULE_FAMILIES){
      const gp=(family==='te'||family==='ta')
        ?examples.g1.teTaPatterns.map(p=>({...p,words:words(p.wordIds)}))
        :examples.g1.endingOrder.map(ending=>({ending,words:words(examples.g1.endingExamples[ending])}));
      for(const [type,patterns] of [
        ['g1',gp],
        ['g2',examples.g2.patterns.map(p=>({...p,words:words(p.wordIds)}))],
        ['g3',examples.g3.patterns.map(p=>({...p,words:words(p.wordIds)}))]
      ]){
        for(const pattern of patterns){
          const model=models[type]({
            pattern,family,sourceForm,RULE_FAMILY_META:examples.families,
            conjugateVerb:engine.conjugateVerb,FORM_META:forms.forms
          });
          assert.equal(model.sourceForm,sourceForm);
          assert.equal(model.step1.length,pattern.words.length);
          assert.equal(model.step3.length,pattern.words.length);
          const targetForms=RULE_FAMILY_FORMS[family]||[family==='masuFamily'?'masu':family==='naiFamily'?'nai':family];
          for(let i=0;i<pattern.words.length;i++){
            const word=pattern.words[i],paths=model.paths[i];
            const source=sourceForm==='masu'?gold[word].masu:word;
            assert.ok(plain(model.step1[i]).includes(source));
            for(const form of targetForms){
              assert.equal(paths[form].target,gold[word][form]);
              assert.equal(paths[form].source,source);
              completed++;
            }
            const rendered=plain(model.step3[i]);
            for(const form of targetForms)assert.ok(rendered.includes(gold[word][form]));
            if(RULE_FAMILY_FORMS[family]){
              assert.ok(model.step3[i].includes('class="family-extra" hidden'));
              const basic=model.step3[i].split('<div class="family-extra" hidden>')[0];
              assert.ok(plain(basic).includes(gold[word][targetForms[0]]));
            }
            if(family==='prohibitive'&&sourceForm==='masu')
              assert.ok(plain(model.step2.join('')).includes(word));
          }
          if(family==='dict'&&sourceForm==='dict'){
            assert.ok(model.paths.every(p=>p.dict.operations.length===0));
            assert.ok(plain(model.step2.join('')).includes('そのまま'));
          }
          if(family==='masuFamily'&&sourceForm==='masu'){
            assert.ok(model.paths.every(p=>p.masu.operations.length===0));
          }
          count++;
        }
      }
    }
  }
  assert.equal(count,168);
  assert.ok(completed>0);
});

test('Group-one displayed suffixes match the selected source',()=>{
  const p={key:'uturu',label:'う・つ・る',words:['つかう','まつ','とる'],te:'って',ta:'った'};
  for(const family of ['te','ta']){
    assert.equal(rulePatternLabel(p,'g1',family,'dict',engine.conjugateVerb),'う・つ・る');
    assert.equal(rulePatternLabel(p,'g1',family,'masu',engine.conjugateVerb),'う・つ・る');
  }
  const special={key:'iku',label:'いく',words:['いく'],te:'いって',ta:'いった',special:true};
  assert.equal(rulePatternLabel(special,'g1','te','masu',engine.conjugateVerb),'いく');
  for(const sourceForm of ['masu','dict']){
    const path=createRulePath('しぬ','g1','nai',sourceForm,engine.conjugateVerb);
    assert.equal(path.target,'しなない');
  }
  assert.throws(()=>createRulePath('かく','g1','nai','invalid',engine.conjugateVerb));
});
