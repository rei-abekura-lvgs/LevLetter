#!/bin/bash

# 本番環境でのアプリケーション起動スクリプト

# 必要な環境変数をチェック
if [ -z "$DATABASE_URL" ]; then
    echo "エラー: DATABASE_URLが設定されていません"
    exit 1
fi

echo "=== LevLetter 本番環境起動 ==="

# 依存関係をインストール
echo "依存関係をインストール中..."
npm ci --only=production

# アプリケーションをビルド
echo "アプリケーションをビルド中..."
npm run build

# データベースのマイグレーション実行
echo "データベーススキーマを更新中..."
npm run db:push

# アプリケーション起動
echo "アプリケーションを起動中..."
echo "PORT: ${PORT:-5000}"
echo "NODE_ENV: ${NODE_ENV:-production}"

npm start