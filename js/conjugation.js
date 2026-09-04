export const VERB_TYPES = new Set(['g1', 'g2', 'g3']);

export const lastChar = s => [...s].pop();
export const dropLast = s => [...s].slice(0, -1).join('');

export const iStem = {'う':'い','つ':'ち','る':'り','む':'み','ぶ':'び','ぬ':'に','く':'き','ぐ':'ぎ','す':'し'};
export const aStem = {'う':'わ','つ':'た','る':'ら','む':'ま','ぶ':'ば','ぬ':'な','く':'か','ぐ':'が','す':'さ'};
export const eStem = {'う':'え','つ':'て','る':'れ','む':'め','ぶ':'べ','ぬ':'ね','く':'け','ぐ':'げ','す':'せ'};

// 「ぬ」の規則は言語ルールとして保持するが、現行正本には該当語がないため
// 学習者向けルール例には表示しない。
export function createConjugationEngine(wordByLemma) {
  const recordFor = word => wordByLemma.get(word);

  function overrideFor(word, form) {
    return recordFor(word)?.overrides?.[form];
  }

  function g1Stem(word, map) {
    const c = lastChar(word);
    return dropLast(word) + (map[c] || c);
  }

  function g1TeTa(word, ta = false) {
    const override = overrideFor(word, ta ? 'ta' : 'te');
    if (override) return override;

    const c = lastChar(word);
    const stem = dropLast(word);
    if (['う','つ','る'].includes(c)) return stem + (ta ? 'った' : 'って');
    if (['む','ぶ','ぬ'].includes(c)) return stem + (ta ? 'んだ' : 'んで');
    if (c === 'く') return stem + (ta ? 'いた' : 'いて');
    if (c === 'ぐ') return stem + (ta ? 'いだ' : 'いで');
    if (c === 'す') return stem + (ta ? 'した' : 'して');
    return word;
  }

  function conjugateVerb(word, type, form) {
    const directOverride = overrideFor(word, form);
    if (directOverride) return directOverride;
    if (form === 'dict') return word;

    if (type === 'g1') {
      const stem = g1Stem(word, iStem);
      if (form === 'masu') return stem + 'ます';
      if (form === 'masen') return stem + 'ません';
      if (form === 'mashita') return stem + 'ました';
      if (form === 'masendeshita') return stem + 'ませんでした';
      if (form === 'te') return g1TeTa(word, false);
      if (form === 'ta') return g1TeTa(word, true);
      if (form === 'nai') return g1Stem(word, aStem) + 'ない';
      if (form === 'nakatta') return g1Stem(word, aStem) + 'なかった';
      if (form === 'potential') return g1Stem(word, eStem) + 'る';
    }

    if (type === 'g2') {
      const stem = dropLast(word);
      if (form === 'masu') return stem + 'ます';
      if (form === 'masen') return stem + 'ません';
      if (form === 'mashita') return stem + 'ました';
      if (form === 'masendeshita') return stem + 'ませんでした';
      if (form === 'te') return stem + 'て';
      if (form === 'ta') return stem + 'た';
      if (form === 'nai') return stem + 'ない';
      if (form === 'nakatta') return stem + 'なかった';
      if (form === 'potential') return stem + 'られる';
    }

    if (type === 'g3') {
      const record = recordFor(word);
      const subtype = record?.subtype ?? (word === 'くる' ? 'kuru' : 'suru');

      if (subtype === 'kuru') {
        const map = {
          masu:'きます', masen:'きません', mashita:'きました',
          masendeshita:'きませんでした', te:'きて', nai:'こない',
          ta:'きた', nakatta:'こなかった', potential:'こられる'
        };
        return map[form] || word;
      }

      const stem = word === 'する' ? '' : word.slice(0, -2);
      const map = {
        masu:'します', masen:'しません', mashita:'しました',
        masendeshita:'しませんでした', te:'して', nai:'しない',
        ta:'した', nakatta:'しなかった', potential:'できる'
      };
      return stem + (map[form] || 'する');
    }

    return word;
  }

  function conjugateAdj(word, type, form) {
    const directOverride = overrideFor(word, form);
    if (directOverride) return directOverride;

    if (type === 'iadj') {
      const stem = dropLast(word);
      if (form === 'nowYes') return word + 'です';
      if (form === 'nowNo') return stem + 'くないです';
      if (form === 'pastYes') return stem + 'かったです';
      if (form === 'pastNo') return stem + 'くなかったです';
      if (form === 'teAdj') return stem + 'くて';
      if (form === 'kuAdj') return stem + 'く';
    }

    if (type === 'nadj') {
      if (form === 'nowYes') return word + 'です';
      if (form === 'nowNo') return word + 'じゃないです';
      if (form === 'pastYes') return word + 'でした';
      if (form === 'pastNo') return word + 'じゃなかったです';
      if (form === 'naAdj') return word + 'な';
      if (form === 'deAdj') return word + 'で';
    }

    return word;
  }

  function answerFor(q) {
    return q.type === 'iadj' || q.type === 'nadj'
      ? conjugateAdj(q.word, q.type, q.form)
      : conjugateVerb(q.word, q.type, q.form);
  }

  function sourceFor(q) {
    return q.form === 'dict' && VERB_TYPES.has(q.type)
      ? conjugateVerb(q.word, q.type, 'masu')
      : q.word;
  }

  return { conjugateVerb, conjugateAdj, answerFor, sourceFor };
}
