"""
株価チャートサービス - FastAPI メインアプリケーション
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import quote, history, search, earnings, financials, info

load_dotenv()

# 許可するオリジン一覧
ALLOWED_ORIGINS = [
    # GitHub Pages（デプロイ後に実際の URL に変更）
    "https://nohr75noguchi-ai.github.io",
    # ローカル開発
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# 追加のオリーン（環境変数で設定可能）
extra_origin = os.getenv("ALLOWED_ORIGIN")
if extra_origin:
    ALLOWED_ORIGINS.append(extra_origin)

app = FastAPI(
    title="Stock Chart API",
    description="yfinance を使ったリアルタイム株価データ API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(quote.router)
app.include_router(history.router)
app.include_router(search.router)
app.include_router(earnings.router)
app.include_router(financials.router)
app.include_router(info.router)


@app.get("/health", tags=["system"])
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "service": "stock-chart-api"}


@app.get("/", tags=["system"])
async def root():
    """API ルート"""
    return {
        "message": "Stock Chart API",
        "docs": "/docs",
        "endpoints": [
            "/api/quote/{ticker}",
            "/api/history/{ticker}",
            "/api/search?q={query}",
            "/api/earnings/{ticker}",
            "/api/financials/{ticker}",
            "/api/info/{ticker}",
        ],
    }
