import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createConjugationEngine} from '../js/conjugation.js';
import {createRulePath} from '../js/rules-source.js';
import {buildOverview,OVERVIEW_TARGETS,OVERVIEW_ADJECTIVE_FORMS} from '../js/rules-overview-data.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const vocabulary=read('../data/vocabulary.json');
const forms=read('../data/forms.json');
const rules=read('../data/rule-examples.json');
const expected=read('./expected-forms.json');
const wordById=new Map(vocabulary.items.map(w=>[w.id,w]));
const engine=createConjugationEngine(new Map(vocabulary.items.map(w=>[w.lemma,w])));
const input={ruleExamples:rules,wordById,conjugator:engine,FORM_META:forms.forms};

test('Every overview row matches the independent answer table',()=>{
  let models=0,rows=0,operations=0;
  for(const pos of ['verb','adjective']){
    for(const target of OVERVIEW_TARGETS[pos]){
      for(const sourceForm of (pos==='verb'?['masu','dict']:['masu'])){
        const model=buildOverview({...input,pos,target,sourceForm});
        assert.equal(model.target,target);
        const types=pos==='verb'?['g1','g2','g3']:
          target==='kuAdj'?['iadj']:target==='naAdj'?['nadj']:['iadj','nadj'];
        assert.deepEqual(model.groups.map(g=>g.type),types);
        const keys=new Set();
        for(const group of model.groups){
          assert.ok(group.rows.length);
          assert.equal(group.label,forms.types[group.type].label);
          for(const row of group.rows){
            assert.ok(!keys.has(row.key));keys.add(row.key);
            const word=wordById.get(row.wordId);
            assert.equal(word.conjugationType,row.type);
            assert.equal(row.detail.type,row.type);
            assert.equal(row.detail.form,row.form);
            assert.equal(row.detail.wordId,row.wordId);
            assert.equal(row.detail.patternKey,row.patternKey);
            const source=pos==='verb'&&sourceForm==='masu'?expected[word.lemma].masu:word.lemma;
            assert.equal(row.source,source);
            assert.equal(row.target,expected[word.lemma][row.form]);
            let cursor=row.source;
            for(const op of row.operations){
              assert.equal(op.from,cursor);
              assert.ok(cursor.endsWith(op.old));
              cursor=cursor.slice(0,cursor.length-op.old.length)+op.replacement;
              assert.equal(cursor,op.to);
              operations++;
            }
            assert.equal(cursor,row.target);
            if(pos==='verb'){
              const path=createRulePath(word.lemma,row.type,target,sourceForm,engine.conjugateVerb);
              assert.deepEqual(row.operations,path.operations);
              const patterns=row.type==='g1'
                ?['te','ta'].includes(target)?rules.g1.teTaPatterns:
                  rules.g1.endingOrder.map(ending=>({key:ending,wordIds:rules.g1.endingExamples[ending]}))
                :rules[row.type].patterns;
              assert.ok(patterns.some(p=>p.key===row.patternKey&&p.wordIds.includes(row.wordId)));
              assert.equal(row.detail.source,sourceForm);
            }else{
              assert.ok(rules.adjectives[row.type].wordIds.includes(row.wordId));
              assert.equal(row.detail.source,undefined);
            }
            rows++;
          }
        }
        if(pos==='verb'){
          assert.equal(model.groups[0].rows.length,['te','ta'].includes(target)?6:8);
          assert.equal(model.groups[1].rows.length,1);
          assert.equal(model.groups[2].rows.length,2);
        }
        models++;
      }
    }
  }
  assert.equal(models,31);
  assert.equal(rows,280);
  assert.ok(operations>0);
});

test('Adjective overview keeps categories distinct and preserves exceptions',()=>{
  const connect=buildOverview({...input,pos:'adjective',target:'connect'});
  assert.deepEqual(connect.groups.map(g=>g.rows[0].form),['teAdj','deAdj']);
  assert.equal(connect.groups[0].rows.find(r=>r.special).source,'いい');
  assert.equal(connect.groups[0].rows.find(r=>r.special).target,'よくて');
  assert.equal(connect.groups[1].rows[1].source,'きれい');
  assert.equal(connect.groups[1].rows[1].target,'きれいで');
  for(const target of ['imperative','prohibitive']){
    assert.ok(!OVERVIEW_TARGETS.adjective.includes(target));
  }
  assert.deepEqual(OVERVIEW_ADJECTIVE_FORMS.kuAdj,{iadj:'kuAdj'});
  assert.deepEqual(OVERVIEW_ADJECTIVE_FORMS.naAdj,{nadj:'naAdj'});
  assert.throws(()=>buildOverview({...input,pos:'adjective',target:'imperative'}));
  assert.throws(()=>buildOverview({...input,pos:'verb',target:'te',sourceForm:'invalid'}));
});
