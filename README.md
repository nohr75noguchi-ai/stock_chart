# 株価チャートダッシュボード

Google Finance 風のリアルタイム株価チャート管理・一覧表示サイトです。

## 🌐 デモ
https://nohr75noguchi-ai.github.io/stock_chart/

## 🏗 アーキテクチャ
- **フロントエンド**: React (Vite) → GitHub Pages
- **バックエンド**: FastAPI + yfinance → Render.com
- **認証/DB**: Firebase Authentication + Firestore

## 🚀 ローカル開発

### バックエンド起動

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### フロントエンド起動

```bash
cd frontend
cp .env.example .env.local
# .env.local に Firebase 設定と API URL を記入
npm install
npm run dev
```

## 📦 デプロイ

### フロントエンド (GitHub Pages)
GitHub Secrets に以下を設定してから `main` ブランチへ push:
- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### バックエンド (Render.com)
1. Render.com で新規 Web Service を作成
2. GitHub リポジトリを接続（Root Directory: `backend`）
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 環境変数 `ALLOWED_ORIGIN` に GitHub Pages URL を設定

## 📊 機能
- **モード1**: 横4列グリッドで複数銘柄を一覧表示
- **モード2**: 個別銘柄の詳細チャート・テクニカル指標・比較機能
- **サイドバー**: ウォッチリストのスライドイン表示
- **リアルタイム**: 30秒ごとの自動価格更新
- **対応市場**: 日本株・米国株・韓国株・中国株・インデックス
