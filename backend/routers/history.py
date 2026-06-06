"""株価履歴ルーター"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.yfinance_service import get_history, PERIOD_MAP

router = APIRouter(prefix="/api", tags=["history"])

VALID_PERIODS = list(PERIOD_MAP.keys())
VALID_INTERVALS = ["1m", "2m", "5m", "15m", "30m", "60m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]


@router.get("/history/{ticker}")
async def history(
    ticker: str,
    period: str = Query(default="1d", description="取得期間"),
    interval: Optional[str] = Query(default=None, description="インターバル（省略時は period に応じて自動選択）"),
    start: Optional[str] = Query(default=None, description="開始日 (YYYY-MM-DD)"),
    end: Optional[str] = Query(default=None, description="終了日 (YYYY-MM-DD)"),
):
    """
    指定ティッカーの株価履歴 OHLCV データを返す。
    - period: 1d / 5d / 7d / 14d / 1mo / 3mo / 6mo / 1y / 5y / max
    - interval: 5m / 15m / 30m / 1h / 1d / 1wk / 1mo
    - start / end: 任意期間指定（YYYY-MM-DD 形式）
    """
    try:
        if interval is None:
            params = PERIOD_MAP.get(period, {"period": period, "interval": "1d"})
            interval = params["interval"]

        data = get_history(ticker.upper(), period=period, interval=interval, start=start, end=end)
        return {"symbol": ticker.upper(), "period": period, "interval": interval, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
