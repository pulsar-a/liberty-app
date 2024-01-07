import { create } from 'zustand'

type PlatformState = {
  platform: string | null
  setPlatform: (platform: string) => void
}

export const usePlatformStore = create<PlatformState>((set) => ({
  platform: null,
  setPlatform: (platform) => set({ platform }),
}))

export const grabIsMac = (state: PlatformState) => {
  return state.platform === 'darwin'
}

export const grabIsWindows = (state) => {
  return state.platform === 'win32'
}

export const grabIsLinux = (state) => {
  return state.platform === 'linux'
}
// isMac: process.platform === 'darwin',
//   isWindows: process.platform === 'win32',
//   isLinux: process.platform === 'linux',
