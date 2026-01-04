# 監視カメラ管理アプリ

YouTube監視カメラ動画から情報を取得・管理するアプリケーション

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: Supabase
- **認証**: Better Auth（今後実装予定）
- **ストレージ**: Cloudflare R2
- **決済**: Polar（今後実装予定）

## 機能

- YouTube動画の登録と管理
- 動画からのフレーム抽出（5秒間隔）
- 動体検知機能
- 抽出したフレームのCloudflare R2への保存
- 解析結果のデータベース保存

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. FFmpegのインストール

動画処理にはFFmpegが必要です。以下のコマンドでインストールしてください：

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
[FFmpeg公式サイト](https://ffmpeg.org/download.html)からダウンロードしてインストールしてください。

### 3. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで`lib/supabase/schema.sql`の内容を実行してテーブルを作成

### 4. Cloudflare R2のセットアップ

1. [Cloudflare R2](https://developers.cloudflare.com/r2/)でバケットを作成
2. APIトークンを作成してアクセスキーを取得

### 5. 環境変数の設定

`.env.local`ファイルを作成し、環境変数を設定してください：

```bash
# env.exampleをコピーして.env.localを作成
cp env.example .env.local
```

その後、`.env.local`ファイルを開いて、実際の認証情報に置き換えてください。

**必要な環境変数：**
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー
- `CLOUDFLARE_R2_ACCOUNT_ID`: Cloudflare R2アカウントID
- `CLOUDFLARE_R2_ACCESS_KEY_ID`: Cloudflare R2アクセスキーID
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: Cloudflare R2シークレットアクセスキー
- `CLOUDFLARE_R2_BUCKET_NAME`: Cloudflare R2バケット名
- `CLOUDFLARE_R2_ENDPOINT`: Cloudflare R2エンドポイントURL

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## 使用方法

1. ダッシュボードでYouTube動画のURLを入力して登録
2. 登録された動画の「動画を処理」ボタンをクリック
3. 動画からフレームが抽出され、動体検知が実行されます
4. 結果はCloudflare R2に保存され、データベースに記録されます

## 注意事項

- YouTube動画の利用は、YouTubeの利用規約に準拠してください
- 動画処理には時間がかかる場合があります
- 大量の動画を処理する場合は、適切なリソース管理が必要です
