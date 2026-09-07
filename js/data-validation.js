// Validate the canonical data before constructing lookup maps.
// The validator checks structure and references, not educational word selection.
export function validateAppData(vocabulary, formsConfig, ruleExamples) {
  const errors = [];
  const fail = message => errors.push(message);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const unique = (values, label) => {
    const seen = new Set();
    for (const value of values) {
      if (seen.has(value)) fail(label + 'が重複しています: ' + value);
      seen.add(value);
    }
  };
  const types = new Set(['g1','g2','g3','iadj','nadj']);
  const positions = {g1:'verb',g2:'verb',g3:'verb',iadj:'i-adjective',nadj:'na-adjective'};
  const supportedForms = new Set([
    'masu','masen','mashita','masendeshita','te','nai','ta','dict','nakatta','potential',
    'imperative','prohibitive','nowYes','nowNo','pastYes','pastNo','teAdj','kuAdj','naAdj','deAdj'
  ]);
  for (const [label, value] of [
    ['vocabulary.json',vocabulary],['forms.json',formsConfig],['rule-examples.json',ruleExamples]
  ]) {
    if (!object(value) || value.schemaVersion !== 1) fail(label + 'のschemaVersionを確認してください。');
  }
  if (!Array.isArray(vocabulary?.items)) fail('語彙itemsが配列ではありません。');
  if (!object(formsConfig?.types) || !object(formsConfig?.forms)) fail('活用形設定が不正です。');
  if (!object(ruleExamples?.families)) fail('ルール系列が不正です。');
  if (errors.length) throw new Error('データの確認が必要です。\n' + errors.join('\n'));

  const sources=formsConfig.ruleSources;
  if(!object(sources) || sources.default!=='masu' || !Array.isArray(sources.options)){
    fail('ルールの起点設定が不正です。');
  }else{
    unique(sources.options.map(option=>option?.value),'ルールの起点');
    for(const source of ['masu','dict']){
      const option=sources.options.find(item=>item?.value===source);
      if(!option || !text(option.label))fail('ルールの起点が不足しています: '+source);
    }
    if(sources.options.some(option=>!['masu','dict'].includes(option?.value) || !text(option?.label)))
      fail('ルールの起点が不正です。');
  }

  const items = vocabulary.items;
  if (!items.length) fail('語彙がありません。');
  unique(items.map(w=>w?.id), '語彙ID');
  unique(items.map(w=>w?.lemma), '語彙の原形');
  const byId = new Map(items.map(w=>[w.id,w]));
  for (const [i,w] of items.entries()) {
    const where = '語彙' + (w?.id || '#' + (i+1));
    if (!object(w)) { fail(where + 'が不正です。'); continue; }
    if (!/^W[0-9]+$/.test(w.id || '')) fail(where + ': IDの形式が不正です。');
    if (!text(w.lemma)) fail(where + ': 原形がありません。');
    if (!types.has(w.conjugationType) || w.pos !== positions[w.conjugationType])
      fail(where + ': 活用分類と品詞が一致しません。');
    if (!Number.isFinite(w.order)) fail(where + ': 並び順が不正です。');
    if (w.enabled !== undefined && typeof w.enabled !== 'boolean') fail(where + ': enabledが不正です。');
    if (!Array.isArray(w.tags) || w.tags.some(t=>!text(t))) fail(where + ': tagsが不正です。');
    if (w.conjugationType === 'g3' && !['suru','kuru'].includes(w.subtype))
      fail(where + ': 3グループのsubtypeが不正です。');
    if (w.subtype === 'suru' && text(w.lemma) && !w.lemma.endsWith('する'))
      fail(where + ': する動詞の原形を確認してください。');
    if (w.subtype === 'kuru' && w.lemma !== 'くる')
      fail(where + ': くる動詞の原形を確認してください。');
    if (w.conjugationType === 'g1' && text(w.lemma) && !'うつるむぶぬくぐす'.includes(w.lemma.slice(-1)))
      fail(where + ': 1グループの語尾が不正です。');
    if (w.conjugationType === 'g2' && text(w.lemma) && !w.lemma.endsWith('る'))
      fail(where + ': 2グループの原形が不正です。');
    if (w.overrides !== undefined) {
      if (!object(w.overrides)) fail(where + ': overridesが不正です。');
      else for (const [form,value] of Object.entries(w.overrides)) {
        if (!supportedForms.has(form) || !formsConfig.types[w.conjugationType]?.forms?.includes(form) || !text(value))
          fail(where + ': 例外活用が不正です: ' + form);
      }
    }
  }

  for (const type of types) {
    const meta = formsConfig.types[type];
    if (!object(meta) || !text(meta.label) || !Array.isArray(meta.forms) || !meta.forms.length) {
      fail(type + ': 活用形設定が不正です。'); continue;
    }
    unique(meta.forms,type + 'の活用形');
    if (['g1','g2','g3'].includes(type)) {
      const required=['masu','masen','mashita','masendeshita','te','nai','ta','dict','nakatta','potential','imperative','prohibitive'];
      if(required.some(form=>!meta.forms.includes(form)))fail(type + ': 必須の活用形が不足しています。');
    }
    if (!Array.isArray(meta.defaultForms) || !meta.defaultForms.length ||
        meta.defaultForms.some(f=>!meta.forms.includes(f)))
      fail(type + ': 初期活用形が不正です。');
    for (const form of meta.forms) {
      if (!supportedForms.has(form) || !object(formsConfig.forms[form]) ||
          !text(formsConfig.forms[form]?.label) || !text(formsConfig.forms[form]?.prompt))
        fail(type + ': 未定義の活用形 ' + form);
    }
  }
  for (const [form,meta] of Object.entries(formsConfig.forms)) {
    if (!supportedForms.has(form) || !object(meta) || !text(meta.label) || !text(meta.prompt))
      fail('活用形メタデータが不正です: ' + form);
    if (meta.sourceForm !== undefined && !supportedForms.has(meta.sourceForm))
      fail(form + ': 出題元の活用形が不正です。');
  }
  const expectedFamilies = ['masuFamily','naiFamily','te','ta','dict','potential','imperative','prohibitive'];
  for (const family of expectedFamilies) {
    if (!text(ruleExamples.families[family]?.label) || !text(ruleExamples.families[family]?.note))
      fail('ルール系列が不正です: ' + family);
  }
  const refs = (ids,type,where,ending=null) => {
    if (!Array.isArray(ids) || !ids.length) { fail(where + ': 例示語がありません。'); return; }
    unique(ids,where + 'の参照ID');
    for (const id of ids) {
      const w = byId.get(id);
      if (!w) { fail(where + ': 存在しない参照ID ' + id); continue; }
      if (w.conjugationType !== type) fail(where + ': 活用分類が一致しません: ' + id);
      if (ending && text(w.lemma) && !w.lemma.endsWith(ending)) fail(where + ': 語尾が一致しません: ' + id);
    }
  };
  const g1 = ruleExamples.g1;
  if (!object(g1) || !Array.isArray(g1.endingOrder) || !object(g1.endingExamples) ||
      !Array.isArray(g1.teTaPatterns)) fail('1グループのルール設定が不正です。');
  else {
    unique(g1.endingOrder,'1グループの語尾');
    for (const ending of g1.endingOrder) {
      if (!'うつるむぶぬくぐす'.includes(ending) || ending.length !== 1) fail('語尾が不正です: '+ending);
      refs(g1.endingExamples[ending],'g1','1グループ/'+ending,ending);
    }
    for (const p of g1.teTaPatterns) {
      if (!text(p.key) || !text(p.label) || !text(p.te) || !text(p.ta))
        fail('て・た系の設定が不正です。');
      refs(p.wordIds,'g1','て・た系/'+p.key);
    }
  }
  for (const type of ['g2','g3']) {
    const patterns=ruleExamples[type]?.patterns;
    if (!Array.isArray(patterns) || !patterns.length) { fail(type+'のルール設定が不正です。'); continue; }
    unique(patterns.map(p=>p.key),type+'のパターン');
    for (const p of patterns) {
      if (!text(p.key) || !text(p.label)) fail(type+': パターン名が不正です。');
      refs(p.wordIds,type,type+'/'+p.key);
      if (type==='g3' && ['suru','kuru'].includes(p.key)) {
        for (const id of p.wordIds || []) {
          const w=byId.get(id);
          if (w && w.subtype!==p.key) fail(type+'/'+p.key+': subtypeが一致しません: '+id);
        }
      }
    }
  }
  for (const type of ['iadj','nadj'])
    refs(ruleExamples.adjectives?.[type]?.wordIds,type,type+'の例示語');

  if (errors.length) throw new Error('データの確認が必要です。\n' + errors.join('\n'));
  return true;
}
