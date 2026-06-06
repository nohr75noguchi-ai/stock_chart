/**
 * Zustand グローバルストア
 * ウォッチリスト・UI 状態・現在の表示モードを管理
 */
import { create } from 'zustand';
import {
  addToWatchlist,
  removeFromWatchlist,
  updateVisibility,
  reorderWatchlist,
} from '../services/firebase';

// デフォルト銘柄セット（未ログイン時 / 初回ログイン時に使用）
export const DEFAULT_WATCHLIST = [
  { ticker: '^N225',  name: '日経平均株価',     country: 'JP', order: 0, visible: true },
  { ticker: '^GSPC',  name: 'S&P 500',         country: 'US', order: 1, visible: true },
  { ticker: '^DJI',   name: 'ダウ平均',         country: 'US', order: 2, visible: true },
  { ticker: 'AAPL',   name: 'Apple',           country: 'US', order: 3, visible: true },
  { ticker: 'MSFT',   name: 'Microsoft',       country: 'US', order: 4, visible: true },
  { ticker: '7011.T', name: '三菱重工業',       country: 'JP', order: 5, visible: true },
  { ticker: '7974.T', name: '任天堂',           country: 'JP', order: 6, visible: true },
  { ticker: '8035.T', name: '東京エレクトロン', country: 'JP', order: 7, visible: true },
];

const useStore = create((set, get) => ({
  // =========================================================
  // 認証状態
  // =========================================================
  user: null,
  setUser: (user) => set({ user }),

  // =========================================================
  // ウォッチリスト（Firestore と同期）
  // =========================================================
  watchlist: DEFAULT_WATCHLIST,
  setWatchlist: (watchlist) => set({ watchlist }),

  /** 銘柄を追加 */
  addTicker: async (tickerInfo) => {
    const { user, watchlist } = get();
    const exists = watchlist.find((w) => w.ticker === tickerInfo.ticker);
    if (exists) return;

    const newItem = { ...tickerInfo, order: watchlist.length, visible: true };
    set({ watchlist: [...watchlist, newItem] });

    if (user) {
      await addToWatchlist(user.uid, newItem);
    }
  },

  /** 銘柄を削除 */
  removeTicker: async (ticker) => {
    const { user, watchlist } = get();
    set({ watchlist: watchlist.filter((w) => w.ticker !== ticker) });

    if (user) {
      await removeFromWatchlist(user.uid, ticker);
    }
  },

  /** 銘柄の表示/非表示切り替え */
  toggleVisibility: async (ticker) => {
    const { user, watchlist } = get();
    const updated = watchlist.map((w) =>
      w.ticker === ticker ? { ...w, visible: !w.visible } : w
    );
    set({ watchlist: updated });

    if (user) {
      const item = updated.find((w) => w.ticker === ticker);
      await updateVisibility(user.uid, ticker, item.visible);
    }
  },

  /** 並び替え（ドラッグ&ドロップ後） */
  reorderItems: async (newOrder) => {
    const { user } = get();
    const reordered = newOrder.map((item, index) => ({ ...item, order: index }));
    set({ watchlist: reordered });

    if (user) {
      await reorderWatchlist(user.uid, reordered);
    }
  },

  // =========================================================
  // UI 状態
  // =========================================================
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  /** 'grid' | 'detail' */
  viewMode: 'grid',
  /** 詳細表示対象のティッカー */
  selectedTicker: null,

  showGrid: () => set({ viewMode: 'grid', selectedTicker: null }),
  showDetail: (ticker) => set({ viewMode: 'detail', selectedTicker: ticker }),

  // =========================================================
  // 期間設定
  // =========================================================
  selectedPeriod: '1d',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  // =========================================================
  // 検索モーダル
  // =========================================================
  searchModalOpen: false,
  openSearchModal: ()  => set({ searchModalOpen: true }),
  closeSearchModal: () => set({ searchModalOpen: false }),
}));

export default useStore;
