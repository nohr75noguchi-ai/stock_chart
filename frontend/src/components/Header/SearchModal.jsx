/**
 * 銘柄検索モーダル
 * debounce 300ms でリアルタイム検索し、結果を選択すると
 * ウォッチリストに追加してモーダルを閉じる
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../../store/watchlistStore';
import { searchSymbols } from '../../services/api';
import styles from './SearchModal.module.css';

const DEBOUNCE_MS = 300;

const SearchModal = () => {
  const { closeSearchModal, addTicker, watchlist } = useStore();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  // モーダルを開いたら検索ボックスにフォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ESC キーで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') closeSearchModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeSearchModal]);

  // debounce 検索
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await searchSymbols(q.trim(), 12);
      setResults(res.results || []);
    } catch {
      setError('検索に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
  };

  const handleSelect = (item) => {
    const alreadyIn = watchlist.some((w) => w.ticker === item.symbol);
    if (!alreadyIn) {
      addTicker({
        ticker:  item.symbol,
        name:    item.name,
        country: item.exchange || 'US',
      });
    }
    closeSearchModal();
  };

  // 既存銘柄かどうか判定
  const isAdded = (symbol) => watchlist.some((w) => w.ticker === symbol);

  return (
    <div className={styles.overlay} onClick={closeSearchModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="銘柄検索">
        {/* 検索入力 */}
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={query}
            onChange={handleChange}
            placeholder="ティッカーまたは企業名を入力（例: AAPL, 7011.T, ^N225）"
            id="search-modal-input"
            autoComplete="off"
          />
          {loading && <span className="spinner" />}
        </div>

        {/* 区切り線 */}
        <div className={styles.divider} />

        {/* 検索結果 */}
        <div className={styles.results}>
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && results.length === 0 && query && (
            <p className={styles.noResult}>「{query}」に一致する銘柄が見つかりません</p>
          )}

          {!loading && results.length === 0 && !query && (
            <div className={styles.hint}>
              <p>銘柄コードまたは企業名を入力してください</p>
              <div className={styles.examples}>
                {['AAPL', 'MSFT', '^N225', '7011.T', 'TSLA'].map((ex) => (
                  <button
                    key={ex}
                    className={styles.exampleBtn}
                    onClick={() => {
                      setQuery(ex);
                      doSearch(ex);
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((item) => {
            const added = isAdded(item.symbol);
            return (
              <button
                key={item.symbol}
                className={`${styles.resultItem} ${added ? styles.added : ''}`}
                onClick={() => !added && handleSelect(item)}
                disabled={added}
              >
                <div className={styles.resultLeft}>
                  <span className={styles.symbol}>{item.symbol}</span>
                  <span className={styles.name}>{item.name}</span>
                </div>
                <div className={styles.resultRight}>
                  <span className={styles.exchange}>{item.exchange}</span>
                  {added && <span className={styles.addedBadge}>追加済み</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span>ESC で閉じる</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
