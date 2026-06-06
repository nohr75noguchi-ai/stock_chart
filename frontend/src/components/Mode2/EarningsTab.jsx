/**
 * 決算発表タブ
 */
import React, { useEffect, useState } from 'react';
import { fetchEarnings } from '../../services/api';
import styles from './Tabs.module.css';

const EarningsTab = ({ ticker }) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEarnings(ticker)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <div className={styles.loading}><span className="spinner" /></div>;

  const nextDate = data?.next_earnings_date
    ? new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
        .format(new Date(data.next_earnings_date))
    : '未確定';

  return (
    <div className={styles.container}>
      <div className={styles.nextEarnings}>
        <span className={styles.label}>次回決算発表日</span>
        <span className={styles.value}>{nextDate}</span>
      </div>

      {data?.history?.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>期間</th>
              <th>EPS予想</th>
              <th>EPS実績</th>
              <th>サプライズ</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((row, i) => {
              const surpPct = row.surprise_pct;
              const isPos   = surpPct >= 0;
              return (
                <tr key={i}>
                  <td>{row.date}</td>
                  <td>{row.eps_estimate != null ? row.eps_estimate.toFixed(2) : '—'}</td>
                  <td>{row.eps_actual   != null ? row.eps_actual.toFixed(2)   : '—'}</td>
                  <td className={isPos ? styles.up : styles.down}>
                    {surpPct != null ? `${isPos ? '+' : ''}${surpPct.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className={styles.noData}>決算履歴データがありません</p>
      )}
    </div>
  );
};

export default EarningsTab;
