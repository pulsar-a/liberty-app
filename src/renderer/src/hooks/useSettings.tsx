import { SettingKeys } from '@app-types/settings.types'

// const store = new Store()

export const useSettings = () => {
  return {
    setSetting: (key: SettingKeys, value: string | number | null | object = null): void => {
      window.api.settings.set(key, value)
    },
    getSetting: (
      key: string,
      defaultValue: string | number | null | object = null
    ): string | number | null | object => {
      return window.api.settings.get(key, defaultValue)
    },
    resetSettings: () => {
      window.api.settings.reset()
    },
  }
}
