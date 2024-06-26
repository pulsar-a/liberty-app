import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import {
  bytecodePlugin,
  defineConfig,
  externalizeDepsPlugin,
  splitVendorChunkPlugin,
} from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      bytecodePlugin({ protectedStrings: ['**ADD YOUR TOKENS**'] }),
    ],
  },
  preload: {
    plugins: [
      externalizeDepsPlugin(),
      bytecodePlugin({ protectedStrings: ['**ADD YOUR TOKENS**'] }),
      TanStackRouterVite(),
    ],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@app-types': resolve('types'),
        '@ipc-routes': resolve('src/main/router'),
      },
    },
    plugins: [react(), splitVendorChunkPlugin()],
  },
})
