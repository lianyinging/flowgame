import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json'
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'FlowGameCore',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        '@tinyflow-ai/ui',
        'axios',
        /^@xyflow\//
      ]
    },
    outDir: 'dist',
    emptyOutDir: true
  }
})
