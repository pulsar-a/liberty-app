import react from '@vitejs/plugin-react'
import { bytecodePlugin, defineConfig, externalizeDepsPlugin } from 'electron-vite'
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
    plugins: [react()],
  },
})
