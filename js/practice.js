import { VERB_TYPES } from './conjugation.js';

const el = id => document.getElementById(id);
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
));

export function initPractice({ DATA, FORM_META, conjugator }) {
  const { answerFor, sourceFor } = conjugator;

  const state = {
    mode:'classroom', page:'practice', type:'g1',
    selectedForms:new Set(DATA.g1.defaultForms),
    classSize:10, queue:[], index:0, shown:false,
    ok:0, again:0, mistakePool:[], started:false, dirty:false
  };

  const defaultFormsForType = type => new Set(DATA[type].defaultForms);

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clampClassSize(value) {
    const n = Math.round(Number(value) || 10);
    return Math.max(1, Math.min(50, n));
  }

  function markSettingsDirty() {
    if (!state.started) return;
    state.dirty = true;
    el('settingsNote').textContent = 'せっていを かえました。「れんしゅうを はじめる」を おしてください。';
    el('settingsNote').classList.add('dirty');
  }

  function renderTabs() {
    const box = el('typeTabs');
    box.innerHTML = '';
    for (const [key, val] of Object.entries(DATA)) {
      const b = document.createElement('button');
      b.className = 'tab' + (state.type === key ? ' active' : '');
      b.textContent = val.label;
      b.setAttribute('aria-pressed', state.type === key);
      b.onclick = () => {
        state.type = key;
        state.selectedForms = defaultFormsForType(key);
        renderTabs(); renderForms(); markSettingsDirty();
      };
      box.appendChild(b);
    }
  }

  function renderForms() {
    const box = el('formChips');
    box.innerHTML = '';
    for (const f of DATA[state.type].forms) {
      const b = document.createElement('button');
      b.className = 'chip' + (state.selectedForms.has(f) ? ' active' : '');
      b.textContent = FORM_META[f].label;
      b.setAttribute('aria-pressed', state.selectedForms.has(f));
      b.onclick = () => {
        if (state.selectedForms.has(f) && state.selectedForms.size === 1) return;
        state.selectedForms.has(f) ? state.selectedForms.delete(f) : state.selectedForms.add(f);
        renderForms(); markSettingsDirty();
      };
      box.appendChild(b);
    }
  }

  function distributeCounts(total, forms, randomize) {
    const order = [...forms];
    if (randomize) shuffle(order);
    const base = Math.floor(total / order.length);
    const extra = total % order.length;
    const counts = {};
    order.forEach((f, i) => counts[f] = base + (i < extra ? 1 : 0));
    return counts;
  }

  function avoidAdjacentWords(list) {
    for (let i = 1; i < list.length; i++) {
      if (list[i].word !== list[i - 1].word) continue;
      const j = list.findIndex((q, idx) =>
        idx > i && q.word !== list[i - 1].word &&
        (idx === list.length - 1 || list[idx + 1]?.word !== list[i].word)
      );
      if (j > i) [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function buildUniquePartial(count, forms, randomize) {
    const counts = distributeCounts(count, forms, randomize);
    const out = [];
    for (const f of forms) {
      const words = [...DATA[state.type].words];
      if (randomize) shuffle(words);
      for (const word of words.slice(0, counts[f])) out.push({type:state.type, word, form:f});
    }
    if (randomize) shuffle(out);
    return avoidAdjacentWords(out);
  }

  function makeQuestions() {
    state.classSize = clampClassSize(el('classSizeInput').value);
    el('classSizeInput').value = state.classSize;

    const forms = [...state.selectedForms];
    const randomize = el('shuffleCheck').checked;
    const uniqueCount = DATA[state.type].words.length * forms.length;
    let remaining = state.classSize;
    const qs = [];

    while (remaining > 0) {
      const take = Math.min(uniqueCount, remaining);
      const cycle = buildUniquePartial(take, forms, randomize);
      if (qs.length && cycle.length > 1 && qs[qs.length - 1].word === cycle[0].word) {
        const j = cycle.findIndex(q => q.word !== qs[qs.length - 1].word);
        if (j > 0) [cycle[0], cycle[j]] = [cycle[j], cycle[0]];
      }
      qs.push(...cycle);
      remaining -= take;
    }

    state.queue = qs; state.index = 0; state.shown = false;
    state.mistakePool = []; state.started = true; state.dirty = false;
    el('settingsNote').textContent = state.classSize + 'にんぶんの もんだいを つくりました。';
    el('settingsNote').classList.remove('dirty');
    renderCard();
  }

  const current = () => state.queue[state.index];

  function pulseFormBadge() {
    const b = el('formBadge');
    b.classList.remove('pulse');
    void b.offsetWidth;
    b.classList.add('pulse');
  }

  function renderCard() {
    const q = current();

    if (!state.started) {
      el('groupBadge').textContent = DATA[state.type].label;
      el('formBadge').textContent = '';
      el('targetText').textContent = 'せっていして、はじめて ください';
      el('wordText').textContent = '';
      el('answerText').textContent = '';
      el('answerText').classList.add('hiddenAnswer');
      el('hintText').textContent = '';
      el('showBtn').disabled = true; el('nextBtn').disabled = true;
      return;
    }

    if (!q) {
      el('groupBadge').textContent = DATA[state.type].label;
      el('formBadge').textContent = '';
      el('targetText').textContent = 'おわり';
      el('wordText').textContent = 'できました';
      el('answerText').textContent = '';
      el('answerText').classList.add('hiddenAnswer');
      el('hintText').textContent = '「さいしょから」で、べつの もんだいを つくれます。';
      el('showBtn').disabled = true; el('nextBtn').disabled = true;
      fitCard(); return;
    }

    state.shown = false;
    el('groupBadge').textContent = DATA[q.type].label;
    el('formBadge').textContent = FORM_META[q.form].label;

    if (VERB_TYPES.has(q.type) && FORM_META[q.form].label.endsWith('形')) {
      const core = FORM_META[q.form].label.slice(0, -1);
      el('targetText').innerHTML = '<span class="target-form-core">' + escapeHtml(core) + '</span>形に してください';
    } else {
      el('targetText').textContent = FORM_META[q.form].prompt;
    }

    el('wordText').textContent = sourceFor(q);
    el('answerText').textContent = answerFor(q);
    el('answerText').classList.add('hiddenAnswer');
    el('hintText').textContent = 'こたえを いってから、みて ください。';
    el('showBtn').disabled = false; el('nextBtn').disabled = false;
    fitCard(); pulseFormBadge();
  }

  function showAnswer() {
    if (!current()) return;
    state.shown = true;
    el('answerText').classList.remove('hiddenAnswer');
    el('hintText').textContent = 'こえに だして いいましょう。';
    el('showBtn').disabled = true;
    el('againBtn').disabled = false; el('okBtn').disabled = false;
  }

  function nextQuestion() {
    if (state.page !== 'practice' || !current()) return;
    state.index++; renderCard();
  }

  function judge(ok) {
    if (state.mode !== 'individual' || !state.shown || !current()) return;
    const q = current();
    if (ok) state.ok++;
    else {
      state.again++;
      if (el('repeatMistakes').checked) state.mistakePool.push({...q});
    }
    el('okCount').textContent = state.ok;
    el('againCount').textContent = state.again;
    state.index++;
    if (state.index >= state.queue.length && state.mistakePool.length) {
      const extra = [...state.mistakePool];
      state.mistakePool = [];
      if (el('shuffleCheck').checked) shuffle(extra);
      state.queue.push(...extra);
    }
    renderCard();
  }

  function fitCard() {
    requestAnimationFrame(() => {
      if (state.page !== 'practice') return;
      const card = el('flashcard'), style = getComputedStyle(card);
      const width = card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      for (const id of ['wordText','answerText']) {
        const node = el(id); node.style.fontSize = '';
        let size = parseFloat(getComputedStyle(node).fontSize);
        while (node.scrollWidth > width && size > 24) {
          size--; node.style.fontSize = size + 'px';
        }
      }
    });
  }

  const setPage = page => { state.page = page; };

  el('showBtn').onclick = showAnswer;
  el('nextBtn').onclick = nextQuestion;
  el('againBtn').onclick = () => judge(false);
  el('okBtn').onclick = () => judge(true);
  el('startBtn').onclick = makeQuestions;
  el('resetBtn').onclick = () => {
    state.ok = 0; state.again = 0;
    el('okCount').textContent = '0'; el('againCount').textContent = '0';
    makeQuestions();
  };
  el('shuffleCheck').onchange = markSettingsDirty;
  el('classSizeInput').onchange = () => {
    el('classSizeInput').value = clampClassSize(el('classSizeInput').value);
    markSettingsDirty();
  };
  el('classSizeInput').oninput = markSettingsDirty;
  el('sizeMinus').onclick = () => {
    el('classSizeInput').value = clampClassSize(Number(el('classSizeInput').value) - 1);
    markSettingsDirty();
  };
  el('sizePlus').onclick = () => {
    el('classSizeInput').value = clampClassSize(Number(el('classSizeInput').value) + 1);
    markSettingsDirty();
  };
  window.addEventListener('resize', fitCard);

  renderTabs(); renderForms(); renderCard();

  return {state, setPage, showAnswer, nextQuestion, judge, fitCard};
}
