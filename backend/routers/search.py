"""銘柄検索ルーター"""
from fastapi import APIRouter, HTTPException, Query
from services.yfinance_service import search_symbols

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
async def search(
    q: str = Query(..., description="検索クエリ（銘柄コードまたは企業名）"),
    limit: int = Query(default=10, ge=1, le=50, description="最大結果件数"),
):
    """
    銘柄を検索する。
    - q: 検索クエリ（ティッカー / 企業名）
    - limit: 返却件数（最大50）
    """
    try:
        results = search_symbols(q, limit=limit)
        return {"query": q, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
