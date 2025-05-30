# AWS EC2デプロイメントガイド

## 前提条件
- AWS EC2インスタンス（Ubuntu 20.04 LTS推奨）
- Node.js 18以上
- PostgreSQL（RDSまたはEC2上）
- Git

## セットアップ手順

### 1. EC2インスタンスの準備
```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# Node.js 18のインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Gitのインストール
sudo apt install git -y

# PM2（プロセス管理）のインストール
sudo npm install -g pm2
```

### 2. アプリケーションのデプロイ
```bash
# リポジトリのクローン
git clone <your-repository-url>
cd <repository-name>

# 環境変数の設定
cp .env.production .env
# .envファイルを編集して実際の値を設定

# 依存関係のインストールとビルド
npm ci
npm run build

# データベーススキーマの作成
npm run db:push

# PM2でアプリケーション起動
pm2 start npm --name "levletter" -- start
pm2 save
pm2 startup
```

### 3. 必要な環境変数
```
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secure-session-secret
COGNITO_DOMAIN=your-cognito-domain
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_REDIRECT_URI=https://your-domain.com/auth/callback
PORT=5000
NODE_ENV=production
```

### 4. セキュリティグループ設定
- インバウンドルール: HTTP (80), HTTPS (443), SSH (22)
- アプリケーションポート (5000) ※ロードバランサー使用時は不要

### 5. 確認コマンド
```bash
# アプリケーション状態確認
pm2 status

# ログ確認
pm2 logs levletter

# サービス再起動
pm2 restart levletter
```