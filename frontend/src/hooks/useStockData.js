/**
 * 株価データ取得フック
 * 30秒ごとに自動更新し、指定ティッカーの最新データを返す
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuote, fetchHistory } from '../services/api';

const REFRESH_INTERVAL = 30_000; // 30秒

/**
 * 現在の株価を30秒ごとに取得する
 */
export const useQuote = (ticker) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!ticker) return;
    try {
      const result = await fetchQuote(ticker);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const timer = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * 複数銘柄の株価を一括取得する（グリッド用）
 */
export const useMultipleQuotes = (tickers) => {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (!tickers || tickers.length === 0) {
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled(tickers.map(fetchQuote));
    const newQuotes = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        newQuotes[tickers[index]] = result.value;
      }
    });
    setQuotes((prev) => ({ ...prev, ...newQuotes }));
    setLoading(false);
  }, [tickers.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  return { quotes, loading };
};

/**
 * 株価履歴を取得する（チャート用）
 */
export const useHistory = (ticker, period = '1d', interval = null, start = null, end = null) => {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    try {
      const result = await fetchHistory(ticker, period, interval, start, end);
      setData(result.data || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticker, period, interval, start, end]);

  useEffect(() => {
    fetchData();
    // 履歴データは30秒ごとに更新（当日のみ）
    if (period === '1d') {
      const timer = setInterval(fetchData, REFRESH_INTERVAL);
      return () => clearInterval(timer);
    }
  }, [fetchData, period]);

  return { data, loading, error, refetch: fetchData };
};
