import { SettingKeys, SettingValues } from '@app-types/settings.types'

// const store = new Store()

export const useSettings = () => {
  return {
    setSetting: (key: SettingKeys, value: SettingValues = null): void => {
      window.api.settings.set(key, value)
    },
    getSetting: (key: SettingKeys, defaultValue: SettingValues = null): SettingValues => {
      return window.api.settings.get(key, defaultValue)
    },
    resetSettings: () => {
      window.api.settings.reset()
    },
  }
}
