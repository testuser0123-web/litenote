# LiteNote - Google認証付きノートアプリ

## 概要
Next.js + NextAuth + PostgreSQLを使用したユーザー認証付きノートアプリケーション

## 環境設定

### 1. 環境変数設定
`.env.local`ファイルを作成して以下を設定：

```bash
# NextAuth設定
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth設定
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# データベース設定（Vercel Postgres使用時）
POSTGRES_URL=postgresql://username:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NO_SSL=postgresql://username:password@host:port/database
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

### 2. Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（既存プロジェクトも可）
3. 「APIとサービス」→「認証情報」へ移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類：「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに以下を追加：
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `https://your-domain.com/api/auth/callback/google`
7. クライアントIDとクライアントシークレットを`.env.local`に設定

### 3. データベース設定（Vercel Postgres）

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトの「Storage」タブで「Create Database」
3. 「Postgres」を選択
4. データベース作成後、環境変数を自動的に設定

## 起動方法

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

## 機能

- **Google認証**: Googleアカウントでのログイン・ログアウト
- **ユーザー管理**: 自動的にユーザーテーブル作成・管理
- **ノート管理**: ユーザー固有のノート作成・編集・削除
- **セッション管理**: ログイン状態の永続化

## データベーススキーマ

### usersテーブル
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### notesテーブル
```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## トラブルシューティング

### エラー 401: invalid_client（OAuth client was not found）
このエラーが発生した場合：

1. **Google Cloud Consoleで設定確認**:
   - プロジェクトが正しく選択されているか
   - OAuth 2.0 クライアントIDが有効になっているか
   - 承認済みのリダイレクトURIが正確に設定されているか

2. **環境変数の確認**:
   ```bash
   # .env.localファイルの内容確認
   cat .env.local
   ```
   - GOOGLE_CLIENT_IDが正しいか（ダッシュとドットを含む長い文字列）
   - GOOGLE_CLIENT_SECRETが正しいか
   - スペースや改行が混入していないか

3. **OAuth同意画面の設定**:
   - Google Cloud Console → 「OAuth同意画面」
   - テストユーザーに自分のGoogleアカウントを追加
   - 公開状態を「テスト」に設定

4. **APIの有効化**:
   - 「ライブラリ」→「Google+ API」を検索して有効化
   - 「Google People API」も有効化

### ログインボタンが反応しない場合
1. 環境変数が正しく設定されているか確認
2. Google Cloud ConsoleでリダイレクトURIが正しく設定されているか確認
3. サーバーを再起動（`npm run dev`）
4. ブラウザのデベロッパーツールでコンソールエラーを確認

### データベース接続エラー
1. データベース環境変数が正しく設定されているか確認
2. データベースサーバーが起動しているか確認
3. ネットワーク接続を確認

### 開発時のデバッグ方法
```bash
# 環境変数の確認
echo $GOOGLE_CLIENT_ID
echo $NEXTAUTH_SECRET

# NextAuthのデバッグログを有効にする
# .env.localに追加
NEXTAUTH_DEBUG=true
```

### ノートの変更が反映されない場合
1. **セッション状態の確認**:
   - `http://localhost:3000/api/debug/session` にアクセス
   - `hasSession: true` および `hasUserId: true` であることを確認

2. **ブラウザのデベロッパーツールでコンソールを確認**:
   - ログイン後にAPI呼び出しエラーがないか確認
   - 401 Unauthorizedエラーが出ていないか確認

3. **サーバー側ログの確認**:
   - 開発サーバーのコンソールでセッション情報を確認
   - API呼び出し時のログを確認

4. **ログアウト・ログイン**:
   - 一度ログアウトして再度ログインしてみる
   - セッションが正しく確立されているか確認

## 開発時のコマンド

```bash
# リント実行
npm run lint

# ビルド
npm run build

# 本番サーバー起動
npm start
```