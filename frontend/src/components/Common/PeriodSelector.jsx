/**
 * 期間セレクターコンポーネント
 * 横一列でボタンを表示し、任意入力欄も含む
 */
import React, { useState } from 'react';
import useStore from '../../store/watchlistStore';
import styles from './PeriodSelector.module.css';

const PERIODS = [
  { label: '1日',    value: '1d' },
  { label: '5日',    value: '5d' },
  { label: '1週間',  value: '7d' },
  { label: '2週間',  value: '14d' },
  { label: '1ヶ月',  value: '1mo' },
  { label: '3ヶ月',  value: '3mo' },
  { label: '半年',   value: '6mo' },
  { label: '1年',    value: '1y' },
  { label: '5年',    value: '5y' },
  { label: '最大',   value: 'max' },
];

const PeriodSelector = ({ onChange }) => {
  const { selectedPeriod, setSelectedPeriod } = useStore();
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');

  const handleSelect = (value) => {
    setSelectedPeriod(value);
    onChange && onChange({ period: value });
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setSelectedPeriod('custom');
      onChange && onChange({ period: 'custom', start: customStart, end: customEnd });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            className={`${styles.btn} ${selectedPeriod === value ? styles.active : ''}`}
            onClick={() => handleSelect(value)}
          >
            {label}
          </button>
        ))}

        {/* 任意期間入力 */}
        <div className={styles.customRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            placeholder="開始日"
          />
          <span className={styles.dateSep}>〜</span>
          <input
            type="date"
            className={styles.dateInput}
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            placeholder="終了日"
          />
          <button
            className={`${styles.btn} ${styles.applyBtn}`}
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeriodSelector;
