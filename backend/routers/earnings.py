"""決算情報ルーター"""
from fastapi import APIRouter, HTTPException
from services.yfinance_service import get_earnings

router = APIRouter(prefix="/api", tags=["earnings"])


@router.get("/earnings/{ticker}")
async def earnings(ticker: str):
    """
    指定ティッカーの決算情報を返す。
    - next_earnings_date: 次回決算日
    - history: 過去の EPS 実績（最大8件）
    """
    try:
        data = get_earnings(ticker.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
