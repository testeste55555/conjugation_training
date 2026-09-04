# かつよう フラッシュカード — V2.7 Structured

> **リポジトリ最上位原則：GitHubにcommitするものは、原則として世界中に見られて問題ないものだけ。**

この版は **GitHub Free の public repository + GitHub Pages** を前提にしています。
`.gitignore` は秘密情報を守るアクセス制御ではなく、誤commit防止・ローカル作業領域の分離・生成物除外のために使用します。

詳細は [`REPOSITORY_POLICY.md`](./REPOSITORY_POLICY.md) を参照してください。

## 構成

```text
conjugation_training/
├─ .gitignore
├─ .nojekyll
├─ REPOSITORY_POLICY.md
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  ├─ data-loader.js
│  ├─ conjugation.js
│  ├─ practice.js
│  ├─ rules-ui.js
│  ├─ rules-helpers.js
│  ├─ rules-g1.js
│  ├─ rules-g2.js
│  ├─ rules-g3.js
│  └─ rules-adj.js
├─ data/
│  ├─ vocabulary.json
│  ├─ forms.json
│  └─ rule-examples.json
└─ README.md
```

## 役割

- `vocabulary.json`
  - 単語の正本です。
  - 学習者向けの単語一覧としては表示しません。
  - 今後の単語追加は原則ここだけで行えます。
- `forms.json`
  - グループ名、利用できる活用形、画面上の名称・問題文を管理します。
- `rule-examples.json`
  - 「活用ルール画面で、どの単語を例として見せるか」を管理します。
  - 語彙正本と教材上の例示選択を分離しています。
- `conjugation.js`
  - 活用形を生成します。
- `practice.js`
  - 教室人数分の問題生成、カード送り、ランダム処理を担当します。
- `rules-ui.js`
  - ルール画面の状態管理・UI描画を担当します。
- `rules-helpers.js`
  - ハイライトや「て形／た形」の共通表示処理を担当します。
- `rules-g1.js` / `rules-g2.js` / `rules-g3.js`
  - 各動詞グループのルール表示モデルを担当します。
- `rules-adj.js`
  - 形容詞の既存ルール表示を保持します（現在は設計保留）。
- `app.js`
  - データ読込、ページ切替、キーボード操作をまとめます。

## 単語を追加するとき

既存の活用規則で処理できる単語なら、`data/vocabulary.json` に1件追加します。

例：

```json
{
  "id": "W0065",
  "lemma": "なおす",
  "pos": "verb",
  "conjugationType": "g1",
  "order": 20,
  "enabled": true,
  "tags": ["work"]
}
```

`id` は重複させないでください。いったん付与したIDは、語の並び替えをしても変更しない想定です。

### 例外活用

規則どおりに生成できない形だけ `overrides` に書けます。

```json
{
  "id": "W0019",
  "lemma": "いく",
  "pos": "verb",
  "conjugationType": "g1",
  "enabled": true,
  "overrides": {
    "te": "いって",
    "ta": "いった"
  }
}
```

原則として、通常の「ます形・て形・ない形」などを全てJSONへ書く必要はありません。

## ルール画面の例に追加するとき

練習用語彙へ単語を追加しただけでは、ルール説明の例は自動では増やしていません。

ルール画面でも例として使いたい場合のみ、`data/rule-examples.json` の `wordIds` に語彙IDを追加します。

これにより、

- 練習に出す語彙
- ルール説明で代表例として見せる語彙

を別々に管理できます。

## 形容詞

い形容詞・な形容詞のデータと既存UIは保持していますが、現在の設計判断により `designStatus: "hold"` としています。
今回の構造分離では、形容詞ルールの再設計は行っていません。

## リポジトリ運用

このリポジトリは public repository で運用するため、
**commit済みの内容は公開可能なものとして扱います。**

`.gitignore` の主な除外対象は次です。

- `.env` と資格情報
- `_private/`, `_local/`
- `node_modules/`
- build / cache / test output
- ZIP等のローカル成果物
- IDE・OS由来ファイル

`data/*.json` は教材正本なのでignoreしません。

push前には以下を推奨します。

```bash
git status
git diff --staged
```

公開可否の判断ルールは `REPOSITORY_POLICY.md` にまとめています。

## GitHub Pages

このリポジトリは、`main` ブランチ直下をそのまま GitHub Pages で公開する構成です。
GitHub 上で次を設定してください。

1. `Settings` → `Pages` を開く
2. `Build and deployment` の `Source` を `Deploy from a branch` にする
3. Branch を `main`、フォルダを `/ (root)` にする
4. `Save` を押す

公開URLは通常、次になります。

```text
https://testeste55555.github.io/conjugation_training/
```

JSONを `fetch()` で読み込むため、Windowsで `index.html` を直接ダブルクリックして `file://` で開く方法は推奨しません。

ローカル確認をする場合は、このフォルダで例えば次を実行します。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開きます。

## 今後の拡張余地

この構造なら、将来的に以下を追加しやすくなっています。

- 語彙タグによる絞り込み
- 職種別・場面別語彙セット
- A1 / A2等の対象レベル
- 個人学習モード
- 苦手語・出題履歴
- 語彙JSONの複数ファイル分割

現在は管理しやすさを優先し、語彙正本は `vocabulary.json` 1ファイルにしています。
