/**
 * 株価カード（モード1グリッド用）
 * - エリアチャート（Chart.js）
 * - カーソルホバーで点線縦線 + 日時 + 価格表示
 * - 丸形チェックボックスで表示/非表示
 * - ヘッダードラッグ&ドロップ
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Chart from 'chart.js/auto';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHistory } from '../../hooks/useStockData';
import useStore from '../../store/watchlistStore';
import PriceChange from '../Common/PriceChange';
import styles from './StockCard.module.css';

// 国旗絵文字マッピング
const FLAG_MAP = {
  JP: '🇯🇵', US: '🇺🇸', KR: '🇰🇷',
  HK: '🇭🇰', CN: '🇨🇳', EU: '🇪🇺', GB: '🇬🇧',
};

const StockCard = ({ item, quote, period }) => {
  const { toggleVisibility, showDetail } = useStore();
  const canvasRef   = useRef(null);
  const chartRef    = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null); // { price, date }

  const { data: historyData, loading } = useHistory(
    item.ticker, period
  );

  const isUp = (quote?.change_pct ?? 0) >= 0;
  const lineColor = isUp
    ? getComputedStyle(document.documentElement).getPropertyValue('--chart-up-line').trim()
    : getComputedStyle(document.documentElement).getPropertyValue('--chart-down-line').trim();
  const fillColor = isUp
    ? getComputedStyle(document.documentElement).getPropertyValue('--chart-up-fill').trim()
    : getComputedStyle(document.documentElement).getPropertyValue('--chart-down-fill').trim();

  const buildChart = useCallback(() => {
    if (!canvasRef.current || historyData.length === 0) return;

    const labels = historyData.map((d) => d.timestamp);
    const closes = historyData.map((d) => d.close);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: closes,
          borderColor: lineColor,
          borderWidth: 2,
          fill: true,
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return fillColor;
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, fillColor.replace('0.12', '0.3'));
            gradient.addColorStop(1, fillColor.replace('0.12', '0'));
            return gradient;
          },
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeInOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: ({ tooltip }) => {
              if (tooltip.opacity === 0) {
                setHoverInfo(null);
                return;
              }
              const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
              if (dataIndex !== undefined) {
                const ts = historyData[dataIndex]?.timestamp;
                const price = closes[dataIndex];
                const date = ts
                  ? new Intl.DateTimeFormat('ja-JP', {
                      month: 'numeric', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }).format(new Date(ts))
                  : '';
                setHoverInfo({ price, date });
              }
            },
          },
        },
        scales: {
          x: {
            display: false,
            grid: { display: false },
          },
          y: {
            display: false,
            grid: { display: false },
          },
        },
      },
      plugins: [{
        id: 'crosshairLine',
        afterDraw(chart) {
          if (chart.tooltip._active && chart.tooltip._active.length) {
            const { ctx, chartArea } = chart;
            const x = chart.tooltip._active[0].element.x;
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.stroke();
            ctx.restore();
          }
        },
      }],
    });
  }, [historyData, lineColor, fillColor]);

  useEffect(() => {
    buildChart();
    return () => chartRef.current?.destroy();
  }, [buildChart]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.ticker });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex:  isDragging ? 999 : 'auto',
  };

  const flag     = FLAG_MAP[item.country] ?? '🌐';
  const currency = quote?.currency_symbol ?? '';
  const price    = hoverInfo?.price ?? quote?.current_price;

  const formatPrice = (p) => {
    if (!p && p !== 0) return '—';
    return `${currency}${Number(p).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  if (!item.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div
        className={styles.cardHeader}
        {...attributes}
        {...listeners}
        onClick={() => showDetail(item.ticker)}
        role="button"
        tabIndex={0}
        aria-label={`${item.name}の詳細を開く`}
      >
        {/* 丸形チェックボックス */}
        <button
          className={styles.visibilityBtn}
          onClick={(e) => { e.stopPropagation(); toggleVisibility(item.ticker); }}
          aria-label={`${item.name}を非表示にする`}
          title="クリックでリストから非表示にする"
        >
          <span className={styles.circle} />
        </button>

        <span className={styles.flag}>{flag}</span>
        <span className={styles.name}>{item.name}</span>

        <div className={styles.changeWrapper}>
          {quote && (
            <PriceChange
              change={quote.change}
              changePct={quote.change_pct}
              size="sm"
              showArrow={false}
            />
          )}
        </div>
      </div>

      {/* チャートエリア */}
      <div className={styles.chartArea}>
        {/* ホバー時の価格表示（左上） */}
        {hoverInfo && (
          <div className={styles.hoverPrice}>
            {formatPrice(hoverInfo.price)}
          </div>
        )}
        {!hoverInfo && price && (
          <div className={styles.hoverPrice}>{formatPrice(price)}</div>
        )}

        {/* ホバー時の日時表示（下部中央） */}
        {hoverInfo && (
          <div className={styles.hoverDate}>{hoverInfo.date}</div>
        )}

        {loading ? (
          <div className={styles.loadingWrapper}>
            <span className="spinner" />
          </div>
        ) : (
          <canvas ref={canvasRef} className={styles.canvas} />
        )}
      </div>
    </div>
  );
};

export default StockCard;
