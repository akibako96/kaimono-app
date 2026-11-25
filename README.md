# 買い物リスト

カレンダーの日付ごとに、商品を登録・編集し、購入済みを記録するWebアプリです。Vite、React、TypeScript、Tailwind CSSで構成されています。カテゴリ、商品マスター、日別のリストと購入履歴は、ブラウザーの `localStorage` に保存します。

## 開発と検証

Node.js 22.16以降を使用します。修正は `main` から作った作業ブランチで行い、PRでレビューします。

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run test:build
npm run preview
```

オフライン起動はビルド後のプレビューで確認できます。`npm run preview` が表示する `/kaimono-app/` のURLを使います。初回はオンラインで開いてService Workerの準備を待ち、再読み込みしてからオフラインに切り替えます。リストの閲覧、追加、編集と再読み込みを試してください。更新版が待機中のときは、同じURLのブラウザータブとホーム画面のアプリをすべて閉じ、開き直します。Service Workerはビルド資材だけをキャッシュし、更新の有効化時に旧版のキャッシュを削除します。

## GitHub Pagesで公開する

公開予定URLは `https://akibako96.github.io/kaimono-app/` です。Viteの配信ベースは `/kaimono-app/` で、ManifestとService Workerも同じパスで動作します。アプリ内の画面切り替えはこのURL内で完結します。

1. リポジトリの **Settings → Pages → Build and deployment → Source** に **GitHub Actions** を指定します。
2. 初回は **Actions → Test and deploy GitHub Pages** で `main` を選び、**Run workflow** を押します。以後は `main` の更新で公開します。
3. PRでは型チェック・テスト・ビルドと、公開パスの検証が実行されます。Pagesへの配信は `main` の実行で行われます。

ブラウザーの保存領域はURLのオリジンごとに分かれます。旧AI Studio版からGitHub Pagesへは、下記のJSON手順でデータをコピーします。同じ `github.io` オリジンのページ間では保存領域を共有するため、同じ保存キーの別インスタンスの試用には別のブラウザープロファイルを使ってください。

- [GitHub Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## iPhoneに追加してデータを復元する

1. 旧AI Studio版を、データが保存されている端末とブラウザーで開きます。**データをバックアップ** を押し、JSONを保存します。iPhoneではダウンロード先の「ファイル」アプリ、または共有メニューの「ファイルに保存」を利用できます。
2. iPhoneのSafariで新しいGitHub Pages本番URLを開き、共有メニューから **ホーム画面に追加** を選びます。**Webアプリとして開く** が表示される場合はオンにします。AndroidではChromeのメニューからインストールします。
3. 実際に使う場所（ホーム画面のアイコン、またはブラウザー）から新アプリを起動します。同じURLの別タブを閉じ、**バックアップから復元** でJSONを選びます。作成日時、カテゴリ・商品・日別リスト・購入済みの件数、保存キーごとの追加・上書き対象を確認します。
4. 新アプリにデータがある場合は **復元前のデータを保存** で別のJSONを残します。**確認した内容で復元する** を押し、完了後にカテゴリ、商品マスター、過去の日付のリスト、購入チェックを確認します。照合が済むまで旧版とバックアップを手元に残します。

復元処理は端末内で完結します。対応形式は公開版の `backupFormatVersion` / `rawLocalStorage`、および `backupVersion` / `rawStorage` です。元の文字列がある場合はそのまま保存し、プリセットなど元の保存値がない項目は、JSON内のデータから復元します。バックアップに含まれないキーはそのままです。ブラウザーの空き容量により復元できるデータ量は変わります。書き込みエラー時は変更したキーを元に戻し、ブラウザーが巻き戻しも拒否した場合は、エラー画面から復元前のJSONを保存できます。

## 将来のCapacitor対応

Capacitorを導入するときは、`npm run build -- --base=/` でルート配信用にビルドし、`dist` を `webDir` に指定して、ReactのUI、`src/services/storage.ts` のデータ操作、JSONの検証・復元を再利用できます。ネイティブ配布ではビルド資材をアプリ本体に同梱するため、Service Workerの登録をWeb配布に限定し、必要に応じてネイティブのファイル選択と共有を追加します。Web版とネイティブ版の保存領域は別なので、移行にはJSONを使います。
