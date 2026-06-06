/**
 * FastAPI バックエンドへの API クライアント
 * 環境変数 VITE_API_BASE_URL でバックエンド URL を指定
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'API Error';
    return Promise.reject(new Error(message));
  }
);

// =========================================================
// 株価引用（リアルタイム）
// =========================================================
export const fetchQuote = (ticker) =>
  apiClient.get(`/api/quote/${encodeURIComponent(ticker)}`);

// =========================================================
// 履歴データ
// =========================================================
export const fetchHistory = (ticker, period = '1d', interval = null, start = null, end = null) => {
  const params = { period };
  if (interval) params.interval = interval;
  if (start)    params.start = start;
  if (end)      params.end = end;
  return apiClient.get(`/api/history/${encodeURIComponent(ticker)}`, { params });
};

// =========================================================
// 銘柄検索
// =========================================================
export const searchSymbols = (query, limit = 10) =>
  apiClient.get('/api/search', { params: { q: query, limit } });

// =========================================================
// 決算情報
// =========================================================
export const fetchEarnings = (ticker) =>
  apiClient.get(`/api/earnings/${encodeURIComponent(ticker)}`);

// =========================================================
// 財務情報
// =========================================================
export const fetchFinancials = (ticker) =>
  apiClient.get(`/api/financials/${encodeURIComponent(ticker)}`);

// =========================================================
// 企業概要
// =========================================================
export const fetchInfo = (ticker) =>
  apiClient.get(`/api/info/${encodeURIComponent(ticker)}`);

// =========================================================
// 複数銘柄一括取得（Promise.allSettled で失敗分を除外）
// =========================================================
export const fetchMultipleQuotes = async (tickers) => {
  const results = await Promise.allSettled(tickers.map(fetchQuote));
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
};

export default apiClient;
