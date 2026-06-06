/**
 * 概要タブ - 財務データグリッド表示
 */
import React from 'react';
import { fetchInfo } from '../../services/api';
import { useEffect, useState } from 'react';
import styles from './Tabs.module.css';

const fmt = (v, opts = {}) => {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString('ja-JP', opts);
  return v;
};

const fmtLarge = (v) => {
  if (v == null) return '—';
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}兆`;
  if (v >= 1e8)  return `${(v / 1e8).toFixed(2)}億`;
  if (v >= 1e4)  return `${(v / 1e4).toFixed(2)}万`;
  return v.toLocaleString();
};

const fmtPct = (v) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);

const OverviewTab = ({ quote, ticker }) => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetchInfo(ticker).then(setInfo).catch(() => {});
  }, [ticker]);

  const rows1 = [
    { label: '始値',     value: fmt(quote?.open,      { maximumFractionDigits: 2 }) },
    { label: '高値',     value: fmt(quote?.day_high,  { maximumFractionDigits: 2 }) },
    { label: '安値',     value: fmt(quote?.day_low,   { maximumFractionDigits: 2 }) },
    { label: '時価総額', value: fmtLarge(quote?.market_cap) },
    { label: '出来高',   value: fmtLarge(quote?.volume) },
    { label: '平均出来高', value: fmtLarge(quote?.avg_volume) },
  ];

  const rows2 = [
    { label: 'PER',          value: fmt(quote?.pe_ratio, { maximumFractionDigits: 2 }) },
    { label: 'EPS',          value: fmt(quote?.eps,      { maximumFractionDigits: 2 }) },
    { label: '52週高値',     value: fmt(quote?.week_52_high, { maximumFractionDigits: 2 }) },
    { label: '52週安値',     value: fmt(quote?.week_52_low,  { maximumFractionDigits: 2 }) },
    { label: '配当利回り',   value: fmtPct(quote?.dividend_yield) },
    { label: '発行済み株式数', value: fmtLarge(quote?.shares_outstanding) },
  ];

  const infoRows = info ? [
    { label: 'セクター',   value: info.sector },
    { label: '業種',       value: info.industry },
    { label: '従業員数',   value: fmtLarge(info.employees) },
    { label: 'ベータ',     value: fmt(info.beta, { maximumFractionDigits: 2 }) },
    { label: '予想PER',    value: fmt(info.forward_pe, { maximumFractionDigits: 2 }) },
    { label: 'PBR',        value: fmt(info.price_to_book, { maximumFractionDigits: 2 }) },
  ] : [];

  return (
    <div className={styles.container}>
      {/* 企業説明 */}
      {info?.description && (
        <div className={styles.description}>
          <p>{info.description.slice(0, 300)}{info.description.length > 300 ? '...' : ''}</p>
        </div>
      )}

      <div className={styles.grid}>
        {/* 価格データ */}
        <div className={styles.section}>
          {rows1.map(({ label, value }) => (
            <div key={label} className={styles.row}>
              <span className={styles.rowLabel}>{label}</span>
              <span className={styles.rowValue}>{value}</span>
            </div>
          ))}
        </div>

        {/* バリュエーション */}
        <div className={styles.section}>
          {rows2.map(({ label, value }) => (
            <div key={label} className={styles.row}>
              <span className={styles.rowLabel}>{label}</span>
              <span className={styles.rowValue}>{value}</span>
            </div>
          ))}
        </div>

        {/* 企業情報 */}
        {infoRows.length > 0 && (
          <div className={styles.section}>
            {infoRows.map(({ label, value }) => (
              <div key={label} className={styles.row}>
                <span className={styles.rowLabel}>{label}</span>
                <span className={styles.rowValue}>{value ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
