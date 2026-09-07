// Build a balanced classroom queue without repeating a word/form pair
// until every available pair has been used.
const shuffle = (items, rng) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

function distributeCounts(total, forms, randomize, rng) {
  const order = [...forms];
  if (randomize) shuffle(order, rng);
  const base = Math.floor(total / order.length);
  const extra = total % order.length;
  return new Map(order.map((form, i) => [form, base + (i < extra ? 1 : 0)]));
}

// Assign distinct words to each form while keeping word frequencies balanced.
// A small bipartite max-flow avoids the duplicate-word bias of selecting the
// first few words independently for every form.
function assignPairs(words, forms, counts, targets) {
  const n = words.length, m = forms.length;
  const source = 0, firstForm = 1, firstWord = firstForm + m;
  const sink = firstWord + n;
  const graph = Array.from({length: sink + 1}, () => []);
  const add = (u, v, cap) => {
    const a = {to:v, cap, rev:graph[v].length};
    const b = {to:u, cap:0, rev:graph[u].length};
    graph[u].push(a); graph[v].push(b);
  };
  for (let f = 0; f < m; f++) {
    add(source, firstForm + f, counts.get(forms[f]));
    for (let w = 0; w < n; w++) add(firstForm + f, firstWord + w, 1);
  }
  for (let w = 0; w < n; w++) add(firstWord + w, sink, targets[w]);
  let flow = 0;
  const total = [...counts.values()].reduce((a,b) => a+b, 0);
  while (flow < total) {
    const parent = Array(sink + 1).fill(null);
    const queue = [source];
    parent[source] = {from:-1};
    for (let head = 0; head < queue.length && !parent[sink]; head++) {
      const u = queue[head];
      for (let i = 0; i < graph[u].length; i++) {
        const edge = graph[u][i];
        if (edge.cap > 0 && !parent[edge.to]) {
          parent[edge.to] = {from:u, edge:i};
          queue.push(edge.to);
        }
      }
    }
    if (!parent[sink]) throw new Error('出題の組合せを作れませんでした。');
    let augment = Infinity;
    for (let v = sink; v !== source; v = parent[v].from) {
      const p = parent[v];
      augment = Math.min(augment, graph[p.from][p.edge].cap);
    }
    for (let v = sink; v !== source; v = parent[v].from) {
      const p = parent[v], edge = graph[p.from][p.edge];
      edge.cap -= augment;
      graph[v][edge.rev].cap += augment;
    }
    flow += augment;
  }
  const pairs = [];
  for (let f = 0; f < m; f++) {
    for (const edge of graph[firstForm + f]) {
      if (edge.to >= firstWord && edge.to < sink && edge.cap === 0) {
        pairs.push({word:words[edge.to - firstWord], form:forms[f]});
      }
    }
  }
  return pairs;
}

function balancedTargets(words, count, previousWord, usage, randomize, rng, cycle) {
  const n = words.length, base = Math.floor(count / n);
  const targets = Array(n).fill(base);
  let extras = count % n;
  const order = [...words.keys()];
  if (randomize) shuffle(order, rng);
  else if (n > 1) {
    const offset = cycle % n;
    order.push(...order.splice(0, offset));
  }
  const rank = new Map(order.map((index, i) => [index, i]));
  order.sort((a,b) => (usage.get(words[a]) || 0) - (usage.get(words[b]) || 0)
    || rank.get(a) - rank.get(b));
  // With two words and an odd count, the preceding word cannot receive
  // the extra occurrence. The same condition applies to a single question.
  if (n > 1 && previousWord !== null && (count === 1 || (n === 2 && count % 2 === 1))) {
    order.sort((a,b) => Number(words[a] === previousWord) - Number(words[b] === previousWord)
      || (usage.get(words[a]) || 0) - (usage.get(words[b]) || 0)
      || rank.get(a) - rank.get(b));
  }
  for (const index of order) {
    if (!extras) break;
    targets[index]++;
    extras--;
  }
  return targets;
}

// The largest remaining word bucket is chosen unless it is the preceding
// word. Balanced target counts make an avoidable adjacency impossible.
function arrangePairs(pairs, previousWord, randomize, rng, wordOrder) {
  const buckets = new Map();
  for (const pair of pairs) {
    if (!buckets.has(pair.word)) buckets.set(pair.word, []);
    buckets.get(pair.word).push(pair);
  }
  for (const bucket of buckets.values()) if (randomize) shuffle(bucket, rng);
  const order = [...buckets.keys()];
  if (randomize) shuffle(order, rng);
  else order.sort((a,b) => wordOrder.get(a) - wordOrder.get(b));
  const rank = new Map(order.map((word,i) => [word,i]));
  const output = [];
  let previous = previousWord;
  while (output.length < pairs.length) {
    const candidates = [...buckets.keys()].filter(word => buckets.get(word).length && word !== previous);
    const available = candidates.length ? candidates : [...buckets.keys()].filter(word => buckets.get(word).length);
    available.sort((a,b) => buckets.get(b).length - buckets.get(a).length || rank.get(a) - rank.get(b));
    const word = available[0];
    output.push(buckets.get(word).shift());
    previous = word;
  }
  return output;
}

export function buildQuestionQueue({type, words, forms, count, randomize = true, rng = Math.random}) {
  if (!words.length || !forms.length) throw new Error('ことばと かたちを えらんでください。');
  if (new Set(words).size !== words.length || new Set(forms).size !== forms.length) {
    throw new Error('出題データに重複があります。');
  }
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('にんずうを かくにんしてください。');
  const uniqueCount = words.length * forms.length;
  const wordOrder = new Map(words.map((word,i) => [word,i]));
  const usage = new Map(words.map(word => [word,0]));
  const result = [];
  let remaining = count, cycle = 0;
  while (remaining > 0) {
    const take = Math.min(uniqueCount, remaining);
    const counts = distributeCounts(take, forms, randomize, rng);
    const previous = result.length ? result[result.length - 1].word : null;
    const targets = balancedTargets(words, take, previous, usage, randomize, rng, cycle);
    const pairs = assignPairs(words, forms, counts, targets);
    const arranged = arrangePairs(pairs, previous, randomize, rng, wordOrder);
    for (const pair of arranged) {
      result.push({type, ...pair});
      usage.set(pair.word, usage.get(pair.word) + 1);
    }
    remaining -= take;
    cycle++;
  }
  return result;
}
