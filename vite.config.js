// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/client')
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/googleapi': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/googleapi/, '')
      }
    }
  }
})