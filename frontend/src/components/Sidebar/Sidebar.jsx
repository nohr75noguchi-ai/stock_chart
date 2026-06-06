/**
 * サイドバー（ウォッチリスト一覧）
 * - メイン画面の上にオーバーレイ表示（position: fixed）
 * - ドラッグ&ドロップで並び替え対応
 * - ミニスパークラインチャート付き
 */
import React, { useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import useStore from '../../store/watchlistStore';
import SidebarItem from './SidebarItem';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const { sidebarOpen, watchlist, reorderItems, toggleSidebar } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ESC キーで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && sidebarOpen) toggleSidebar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen, toggleSidebar]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIdx = watchlist.findIndex((w) => w.ticker === active.id);
      const newIdx = watchlist.findIndex((w) => w.ticker === over.id);
      const newOrder = arrayMove(watchlist, oldIdx, newIdx);
      reorderItems(newOrder);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <>
      {/* 背景オーバーレイ（クリックで閉じる） */}
      <div className={styles.backdrop} onClick={toggleSidebar} />

      {/* サイドバー本体 */}
      <aside className={`${styles.sidebar} animate-slide-left`} aria-label="ウォッチリスト">
        <div className={styles.header}>
          <span className={styles.title}>ウォッチリスト</span>
          <button className={styles.closeBtn} onClick={toggleSidebar} aria-label="閉じる">✕</button>
        </div>

        <div className={styles.list}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={watchlist.map((w) => w.ticker)}
              strategy={verticalListSortingStrategy}
            >
              {watchlist.map((item) => (
                <SidebarItem key={item.ticker} item={item} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
