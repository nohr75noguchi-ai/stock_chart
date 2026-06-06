/**
 * 財務情報タブ
 */
import React, { useEffect, useState } from 'react';
import { fetchFinancials } from '../../services/api';
import styles from './Tabs.module.css';

const KEY_METRICS = [
  'Total Revenue',
  'Gross Profit',
  'Operating Income',
  'Net Income',
  'EBITDA',
];

const fmtNum = (v) => {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}兆`;
  if (abs >= 1e8)  return `${sign}${(abs / 1e8).toFixed(1)}億`;
  if (abs >= 1e4)  return `${sign}${(abs / 1e4).toFixed(1)}万`;
  return v.toLocaleString();
};

const FinancialsTab = ({ ticker }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]       = useState('annual'); // 'annual' | 'quarterly'

  useEffect(() => {
    setLoading(true);
    fetchFinancials(ticker)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <div className={styles.loading}><span className="spinner" /></div>;

  const rows = mode === 'annual' ? (data?.annual ?? []) : (data?.quarterly ?? []);
  const periods = rows.map((r) => r.period);

  return (
    <div className={styles.container}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${mode === 'annual' ? styles.modeActive : ''}`}
          onClick={() => setMode('annual')}
        >年次</button>
        <button
          className={`${styles.modeBtn} ${mode === 'quarterly' ? styles.modeActive : ''}`}
          onClick={() => setMode('quarterly')}
        >四半期</button>
      </div>

      {rows.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>指標</th>
                {periods.map((p) => <th key={p}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {KEY_METRICS.map((metric) => (
                <tr key={metric}>
                  <td className={styles.metricName}>{metric}</td>
                  {rows.map((row) => (
                    <td key={row.period}>{fmtNum(row[metric])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noData}>財務データがありません</p>
      )}
    </div>
  );
};

export default FinancialsTab;
