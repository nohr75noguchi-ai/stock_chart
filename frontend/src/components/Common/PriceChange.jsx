/**
 * 前日比表示コンポーネント
 * プラス→青、マイナス→赤で表示
 */
import React from 'react';

const PriceChange = ({ change, changePct, size = 'md', showArrow = true }) => {
  if (change === null || change === undefined) return null;

  const isUp      = change >= 0;
  const colorClass = isUp ? 'up' : 'down';
  const arrow     = showArrow ? (isUp ? '▲' : '▼') : '';
  const sign      = isUp ? '+' : '-';

  const sizeStyle = {
    sm:  { fontSize: '11px', gap: '3px' },
    md:  { fontSize: '13px', gap: '4px' },
    lg:  { fontSize: '16px', gap: '6px' },
    xl:  { fontSize: '20px', gap: '8px' },
  }[size] || { fontSize: '13px', gap: '4px' };

  return (
    <span
      className={colorClass}
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        sizeStyle.gap,
        fontSize:   sizeStyle.fontSize,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {showArrow && (
        <span style={{ fontSize: '0.75em' }}>{arrow}</span>
      )}
      <span>{sign}{Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      {changePct !== null && changePct !== undefined && (
        <span>({sign}{Math.abs(changePct).toFixed(2)}%)</span>
      )}
    </span>
  );
};

export default PriceChange;
