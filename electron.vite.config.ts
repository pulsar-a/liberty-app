import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'workers/epub-parser.worker': resolve(
            __dirname,
            'src/main/workers/epub-parser.worker.ts'
          ),
        },
      },
    },
  },
  preload: {
    // Sandboxed preloads cannot use the Node modules required by bytecode-loader.cjs.
    // Bundle dependencies into ordinary JavaScript instead.
    plugins: [],
  },
  renderer: {
    worker: {
      format: 'es',
    },
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
