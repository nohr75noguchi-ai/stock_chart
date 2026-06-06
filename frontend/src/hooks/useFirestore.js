/**
 * Firebase Authentication フック
 * 認証状態の変化を監視し、ストアを更新する
 */
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeToWatchlist } from '../services/firebase';
import useStore, { DEFAULT_WATCHLIST } from '../store/watchlistStore';

const useFirestore = () => {
  const { setUser, setWatchlist } = useStore();

  useEffect(() => {
    let unsubWatchlist = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);

      // 前回のウォッチリスト監視を解除
      if (unsubWatchlist) {
        unsubWatchlist();
        unsubWatchlist = null;
      }

      if (user) {
        // ログイン時: Firestore のウォッチリストをリアルタイム監視
        unsubWatchlist = subscribeToWatchlist(user.uid, (items) => {
          if (items.length === 0) {
            // 初回ログイン: デフォルト銘柄をセット（書き込みは UI 側で行う）
            setWatchlist(DEFAULT_WATCHLIST);
          } else {
            setWatchlist(items);
          }
        });
      } else {
        // ログアウト時: デフォルト銘柄に戻す
        setWatchlist(DEFAULT_WATCHLIST);
      }
    });

    return () => {
      unsubAuth();
      if (unsubWatchlist) unsubWatchlist();
    };
  }, [setUser, setWatchlist]);
};

export default useFirestore;
