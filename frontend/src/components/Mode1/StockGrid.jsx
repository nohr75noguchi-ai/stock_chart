/**
 * モード1: 株価グリッド表示
 * - ドラッグ&ドロップで並び替え
 * - 30秒ごとに全銘柄の価格を一括更新
 */
import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import useStore from '../../store/watchlistStore';
import { useMultipleQuotes } from '../../hooks/useStockData';
import StockCard from './StockCard';
import styles from './StockGrid.module.css';

const StockGrid = () => {
  const { watchlist, reorderItems, selectedPeriod } = useStore();
  const visibleList = watchlist.filter((w) => w.visible);
  const allTickers  = visibleList.map((w) => w.ticker);
  const { quotes }  = useMultipleQuotes(allTickers);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIdx = watchlist.findIndex((w) => w.ticker === active.id);
      const newIdx = watchlist.findIndex((w) => w.ticker === over.id);
      const newOrder = arrayMove(watchlist, oldIdx, newIdx);
      reorderItems(newOrder);
    }
  };

  if (visibleList.length === 0) {
    return (
      <div className={styles.empty}>
        <p>銘柄が選択されていません。</p>
        <p>ヘッダーの検索ボックスから銘柄を追加してください。</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibleList.map((w) => w.ticker)} strategy={rectSortingStrategy}>
        <div className={styles.grid}>
          {visibleList.map((item) => (
            <StockCard
              key={item.ticker}
              item={item}
              quote={quotes[item.ticker] ?? null}
              period={selectedPeriod}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default StockGrid;
