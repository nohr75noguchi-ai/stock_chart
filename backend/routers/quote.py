"""現在の株価情報ルーター"""
from fastapi import APIRouter, HTTPException
from services.yfinance_service import get_quote

router = APIRouter(prefix="/api", tags=["quote"])


@router.get("/quote/{ticker}")
async def quote(ticker: str):
    """
    指定ティッカーの現在株価情報を返す。
    - current_price, prev_close, change, change_pct
    - open, day_high, day_low, volume
    - market_cap, pe_ratio, eps 等
    """
    try:
        data = get_quote(ticker.upper())
        if data.get("current_price") is None:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
