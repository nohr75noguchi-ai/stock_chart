/**
 * アプリケーションヘッダー
 * - Google Finance リンク
 * - 銘柄検索ボックス
 * - サイドバートグルボタン
 * - 認証ボタン
 */
import React from 'react';
import { signInWithGoogle, signOutUser } from '../../services/firebase';
import useStore from '../../store/watchlistStore';
import SearchModal from './SearchModal';
import styles from './Header.module.css';

// Google Finance ロゴ SVG（シンプルな G アイコン）
const GoogleFinanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Header = () => {
  const { user, sidebarOpen, toggleSidebar, openSearchModal, searchModalOpen } = useStore();

  const handleAuth = async () => {
    if (user) {
      await signOutUser();
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          {/* サイドバートグルボタン */}
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            title={sidebarOpen ? 'ウォッチリストを閉じる' : 'ウォッチリストを開く'}
            aria-label="ウォッチリストのサイドバーを切り替え"
          >
            <span className={styles.menuIcon}>
              <span /><span /><span />
            </span>
          </button>

          {/* Google Finance リンク */}
          <a
            href="https://www.google.com/finance/beta/?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.googleFinanceLink}
            title="Google Finance を開く"
            aria-label="Google Finance"
          >
            <GoogleFinanceIcon />
            <span className={styles.googleFinanceText}>Google Finance</span>
          </a>
        </div>

        {/* 検索ボックス */}
        <div className={styles.searchWrapper}>
          <button
            className={styles.searchBox}
            onClick={openSearchModal}
            aria-label="銘柄を検索"
            id="header-search-button"
          >
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span className={styles.searchPlaceholder}>銘柄を検索...</span>
            <kbd className={styles.kbd}>⌘K</kbd>
          </button>
        </div>

        {/* 認証ボタン */}
        <div className={styles.right}>
          <button className={styles.authBtn} onClick={handleAuth} id="auth-button">
            {user ? (
              <span className={styles.userInfo}>
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
                )}
                <span className={styles.userName}>{user.displayName}</span>
              </span>
            ) : (
              <span>ログイン</span>
            )}
          </button>
        </div>
      </header>

      {/* 検索モーダル */}
      {searchModalOpen && <SearchModal />}
    </>
  );
};

export default Header;
