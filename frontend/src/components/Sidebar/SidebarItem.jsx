/**
 * サイドバーの各銘柄行
 * ドラッグ&ドロップ対応・ミニスパークライン・前日比表示
 */
import React, { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Chart from 'chart.js/auto';
import { useQuote, useHistory } from '../../hooks/useStockData';
import useStore from '../../store/watchlistStore';
import PriceChange from '../Common/PriceChange';
import styles from './SidebarItem.module.css';

const MiniSparkline = ({ ticker }) => {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const { selectedPeriod } = useStore();
  const { data }  = useHistory(ticker, selectedPeriod);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const closes = data.map((d) => d.close);
    
    // 期間の最初と最後の終値を比較して上昇（緑）か下落（赤）かを判定
    const firstVal = closes[0] ?? 0;
    const lastVal  = closes[closes.length - 1] ?? 0;
    const isPeriodUp = lastVal >= firstVal;
    const color = isPeriodUp ? '#00b96b' : '#f44336';

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: closes.map((_, i) => i),
        datasets: [{
          data: closes,
          borderColor: color,
          borderWidth: 1.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={canvasRef} width={80} height={36} />;
};

const SidebarItem = ({ item }) => {
  const { showDetail } = useStore();
  const { data: quote } = useQuote(item.ticker);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.ticker });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isUp = (quote?.change_pct ?? 0) >= 0;
  const price = quote?.current_price ?? '—';
  const currency = quote?.currency_symbol ?? '';

  const formatPrice = (p) => {
    if (p === '—') return p;
    return `${currency}${Number(p).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => showDetail(item.ticker)}
      role="button"
      tabIndex={0}
      aria-label={`${item.ticker} ${item.name}`}
    >
      <div className={styles.info}>
        <span className={styles.ticker}>{item.ticker}</span>
        <span className={styles.name}>{item.name}</span>
      </div>

      <div className={styles.chart}>
        <MiniSparkline ticker={item.ticker} />
      </div>

      <div className={styles.price}>
        <span className={styles.currentPrice}>{formatPrice(price)}</span>
        {quote && (
          <PriceChange
            change={quote.change}
            changePct={quote.change_pct}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default SidebarItem;
