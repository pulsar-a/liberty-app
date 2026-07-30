import type { SettingKeys, SettingsType } from '@app-types/settings.types'
import {
  DEFAULT_APP_SETTINGS,
  useAppSettingsStore,
} from '../store/useAppSettingsStore'

export const useSettings = () => {
  const settings = useAppSettingsStore((state) => state.settings)
  const updateLocalSetting = useAppSettingsStore((state) => state.setSetting)
  const replaceSettings = useAppSettingsStore((state) => state.replaceSettings)

  return {
    setSetting: <Key extends SettingKeys>(key: Key, value: SettingsType[Key]): void => {
      const previousSettings = useAppSettingsStore.getState().settings
      updateLocalSetting(key, value)
      void window.api.settings.set(key, value).catch((error) => {
        replaceSettings(previousSettings)
        console.error('Failed to save setting', error)
      })
    },
    getSetting: <Key extends SettingKeys>(
      key: Key,
      defaultValue: SettingsType[Key] = DEFAULT_APP_SETTINGS[key]
    ): SettingsType[Key] => {
      return settings[key] ?? defaultValue
    },
    resetSettings: (): void => {
      const previousSettings = useAppSettingsStore.getState().settings
      replaceSettings(DEFAULT_APP_SETTINGS)
      void window.api.settings
        .reset()
        .then(replaceSettings)
        .catch((error) => {
          replaceSettings(previousSettings)
          console.error('Failed to reset settings', error)
        })
    },
  }
}
