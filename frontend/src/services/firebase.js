/**
 * Firebase 設定・初期化
 * 環境変数から Firebase 設定を読み込む
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';

// Firebase プロジェクト設定（環境変数から読み込み）
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Google 認証プロバイダー
export const googleProvider = new GoogleAuthProvider();

// =========================================================
// 認証ヘルパー
// =========================================================
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser      = () => signOut(auth);

// =========================================================
// Firestore ヘルパー
// =========================================================

/** ウォッチリストコレクション参照を取得 */
const watchlistRef = (uid) =>
  collection(db, 'users', uid, 'watchlist');

/** 全ウォッチリストをリアルタイム監視 */
export const subscribeToWatchlist = (uid, callback) => {
  const q = query(watchlistRef(uid), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.error('Firestore watchlist subscription error:', error);
    }
  );
};

/** 銘柄を追加 */
export const addToWatchlist = async (uid, item) => {
  const { ticker, name, country, order } = item;
  const ref = doc(watchlistRef(uid), ticker);
  await setDoc(ref, {
    ticker,
    name,
    country,
    order,
    visible: true,
    addedAt: serverTimestamp(),
  });
};

/** 銘柄の visible フラグを更新 */
export const updateVisibility = async (uid, ticker, visible) => {
  const ref = doc(watchlistRef(uid), ticker);
  await updateDoc(ref, { visible });
};

/** 銘柄の order を一括更新（並び替え後） */
export const reorderWatchlist = async (uid, items) => {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    const ref = doc(watchlistRef(uid), item.ticker);
    batch.update(ref, { order: index });
  });
  await batch.commit();
};

/** 銘柄を削除 */
export const removeFromWatchlist = async (uid, ticker) => {
  const ref = doc(watchlistRef(uid), ticker);
  await deleteDoc(ref);
};
