"""財務情報ルーター"""
from fastapi import APIRouter, HTTPException
from services.yfinance_service import get_financials

router = APIRouter(prefix="/api", tags=["financials"])


@router.get("/financials/{ticker}")
async def financials(ticker: str):
    """
    指定ティッカーの財務情報を返す。
    - annual: 年次財務データ（売上・利益・EBITDAなど）
    - quarterly: 四半期財務データ
    """
    try:
        data = get_financials(ticker.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
