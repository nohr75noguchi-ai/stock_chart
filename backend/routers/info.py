"""企業情報ルーター"""
from fastapi import APIRouter, HTTPException
from services.yfinance_service import get_company_info

router = APIRouter(prefix="/api", tags=["info"])


@router.get("/info/{ticker}")
async def company_info(ticker: str):
    """
    指定ティッカーの企業概要情報を返す。
    - name, description, sector, industry
    - employees, website, country
    - dividend info, beta, forward_pe, price_to_book
    """
    try:
        data = get_company_info(ticker.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
