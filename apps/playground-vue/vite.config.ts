import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@flowgame/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@flowgame/vue': path.resolve(__dirname, '../../packages/vue/src/index.ts')
    }
  },
  server: {
    port: 8010,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      }
    }
  }
})
