# LiteNote

シンプルで高機能なノート管理アプリケーション

## 機能

- 🔐 Google OAuth認証
- 📝 ユーザー固有のノート管理
- 🔍 リアルタイム検索機能
- ⭐ お気に入り機能
- 📸 画像アップロード・管理
- 🚀 楽観的UI
- 📱 レスポンシブデザイン
- 🇯🇵 日本語対応

## セットアップ

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Database (Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Feature flag
NEXT_PUBLIC_HAS_GOOGLE_OAUTH=true
```

### 2. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. OAuth 2.0 クライアントIDを作成
3. 承認済みリダイレクトURIに以下を追加：
   - `http://localhost:3000/api/auth/callback/google` (開発用)
   - `https://your-domain.vercel.app/api/auth/callback/google` (本番用)

### 3. データベース設定

Vercel Postgresを使用します：

1. Vercelプロジェクトでストレージタブを開く
2. Postgresデータベースを作成
3. 環境変数が自動的に設定されます

### 4. 開発サーバー起動

```bash
npm install
npm run dev
```

### 5. デプロイ

```bash
npm run build
npm start
```

## 技術スタック

- **フレームワーク**: Next.js 14
- **認証**: NextAuth.js
- **データベース**: PostgreSQL (Vercel Postgres)
- **スタイリング**: CSS Modules + インラインスタイル
- **画像処理**: Sharp
- **アイコン**: Font Awesome
- **デプロイ**: Vercel

## 環境変数なしでの使用

本番環境で環境変数が設定されていない場合、適切なエラーメッセージが表示されます。開発環境では警告のみが表示され、アプリケーションは起動します。

## ライセンス

MIT