import type { SettingsType, SettingKeys } from '@app-types/settings.types'
import { create } from 'zustand'

export const DEFAULT_APP_SETTINGS: SettingsType = {
  language: 'en',
  theme: 'system',
  userFilesDir: '',
  currentlyReading: null,
  libraryViewStyle: 'grid',
  confirmRemoveFromCollection: true,
  confirmDeleteBook: true,
  confirmLastBookFileRemoval: true,
  lastBookFileRemovalAction: 'keepBook',
}

type AppSettingsState = {
  settings: SettingsType
  replaceSettings: (settings: SettingsType) => void
  setSetting: <Key extends SettingKeys>(key: Key, value: SettingsType[Key]) => void
}

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  settings: DEFAULT_APP_SETTINGS,
  replaceSettings: (settings) => set({ settings }),
  setSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
}))

export const initializeAppSettings = (settings: SettingsType): void => {
  useAppSettingsStore.getState().replaceSettings(settings)
}
