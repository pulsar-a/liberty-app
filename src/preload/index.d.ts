import { ElectronAPI } from '@electron-toolkit/preload'
import { LoadingStatusItem } from '../../types/loader.types'
import type { SettingKeys, SettingsType } from '../../types/settings.types'

export declare const api: {
  settings: {
    getAll(): Promise<SettingsType>
    set<Key extends SettingKeys>(property: Key, value: SettingsType[Key]): Promise<SettingsType>
    reset(): Promise<SettingsType>
  }
  setTitle: (title: string) => void
  openExternal: (url: string) => Promise<boolean>
  selectFolder: () => Promise<string | null>
  onAddLoaders: (callback: (items: LoadingStatusItem[]) => void) => void
  onUpdateLoader: (
    callback: (value: {
      id: string | number
      status: LoadingStatusItem['status']
      label?: string
      labelParams?: Record<string, string>
      subLabel?: string
      subLabelParams?: Record<string, string>
    }) => void
  ) => void
  onReaderProgress: (
    callback: (data: { bookId: number; percent: number; stage: string }) => void
  ) => void
  offReaderProgress: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: typeof api
  }
}
