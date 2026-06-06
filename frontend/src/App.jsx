/**
 * メインアプリケーション
 * - Firebase 認証状態の監視
 * - モード1（グリッド）/ モード2（詳細）の切り替え
 */
import React from 'react';
import useFirestore from './hooks/useFirestore';
import useStore from './store/watchlistStore';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import PeriodSelector from './components/Common/PeriodSelector';
import StockGrid from './components/Mode1/StockGrid';
import DetailView from './components/Mode2/DetailView';
import styles from './App.module.css';

function App() {
  // Firebase 認証状態を監視（副作用のみ）
  useFirestore();

  const { viewMode } = useStore();

  return (
    <div className={styles.app}>
      <Header />
      <Sidebar />

      <main className={styles.main}>
        {viewMode === 'grid' ? (
          <>
            <PeriodSelector />
            <StockGrid />
          </>
        ) : (
          <DetailView />
        )}
      </main>
    </div>
  );
}

export default App;
