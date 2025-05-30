#!/bin/bash

# アプリケーションデプロイスクリプト
# EC2セットアップ後に実行

set -e

REPO_URL=""  # GitHubリポジトリURLを後で設定
APP_DIR="/home/ubuntu/levletter"

echo "=== LevLetterアプリケーションデプロイ ==="

# リポジトリURLの確認
if [ -z "$REPO_URL" ]; then
    echo "エラー: REPO_URLが設定されていません"
    echo "スクリプトを編集してGitHubリポジトリURLを設定してください"
    exit 1
fi

# 既存のディレクトリを削除（再デプロイの場合）
if [ -d "$APP_DIR" ]; then
    echo "既存のアプリケーションディレクトリを削除..."
    rm -rf "$APP_DIR"
fi

# GitHubからクローン
echo "GitHubからコードをクローン中..."
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# 環境変数ファイルの作成
echo "環境変数ファイルを作成中..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://levletter_user:secure_password_123@localhost:5432/levletter
SESSION_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=*
EOF

echo "環境変数が .env に設定されました"

# 依存関係のインストール
echo "依存関係をインストール中..."
npm ci

# アプリケーションのビルド
echo "アプリケーションをビルド中..."
npm run build

# データベーススキーマの作成/更新
echo "データベーススキーマを更新中..."
npm run db:push

# PM2でアプリケーション起動
echo "アプリケーションを起動中..."
pm2 delete levletter 2>/dev/null || true  # 既存プロセスがあれば削除
pm2 start npm --name "levletter" -- start
pm2 save
pm2 startup | tail -1 | bash || true

# Nginx設定
echo "Nginxを設定中..."
sudo tee /etc/nginx/sites-available/levletter > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/levletter /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== デプロイ完了! ==="
echo ""
echo "アプリケーション状態:"
pm2 status
echo ""
echo "アクセス方法:"
echo "http://$(curl -s ifconfig.me)"
echo ""
echo "ログ確認: pm2 logs levletter"
echo "再起動: pm2 restart levletter"