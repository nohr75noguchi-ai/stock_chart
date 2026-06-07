"""
株価チャートサービス - yfinance ラッパー
"""
import yfinance as yf
from cachetools import TTLCache, cached
import threading
from datetime import datetime, timezone
from typing import Optional

# キャッシュ設定（TTL: 30秒、最大200エントリ）
_quote_cache = TTLCache(maxsize=200, ttl=30)
_history_cache = TTLCache(maxsize=200, ttl=60)
_info_cache = TTLCache(maxsize=200, ttl=300)
_cache_lock = threading.Lock()

# 期間 → yfinance パラメータマッピング
PERIOD_MAP = {
    "1d":  {"period": "1d",  "interval": "5m"},
    "5d":  {"period": "5d",  "interval": "15m"},
    "7d":  {"period": "7d",  "interval": "30m"},
    "14d": {"period": "14d", "interval": "1h"},
    "1mo": {"period": "1mo", "interval": "1d"},
    "3mo": {"period": "3mo", "interval": "1d"},
    "6mo": {"period": "6mo", "interval": "1d"},
    "1y":  {"period": "1y",  "interval": "1d"},
    "5y":  {"period": "5y",  "interval": "1wk"},
    "max": {"period": "max", "interval": "1mo"},
}

# 通貨コード → 記号マッピング
CURRENCY_SYMBOLS = {
    "JPY": "¥",
    "USD": "$",
    "KRW": "₩",
    "EUR": "€",
    "GBP": "£",
    "HKD": "HK$",
    "CNY": "¥",
}

# 国フラグ絵文字マッピング（通貨→国旗）
CURRENCY_TO_FLAG = {
    "JPY": "🇯🇵",
    "USD": "🇺🇸",
    "KRW": "🇰🇷",
    "EUR": "🇪🇺",
    "GBP": "🇬🇧",
    "HKD": "🇭🇰",
    "CNY": "🇨🇳",
}


def _get_ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(symbol)


def get_quote(symbol: str) -> dict:
    """現在の株価情報を取得する"""
    cache_key = f"quote_{symbol}"
    with _cache_lock:
        if cache_key in _quote_cache:
            return _quote_cache[cache_key]

    ticker = _get_ticker(symbol)
    info = ticker.info

    currency = info.get("currency", "USD")
    currency_symbol = CURRENCY_SYMBOLS.get(currency, "")
    flag = CURRENCY_TO_FLAG.get(currency, "🌐")

    current_price = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("navPrice")
    )
    prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")

    change = None
    change_pct = None
    if current_price is not None and prev_close:
        change = round(current_price - prev_close, 4)
        change_pct = round((change / prev_close) * 100, 2)

    result = {
        "symbol": symbol,
        "name": info.get("shortName") or info.get("longName") or symbol,
        "currency": currency,
        "currency_symbol": currency_symbol,
        "flag": flag,
        "current_price": current_price,
        "prev_close": prev_close,
        "change": change,
        "change_pct": change_pct,
        "open": info.get("open"),
        "day_high": info.get("dayHigh"),
        "day_low": info.get("dayLow"),
        "volume": info.get("volume"),
        "avg_volume": info.get("averageVolume"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "eps": info.get("trailingEps"),
        "week_52_high": info.get("fiftyTwoWeekHigh"),
        "week_52_low": info.get("fiftyTwoWeekLow"),
        "dividend_yield": info.get("dividendYield"),
        "shares_outstanding": info.get("sharesOutstanding"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    with _cache_lock:
        _quote_cache[cache_key] = result

    return result


def get_history(symbol: str, period: str = "1d", interval: str = "5m", start: Optional[str] = None, end: Optional[str] = None) -> list:
    """株価履歴データを取得する"""
    cache_key = f"history_{symbol}_{period}_{interval}_{start}_{end}"
    with _cache_lock:
        if cache_key in _history_cache:
            return _history_cache[cache_key]

    ticker = _get_ticker(symbol)

    if start and end:
        df = ticker.history(start=start, end=end, interval=interval)
    else:
        params = PERIOD_MAP.get(period, {"period": period, "interval": interval})
        df = ticker.history(period=params["period"], interval=params["interval"])

    if df.empty:
        return []

    # タイムゾーン情報を含む ISO 形式に変換
    df.index = df.index.tz_convert("UTC") if df.index.tz else df.index.tz_localize("UTC")

    result = [
        {
            "timestamp": idx.isoformat(),
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        }
        for idx, row in df.iterrows()
        if not (row["Close"] != row["Close"])  # NaN チェック
    ]

    with _cache_lock:
        _history_cache[cache_key] = result

    return result


def search_symbols(query: str, limit: int = 10) -> list:
    """銘柄を検索する（yfinance の Search 機能を使用）"""
    try:
        search_obj = yf.Search(query, max_results=limit)
        results = search_obj.quotes
        if not results:
            return []

        items = []
        for q in results[:limit]:
            symbol = q.get("symbol", "")
            name = q.get("longname") or q.get("shortname") or symbol
            exchange = q.get("exchange", "")
            quote_type = q.get("quoteType", "")

            items.append({
                "symbol": symbol,
                "name": name,
                "exchange": exchange,
                "type": quote_type,
            })
        return items
    except Exception as e:
        print(f"Search error: {e}")
        return []


def get_earnings(symbol: str) -> dict:
    """決算情報を取得する"""
    cache_key = f"earnings_{symbol}"
    with _cache_lock:
        if cache_key in _info_cache:
            return _info_cache[cache_key]

    ticker = _get_ticker(symbol)
    info = ticker.info

    # 次回決算日
    earnings_date = info.get("earningsTimestamp")
    next_earnings = None
    if earnings_date:
        next_earnings = datetime.fromtimestamp(earnings_date, tz=timezone.utc).isoformat()

    # 過去の EPS データ
    history_list = []
    try:
        earnings_hist = ticker.earnings_history
        if earnings_hist is not None and not earnings_hist.empty:
            for idx, row in earnings_hist.iterrows():
                history_list.append({
                    "date": str(idx),
                    "eps_estimate": row.get("epsEstimate"),
                    "eps_actual": row.get("epsActual"),
                    "surprise_pct": row.get("surprisePercent"),
                })
    except Exception:
        pass

    result = {
        "symbol": symbol,
        "next_earnings_date": next_earnings,
        "history": history_list[:8],  # 直近8件
    }

    with _cache_lock:
        _info_cache[cache_key] = result

    return result


def get_financials(symbol: str) -> dict:
    """財務情報を取得する"""
    cache_key = f"financials_{symbol}"
    with _cache_lock:
        if cache_key in _info_cache:
            return _info_cache[cache_key]

    ticker = _get_ticker(symbol)

    def df_to_list(df):
        if df is None or df.empty:
            return []
        rows = []
        for col in df.columns:
            row = {"period": str(col.date() if hasattr(col, "date") else col)}
            for idx in df.index:
                val = df.at[idx, col]
                row[str(idx)] = None if (val != val) else (int(val) if isinstance(val, float) and val.is_integer() else float(val))
            rows.append(row)
        return rows

    annual = df_to_list(ticker.financials)
    quarterly = df_to_list(ticker.quarterly_financials)

    result = {
        "symbol": symbol,
        "annual": annual,
        "quarterly": quarterly,
    }

    with _cache_lock:
        _info_cache[cache_key] = result

    return result


def get_company_info(symbol: str) -> dict:
    """企業概要情報を取得する"""
    cache_key = f"info_{symbol}"
    with _cache_lock:
        if cache_key in _info_cache:
            return _info_cache[cache_key]

    ticker = _get_ticker(symbol)
    info = ticker.info

    result = {
        "symbol": symbol,
        "name": info.get("shortName") or info.get("longName") or symbol,
        "description": info.get("longBusinessSummary"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "employees": info.get("fullTimeEmployees"),
        "website": info.get("website"),
        "country": info.get("country"),
        "dividend_rate": info.get("dividendRate"),
        "dividend_yield": info.get("dividendYield"),
        "ex_dividend_date": info.get("exDividendDate"),
        "payout_ratio": info.get("payoutRatio"),
        "beta": info.get("beta"),
        "forward_pe": info.get("forwardPE"),
        "price_to_book": info.get("priceToBook"),
    }

    with _cache_lock:
        _info_cache[cache_key] = result

    return result
