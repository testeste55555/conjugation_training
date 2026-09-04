# Repository Policy

## 最上位原則

> **GitHubにcommitするものは、原則として世界中に見られて問題ないものだけ。**

このリポジトリは GitHub Free の public repository と GitHub Pages で運用することを前提とします。

`.gitignore` はセキュリティ境界そのものではありません。
役割は、誤commitの防止、ローカル作業領域の分離、生成物・一時ファイルの除外です。

## commitしてよいもの

このリポジトリでは、原則として次をGit管理します。

- HTML / CSS / JavaScript
- `data/vocabulary.json`
- `data/forms.json`
- `data/rule-examples.json`
- README・設計文書
- 公開して問題のない教材画像や静的アセット
- GitHub Pagesで利用者へ配信して問題のないデータ

## commitしてはいけないもの

次は public repository に置きません。

- API secret
- アクセストークン
- パスワード
- 秘密鍵
- service account の秘密情報
- 学習者・受講者等の個人情報
- 顧客・取引先等の非公開情報
- 契約上公開できない教材・資料
- 公開前提ではない内部資料

迷うファイルは、正式ディレクトリへ置く前に公開可否を判断します。

## ローカル専用領域

ローカル作業では、次の名前を使用できます。

- `_private/` : GitHubへ置かない内部資料
- `_local/` : ローカルのみで使用する作業データ
- `scratch/` : 一時検証
- `tmp/`, `temp/` : 一時生成物

これらは `.gitignore` で除外します。

ただし、本物のパスワードや秘密鍵を `_private/` に長期保管する運用は避けます。

## JSONの扱い

`*.json` 全体はignoreしません。

以下は本アプリの正本であり、Git管理対象です。

- `data/vocabulary.json`
- `data/forms.json`
- `data/rule-examples.json`

一方、資格情報を含むJSONは正本データと同じ場所へ置かず、
`.gitignore` 対象のローカル領域へ分離します。

## commit前チェック

push前に最低限、次を確認します。

1. `git status` で追加・変更ファイルを確認する
2. `git diff --staged` で実際にcommitする内容を確認する
3. 個人情報・秘密情報がないことを確認する
4. `.env`、資格情報、ローカル作業ファイルが含まれていないことを確認する
5. GitHub Pagesで公開されても問題ない内容だけであることを確認する

## 誤って秘密情報をcommitした場合

`.gitignore` に後から追加するだけでは解決しません。

- まず資格情報を無効化・ローテーションする
- Gitの追跡対象から外す
- 必要であればGit履歴から削除する
- その後 `.gitignore` と運用手順を修正する

## Pages上の内部データ

`vocabulary.json` 等は学習者UIに直接一覧表示しない内部データですが、
GitHub Pagesで配信する以上、ブラウザから取得可能です。

したがって、

> **UI非表示 = 秘密**

とは扱いません。

Pagesに含めるデータは、利用者に直接見せないものであっても、
公開されて問題のない情報だけにします。
