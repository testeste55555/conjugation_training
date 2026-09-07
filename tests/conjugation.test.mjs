import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createConjugationEngine} from '../js/conjugation.js';

const vocabulary=JSON.parse(fs.readFileSync(new URL('../data/vocabulary.json',import.meta.url),'utf8'));
const expected=JSON.parse(fs.readFileSync(new URL('./expected-forms.json',import.meta.url),'utf8'));
const engine=createConjugationEngine(new Map(vocabulary.items.map(w=>[w.lemma,w])));

test('All canonical conjugations and dictionary-form prompts',()=>{
  let checked=0;
  for(const item of vocabulary.items){
    const rows=expected[item.lemma];
    assert.ok(rows,'Missing independent oracle: '+item.lemma);
    for(const [form,want] of Object.entries(rows)){
      const q={type:item.conjugationType,word:item.lemma,form};
      assert.equal(engine.answerFor(q),want,item.lemma+'/'+form);
      const source=form==='dict'&&item.pos==='verb'?rows.masu:item.lemma;
      assert.equal(engine.sourceFor(q),source,item.lemma+'/'+form+' source');
      checked+=2;
    }
  }
  assert.equal(checked,1260);
});
