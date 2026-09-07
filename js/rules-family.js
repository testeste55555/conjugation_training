import {escapeHtml, formLine, highlightChanged} from './rules-helpers.js';

export const RULE_FAMILY_FORMS = Object.freeze({
  masuFamily:['masu','masen','mashita','masendeshita'],
  naiFamily:['nai','nakatta']
});
export const DERIVED_FORM_IDS = Object.freeze(['masen','mashita','masendeshita','nakatta']);

// The principal form is always visible. Other members are present but hidden
// until the teacher explicitly opens the additional forms.
export function familyCompletions(word, type, family, FORM_META, conjugateVerb, sourceForm='masu') {
  const forms = RULE_FAMILY_FORMS[family];
  if (!forms) throw new Error('ルールの系列が見つかりません。');
  const source=sourceForm==='masu'?conjugateVerb(word,type,'masu'):word;
  const line = form => formLine(
    FORM_META[form].label,
    highlightChanged(source, conjugateVerb(word, type, form))
  );
  return '<div class="family-completions">' +
    '<div class="family-source">' + escapeHtml(source) + '</div>' +
    line(forms[0]) +
    '<div class="family-extra" hidden>' + forms.slice(1).map(line).join('') + '</div>' +
    '</div>';
}
