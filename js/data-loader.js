import {validateAppData} from './data-validation.js';

export async function loadAppData() {
  const [vocabulary, formsConfig, ruleExamples] = await Promise.all([
    fetch('./data/vocabulary.json').then(checkResponse),
    fetch('./data/forms.json').then(checkResponse),
    fetch('./data/rule-examples.json').then(checkResponse)
  ]);

  validateAppData(vocabulary, formsConfig, ruleExamples);

  const wordById = new Map(vocabulary.items.map(item => [item.id, item]));
  const wordByLemma = new Map(vocabulary.items.map(item => [item.lemma, item]));

  const DATA = {};
  for (const [type, meta] of Object.entries(formsConfig.types)) {
    const words = vocabulary.items
      .filter(item => item.enabled !== false && item.conjugationType === type)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      .map(item => item.lemma);

    DATA[type] = {
      label: meta.label,
      words,
      forms: meta.forms,
      defaultForms: meta.defaultForms ?? meta.forms,
      designStatus: meta.designStatus ?? 'active'
    };
  }

  return {
    vocabulary,
    formsConfig,
    ruleExamples,
    wordById,
    wordByLemma,
    DATA,
    FORM_META: formsConfig.forms
  };
}

async function checkResponse(response) {
  if (!response.ok) {
    throw new Error(`データを読みこめませんでした: ${response.url} (${response.status})`);
  }
  return response.json();
}
