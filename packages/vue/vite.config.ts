import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'FlowGameVue',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'vue',
        '@arco-design/web-vue',
        '@arco-design/web-vue/es/icon',
        '@tinyflow-ai/ui',
        '@flowgame/core',
        /^@flowgame\/core\//
      ]
    },
    outDir: 'dist',
    emptyOutDir: true
  }
})
