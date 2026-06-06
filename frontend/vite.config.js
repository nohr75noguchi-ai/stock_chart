import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages デプロイ用に base を設定
// リポジトリ名が stock_chart の場合
export default defineConfig({
  plugins: [react()],
  base: '/stock_chart/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
