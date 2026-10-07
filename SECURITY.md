# セキュリティ対策と検証

このリポジトリは2014年の講座を公開する静的サイトです。バックエンド、認証処理、投稿APIは含まれていません。

## 表示処理

- 提出レポートの全フィールドは `textContent` で表示します。参照URLも文字として扱い、HTML、テンプレート、JavaScriptとして解釈しません。これは [OWASPのDOM XSS対策](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html) に沿った実装です。
- スクリーンショットには区切り文字や制御文字を含まないPNGのファイル名だけを許可し、名前全体をURLエンコードします。不正な名前と取得できない画像は代替画像になります。
- Dojo、AngularJS、外部Slidy、旧Google Analyticsの読み込みを、講座の全33ページから除きました。一覧、カード、統計表の並べ替え、スライド操作はローカルのJavaScriptで動作します。アクセス解析は送信されません。
- Bootstrapは既存のローカルCSSとフォントだけを使用します。JavaScriptは読み込みません。
- 全33ページにCSPを設定し、外部スクリプト、インラインスクリプト、eval、フレーム、プラグイン、フォーム送信、base要素を禁止します。既存のレイアウトのためインラインCSSは許可しています。ライセンス画像に限り `https://i.creativecommons.org` を画像の取得先として許可し、Referrerは送信しません。
- JSON、CSV、教材PDF、キャプション、画像とレポート本文は元データを保持しています。統計表はCSVの値をHTMLエスケープして埋め込みます。

## ローカルでの確認

リポジトリのルートで実行します。JSONとES modulesを使うため、HTMLファイルの直接起動ではなくHTTPサーバーで確認してください。

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

別のターミナルで実行します。

```sh
python3 tests/security_static.py
node tests/browser.cjs http://127.0.0.1:8765
```

ブラウザーテストには、テスト環境に用意したPlaywrightとChromiumが必要です。サイト本体の実行にnpmやPythonは不要です。今回の確認環境はPlaywright 1.62.1 / Chromiumです。静的検査3件とブラウザー検査8件で次を確認しています。

- 33ページの読み込み、ローカル資産の参照、CSP違反とJavaScript例外の有無。
- 5,035件の一覧表示、詳細、検索、リセット、数値の並べ替え、25/50/100件のページ分割。
- 31件のカード、3つの統計表、770枚のスライドのブックマーク・キー操作・全件表示・印刷。
- CSPを無効にした場合にも、悪意あるレポートのHTMLやイベント属性を実行しないこと。
- 画像のパストラバーサル、外部URL、予約文字、壊れたJSON、取得エラーに対する処理。
- 実ブラウザーでのCSPによるスクリプト実行制限。

CSVを更新した場合は、統計表を再生成して検査します。

```sh
python3 scripts/render_statistics.py
python3 tests/security_static.py
```

## 公開するファイル

過去のライブラリとそのデモ、テスト、Gitメタデータは保存していますが、サイトの実行には不要です。リポジトリ全体をそのまま公開せず、次のコマンドで出力したディレクトリを公開対象にしてください。指定先は新しいディレクトリである必要があります。

```sh
python3 scripts/build_site.py ../jmooc14-openedu-public
```

出力には教材と必要な実行ファイルだけが含まれます。`lib/Dojo-Bootstrap`、BootstrapのJavaScript、旧jQuery、開発用テスト、`.git` は含みません。既存の公開先やデプロイ設定は変更していません。

## ホスティング側で確認すること

この変更はローカルのソースとブラウザー動作を対象としています。公開サーバーのTLS、レスポンスヘッダー、アクセス権限は未検証です。HTTPSを使用し、HTMLと同じCSPをHTTPレスポンスヘッダーでも設定してください。別サイトからの埋め込みを禁止する場合は、ヘッダー側に `frame-ancestors 'none'` を追加できます。このディレクティブはmeta要素では動作しません。[MDNの説明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)

必要に応じて `X-Content-Type-Options: nosniff` と `Referrer-Policy: no-referrer` も設定し、`.js` を正しいJavaScriptのContent-Typeで配信してください。外部リンク先の現在の内容・安全性はこの検証の対象外です。講座本文や参照URLは2014年当時の記録として保持しています。
