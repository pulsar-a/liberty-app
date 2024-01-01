import { SettingKeys } from '@app-types/settings.types'

// const store = new Store()

export const useSettings = () => {
  return {
    setSetting: (key: SettingKeys, value: string | number | null = null): void => {
      window.api.settings.set(key, value)
    },
    getSetting: (
      key: SettingKeys,
      defaultValue: string | number | null = null
    ): string | number | null => {
      return window.api.settings.get(key, defaultValue)
    },
    resetSettings: () => {
      window.api.settings.reset()
    },
  }
}
