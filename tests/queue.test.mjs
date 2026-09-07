import assert from 'node:assert/strict';
import test from 'node:test';
import {buildQuestionQueue} from '../js/question-queue.js';
test('Balanced, unique and non-adjacent question queues',()=>{
let cases=0, questions=0, avoidable=0;
for(const n of [1,2,3,4,5,8,10,13,14,19]){
  for(const m of [1,2,3,4,6,10,12]){
    const words=Array.from({length:n},(_,i)=>'w'+i);
    const forms=Array.from({length:m},(_,i)=>'f'+i);
    for(const count of [1,2,3,4,5,7,10,19,20,29,30,49,50]){
      for(const randomize of [false,true]){
        for(let trial=0;trial<(randomize?3:1);trial++){
          const q=buildQuestionQueue({type:'test',words,forms,count,randomize});
          assert.equal(q.length,count);
          const counts=forms.map(f=>q.filter(x=>x.form===f).length);
          assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
          const size=n*m;
          for(let i=0;i<count;i+=size){
            const cycle=q.slice(i,i+size);
            assert.equal(new Set(cycle.map(x=>x.word+'|'+x.form)).size,cycle.length);
          }
          if(n>1){
            for(let i=1;i<q.length;i++){
              if(q[i].word===q[i-1].word) avoidable++;
            }
          }
          cases++;questions+=count;
        }
      }
    }
  }
}
assert.equal(avoidable,0);
assert.equal(cases,3640);
assert.equal(questions,64120);
});

test('One-word queues repeat only after all available forms',()=>{
  const q=buildQuestionQueue({type:'g1',words:['おく'],forms:['masu','te'],count:5,randomize:false});
  assert.deepEqual(q.map(x=>x.form),['masu','te','masu','te','masu']);
});
test('Invalid queue input is rejected and deterministic mode is stable',()=>{
  const make=()=>buildQuestionQueue({type:'g1',words:['おく','かく','よむ'],forms:['masu','te'],count:5,randomize:false});
  assert.deepEqual(make(),make());
  assert.throws(()=>buildQuestionQueue({type:'g1',words:[],forms:['masu'],count:1}));
  assert.throws(()=>buildQuestionQueue({type:'g1',words:['おく','おく'],forms:['masu'],count:2}));
});
