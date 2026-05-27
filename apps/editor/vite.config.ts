import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { vitePluginForArco } from '@arco-plugins/vite-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vitePluginForArco({ style: 'css' }),
    AutoImport({
      resolvers: [ArcoResolver()],
      imports: ['vue', 'vue-router'],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ArcoResolver({ sideEffect: true })]
    })
  ],
  resolve: {
    alias: [
      // 必须写在 @flowgame/vue 之前，否则 style.css 会被解析成 index.ts/style.css
      {
        find: '@flowgame/vue/style.css',
        replacement: path.resolve(__dirname, '../../packages/vue/src/style.scss')
      },
      {
        find: '@flowgame/vue',
        replacement: path.resolve(__dirname, '../../packages/vue/src/index.ts')
      },
      {
        find: '@flowgame/core',
        replacement: path.resolve(__dirname, '../../packages/core/src/index.ts')
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/media/base.scss" as *;'
      }
    }
  },
  server: {
    port: 8009,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      }
    }
  }
})
