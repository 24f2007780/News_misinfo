import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// client/vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:10000',
        ws: true,
        changeOrigin: true,
      }
    },
  },
})