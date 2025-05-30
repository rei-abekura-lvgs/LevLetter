#!/bin/bash

# EC2での一括セットアップスクリプト
# Ubuntu 20.04 LTS用

set -e  # エラーで停止

echo "=== LevLetter EC2セットアップ開始 ==="

# システム更新
echo "システムを更新中..."
sudo apt update && sudo apt upgrade -y

# Node.js 18インストール
echo "Node.js 18をインストール中..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL インストール
echo "PostgreSQLをインストール中..."
sudo apt install postgresql postgresql-contrib -y

# PostgreSQL設定
echo "PostgreSQLを設定中..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# データベースとユーザー作成
echo "データベースを作成中..."
sudo -u postgres psql -c "CREATE DATABASE levletter;"
sudo -u postgres psql -c "CREATE USER levletter_user WITH PASSWORD 'secure_password_123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE levletter TO levletter_user;"
sudo -u postgres psql -c "ALTER USER levletter_user CREATEDB;"

# PM2インストール（プロセス管理）
echo "PM2をインストール中..."
sudo npm install -g pm2

# Nginxインストール（リバースプロキシ用）
echo "Nginxをインストール中..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

echo "=== 基本セットアップ完了 ==="
echo ""
echo "次の手順:"
echo "1. GitHubからコードをクローン"
echo "2. 環境変数を設定"
echo "3. アプリケーションを起動"
echo ""
echo "データベース接続URL:"
echo "postgresql://levletter_user:secure_password_123@localhost:5432/levletter"