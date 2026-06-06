/**
 * モード2の大型詳細チャート
 * - エリア / ローソク足切り替え
 * - SMA, EMA, Bollinger オーバーレイ
 * - RSI, MACD 別パネル
 * - 比較機能（複数銘柄を正規化して重ねる）
 * - 出来高バーチャート（下部）
 * - 前日終値ライン
 */
import React, { useRef, useEffect, useCallback } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { useHistory } from '../../hooks/useStockData';
import { fetchHistory } from '../../services/api';
import styles from './DetailChart.module.css';

// ── テクニカル計算ユーティリティ ──────────────────────────

const calcSMA = (data, period) => {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
};

const calcEMA = (data, period) => {
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  data.forEach((val) => {
    if (ema === null) { ema = val; }
    else { ema = val * k + ema * (1 - k); }
    result.push(ema);
  });
  return result;
};

const calcBollinger = (data, period = 20, stdDev = 2) => {
  const sma = calcSMA(data, period);
  return data.map((_, i) => {
    if (sma[i] === null) return { upper: null, middle: null, lower: null };
    const slice = data.slice(Math.max(0, i - period + 1), i + 1);
    const mean  = sma[i];
    const std   = Math.sqrt(slice.reduce((a, v) => a + (v - mean) ** 2, 0) / slice.length);
    return {
      upper:  mean + stdDev * std,
      middle: mean,
      lower:  mean - stdDev * std,
    };
  });
};

const calcRSI = (data, period = 14) => {
  const result = new Array(data.length).fill(null);
  if (data.length < period + 1) return result;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain  = gains / period;
  let avgLoss  = losses / period;
  result[period] = 100 - 100 / (1 + (avgGain / (avgLoss || 0.001)));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain  = (avgGain  * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss  = (avgLoss  * (period - 1) + Math.max(-diff, 0)) / period;
    result[i] = 100 - 100 / (1 + (avgGain / (avgLoss || 0.001)));
  }
  return result;
};

const calcMACD = (data, fast = 12, slow = 26, signal = 9) => {
  const emaFast   = calcEMA(data, fast);
  const emaSlow   = calcEMA(data, slow);
  const macdLine  = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine= calcEMA(macdLine.filter((v) => v !== null), signal);
  const offset    = macdLine.length - signalLine.length;
  const histogram = macdLine.map((v, i) =>
    i >= offset ? v - signalLine[i - offset] : null
  );
  return { macdLine, signalLine: signalLine.map((v) => v), histogram, offset };
};

// ── DetailChart コンポーネント ──────────────────────────────

const DetailChart = ({ ticker, period, chartType, indicators, compareList, prevClose, isUp }) => {
  const mainCanvasRef   = useRef(null);
  const volumeCanvasRef = useRef(null);
  const rsiCanvasRef    = useRef(null);
  const macdCanvasRef   = useRef(null);
  const mainChartRef    = useRef(null);
  const volumeChartRef  = useRef(null);
  const rsiChartRef     = useRef(null);
  const macdChartRef    = useRef(null);

  const { data: historyData } = useHistory(ticker, period);

  const lineColor = isUp ? '#00b96b' : '#f44336';
  const fillColor = isUp ? 'rgba(0,185,107,0.15)' : 'rgba(244,67,54,0.15)';

  const buildCharts = useCallback(async () => {
    if (!mainCanvasRef.current || historyData.length === 0) return;

    const timestamps = historyData.map((d) => d.timestamp);
    const closes     = historyData.map((d) => d.close);
    const volumes    = historyData.map((d) => d.volume);

    // 前日終値ライン
    const prevLine = prevClose ? new Array(closes.length).fill(prevClose) : [];

    // ── メインチャート datasets ──
    const datasets = [{
      label: ticker,
      data: closes,
      borderColor: lineColor,
      borderWidth: 2,
      fill: chartType === 'area',
      backgroundColor: chartType === 'area' ? fillColor : 'transparent',
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: lineColor,
    }];

    if (prevClose) {
      datasets.push({
        label: '前日終値',
        data: prevLine,
        borderColor: 'rgba(154,160,166,0.5)',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
      });
    }

    // テクニカル指標 追加
    if (indicators.sma25) {
      datasets.push({
        label: 'SMA25',
        data: calcSMA(closes, 25),
        borderColor: '#7c4dff',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }
    if (indicators.sma75) {
      datasets.push({
        label: 'SMA75',
        data: calcSMA(closes, 75),
        borderColor: '#ff6d00',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }
    if (indicators.sma200) {
      datasets.push({
        label: 'SMA200',
        data: calcSMA(closes, 200),
        borderColor: '#00bcd4',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }
    if (indicators.ema9) {
      datasets.push({
        label: 'EMA9',
        data: calcEMA(closes, 9),
        borderColor: '#e040fb',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }
    if (indicators.ema21) {
      datasets.push({
        label: 'EMA21',
        data: calcEMA(closes, 21),
        borderColor: '#00e5ff',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      });
    }
    if (indicators.bollinger) {
      const bb = calcBollinger(closes);
      datasets.push(
        { label: 'BB上限', data: bb.map((v) => v.upper),  borderColor: 'rgba(100,181,246,0.8)', borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3 },
        { label: 'BB中線', data: bb.map((v) => v.middle), borderColor: 'rgba(100,181,246,0.4)', borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3, borderDash: [4,4] },
        { label: 'BB下限', data: bb.map((v) => v.lower),  borderColor: 'rgba(100,181,246,0.8)', borderWidth: 1, fill: false, pointRadius: 0, tension: 0.3 },
      );
    }

    // 比較銘柄（正規化 %変化率）
    for (const sym of compareList) {
      try {
        const res = await fetchHistory(sym, period);
        const compData = res.data || [];
        if (compData.length > 0) {
          const base = compData[0].close;
          const normalized = compData.map((d) => ((d.close - base) / base) * 100);
          // メインも正規化
          datasets[0].data = closes.map((c) => ((c - closes[0]) / closes[0]) * 100);
          datasets.push({
            label: sym,
            data: normalized,
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          });
        }
      } catch {
        // 比較銘柄取得失敗は無視
      }
    }

    // ── メインチャート描画 ──
    mainChartRef.current?.destroy();
    mainChartRef.current = new Chart(mainCanvasRef.current, {
      type: 'line',
      data: { labels: timestamps, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: datasets.length > 2,
            position: 'top',
            labels: { color: '#9aa0a6', font: { size: 11 }, boxWidth: 20 },
          },
          tooltip: {
            backgroundColor: 'rgba(26,26,26,0.95)',
            borderColor: '#2e2e2e',
            borderWidth: 1,
            titleColor: '#e8eaed',
            bodyColor: '#9aa0a6',
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(46,46,46,0.5)', drawBorder: false },
            ticks: { color: '#9aa0a6', font: { size: 11 }, maxTicksLimit: 8 },
          },
          y: {
            position: 'right',
            grid: { color: 'rgba(46,46,46,0.5)', drawBorder: false },
            ticks: { color: '#9aa0a6', font: { size: 11 } },
          },
        },
      },
      plugins: [{
        id: 'crosshair',
        afterDraw(chart) {
          if (!chart.tooltip._active?.length) return;
          const { ctx, chartArea } = chart;
          const x = chart.tooltip._active[0].element.x;
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.stroke();
          ctx.restore();
        },
      }],
    });

    // ── 出来高チャート ──
    volumeChartRef.current?.destroy();
    if (volumeCanvasRef.current) {
      volumeChartRef.current = new Chart(volumeCanvasRef.current, {
        type: 'bar',
        data: {
          labels: timestamps,
          datasets: [{
            label: '出来高',
            data: volumes,
            backgroundColor: historyData.map((d, i) =>
              i === 0
                ? 'rgba(154,160,166,0.4)'
                : d.close >= historyData[i - 1].close
                  ? 'rgba(0,185,107,0.5)'
                  : 'rgba(244,67,54,0.5)'
            ),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(26,26,26,0.95)',
              borderColor: '#2e2e2e',
              borderWidth: 1,
              callbacks: {
                label: (item) => `出来高: ${Number(item.raw).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: { display: false },
            y: {
              position: 'right',
              grid: { color: 'rgba(46,46,46,0.3)' },
              ticks: { color: '#5f6368', font: { size: 10 } },
            },
          },
        },
      });
    }

    // ── RSI チャート ──
    if (indicators.rsi && rsiCanvasRef.current) {
      const rsi = calcRSI(closes);
      rsiChartRef.current?.destroy();
      rsiChartRef.current = new Chart(rsiCanvasRef.current, {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [
            {
              label: 'RSI(14)',
              data: rsi,
              borderColor: '#ffb300',
              borderWidth: 1.5,
              fill: false,
              pointRadius: 0,
              tension: 0.3,
            },
            { label: '70', data: new Array(rsi.length).fill(70), borderColor: 'rgba(244,67,54,0.4)', borderWidth: 1, borderDash: [4,4], fill: false, pointRadius: 0 },
            { label: '30', data: new Array(rsi.length).fill(30), borderColor: 'rgba(0,185,107,0.4)', borderWidth: 1, borderDash: [4,4], fill: false, pointRadius: 0 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { min: 0, max: 100, position: 'right', ticks: { color: '#5f6368', font: { size: 10 } }, grid: { color: 'rgba(46,46,46,0.3)' } },
          },
        },
      });
    }

    // ── MACD チャート ──
    if (indicators.macd && macdCanvasRef.current) {
      const { macdLine, signalLine, histogram, offset } = calcMACD(closes);
      const hData = histogram.slice(offset);
      macdChartRef.current?.destroy();
      macdChartRef.current = new Chart(macdCanvasRef.current, {
        type: 'bar',
        data: {
          labels: timestamps.slice(offset),
          datasets: [
            { type: 'line', label: 'MACD', data: macdLine.slice(offset), borderColor: '#1a73e8', borderWidth: 1.5, fill: false, pointRadius: 0, tension: 0.3 },
            { type: 'line', label: 'Signal', data: signalLine, borderColor: '#f44336', borderWidth: 1.5, fill: false, pointRadius: 0, tension: 0.3 },
            { type: 'bar', label: 'Hist', data: hData, backgroundColor: hData.map((v) => v >= 0 ? 'rgba(0,185,107,0.6)' : 'rgba(244,67,54,0.6)'), borderWidth: 0 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { position: 'right', ticks: { color: '#5f6368', font: { size: 10 } }, grid: { color: 'rgba(46,46,46,0.3)' } },
          },
        },
      });
    }
  }, [historyData, ticker, period, chartType, indicators, compareList, prevClose, isUp, lineColor, fillColor]);

  useEffect(() => {
    buildCharts();
    return () => {
      mainChartRef.current?.destroy();
      volumeChartRef.current?.destroy();
      rsiChartRef.current?.destroy();
      macdChartRef.current?.destroy();
    };
  }, [buildCharts]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainChart}>
        <canvas ref={mainCanvasRef} />
      </div>
      <div className={styles.volumeChart}>
        <canvas ref={volumeCanvasRef} />
      </div>
      {indicators.rsi && (
        <div className={styles.subPanel}>
          <span className={styles.panelLabel}>RSI (14)</span>
          <canvas ref={rsiCanvasRef} />
        </div>
      )}
      {indicators.macd && (
        <div className={styles.subPanel}>
          <span className={styles.panelLabel}>MACD (12, 26, 9)</span>
          <canvas ref={macdCanvasRef} />
        </div>
      )}
    </div>
  );
};

export default DetailChart;
