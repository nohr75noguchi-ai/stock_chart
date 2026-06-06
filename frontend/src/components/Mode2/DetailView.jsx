/**
 * モード2: 個別銘柄詳細表示
 * - 大型チャート（テクニカル指標・比較機能付き）
 * - 出来高バーチャート
 * - タブ: 概要 / 決算発表 / 財務情報
 */
import React, { useState } from 'react';
import useStore from '../../store/watchlistStore';
import { useQuote } from '../../hooks/useStockData';
import DetailChart from './DetailChart';
import OverviewTab from './OverviewTab';
import EarningsTab from './EarningsTab';
import FinancialsTab from './FinancialsTab';
import PriceChange from '../Common/PriceChange';
import PeriodSelector from '../Common/PeriodSelector';
import styles from './DetailView.module.css';

const TABS = [
  { id: 'overview',   label: '概要' },
  { id: 'earnings',   label: '決算発表' },
  { id: 'financials', label: '財務情報' },
];

const DetailView = () => {
  const { selectedTicker, showGrid, selectedPeriod } = useStore();
  const { data: quote } = useQuote(selectedTicker);
  const [activeTab, setActiveTab]             = useState('overview');
  const [chartType, setChartType]             = useState('area');   // 'area' | 'candlestick'
  const [compareList, setCompareList]         = useState([]);       // 比較銘柄
  const [compareInput, setCompareInput]       = useState('');
  const [indicators, setIndicators]           = useState({
    sma5: false, sma25: false, sma75: false, sma200: false,
    ema9: false, ema21: false,
    bollinger: false, rsi: false, macd: false,
  });

  const isUp = (quote?.change_pct ?? 0) >= 0;
  const currency = quote?.currency_symbol ?? '';
  const formatPrice = (p) =>
    p != null ? `${currency}${Number(p).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—';

  const handleIndicatorToggle = (key) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddCompare = () => {
    const sym = compareInput.trim().toUpperCase();
    if (sym && sym !== selectedTicker && !compareList.includes(sym)) {
      setCompareList((prev) => [...prev, sym]);
    }
    setCompareInput('');
  };

  return (
    <div className={styles.container}>
      {/* 戻るボタン */}
      <button className={styles.backBtn} onClick={showGrid} aria-label="グリッドに戻る">
        ← 一覧に戻る
      </button>

      {/* 銘柄ヘッダー */}
      <div className={styles.stockHeader}>
        <div className={styles.stockTitle}>
          <h1 className={styles.stockName}>{quote?.name ?? selectedTicker}</h1>
          <span className={styles.stockTicker}>{selectedTicker}</span>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.currentPrice}>{formatPrice(quote?.current_price)}</span>
          {quote && (
            <PriceChange
              change={quote.change}
              changePct={quote.change_pct}
              size="xl"
            />
          )}
          <span className={styles.priceLabel}>今日</span>
        </div>

        {quote && (
          <div className={styles.prevClose}>
            <span className={styles.prevCloseLabel}>前日終値</span>
            <span className={styles.prevCloseValue}>{formatPrice(quote.prev_close)}</span>
          </div>
        )}
      </div>

      {/* チャートコントロール */}
      <div className={styles.chartControls}>
        {/* チャートタイプ */}
        <div className={styles.controlGroup}>
          <button
            className={`${styles.controlBtn} ${chartType === 'area' ? styles.active : ''}`}
            onClick={() => setChartType('area')}
          >
            📈 エリア
          </button>
          <button
            className={`${styles.controlBtn} ${chartType === 'candlestick' ? styles.active : ''}`}
            onClick={() => setChartType('candlestick')}
          >
            🕯 ローソク
          </button>
        </div>

        {/* 比較機能 */}
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>比較</span>
          <div className={styles.compareInputWrapper}>
            <input
              type="text"
              className={styles.compareInput}
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCompare()}
              placeholder="銘柄追加..."
            />
            <button className={styles.addCompareBtn} onClick={handleAddCompare}>+</button>
          </div>
          {compareList.map((sym) => (
            <span key={sym} className={styles.compareTag}>
              {sym}
              <button onClick={() => setCompareList((p) => p.filter((s) => s !== sym))}>✕</button>
            </span>
          ))}
        </div>

        {/* テクニカル指標 */}
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>指標</span>
          {[
            { key: 'sma25',    label: 'SMA25' },
            { key: 'sma75',    label: 'SMA75' },
            { key: 'sma200',   label: 'SMA200' },
            { key: 'ema9',     label: 'EMA9' },
            { key: 'ema21',    label: 'EMA21' },
            { key: 'bollinger',label: 'BB' },
            { key: 'rsi',      label: 'RSI' },
            { key: 'macd',     label: 'MACD' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.indicatorBtn} ${indicators[key] ? styles.indicatorActive : ''}`}
              onClick={() => handleIndicatorToggle(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* メインチャート */}
      <div className={styles.chartSection}>
        <DetailChart
          ticker={selectedTicker}
          period={selectedPeriod}
          chartType={chartType}
          indicators={indicators}
          compareList={compareList}
          prevClose={quote?.prev_close}
          isUp={isUp}
        />
      </div>

      {/* 期間セレクター */}
      <PeriodSelector />

      {/* タブ */}
      <div className={styles.tabs}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
            id={`tab-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className={styles.tabContent}>
        {activeTab === 'overview'   && <OverviewTab quote={quote} ticker={selectedTicker} />}
        {activeTab === 'earnings'   && <EarningsTab ticker={selectedTicker} />}
        {activeTab === 'financials' && <FinancialsTab ticker={selectedTicker} />}
      </div>
    </div>
  );
};

export default DetailView;
