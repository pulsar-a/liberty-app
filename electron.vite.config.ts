import react from '@vitejs/plugin-react'
import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'workers/epub-parser.worker': resolve(__dirname, 'src/main/workers/epub-parser.worker.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@app-types': resolve('types'),
        '@ipc-routes': resolve('src/main/router'),
      },
    },
    plugins: [react()],
    optimizeDeps: {
      exclude: ['liberty-reader'],
    },
    build: {
      rollupOptions: {
        // Treat WASM files as external assets
        external: [/\.wasm$/],
      },
    },
    // Enable WASM support
    assetsInclude: ['**/*.wasm'],
  },
})
