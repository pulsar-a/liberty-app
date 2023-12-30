export type SettingsType = {
  language: string | null
  theme: 'light' | 'dark'
}

export type SettingKeys = keyof SettingsType

export type SettingValues = SettingsType[SettingKeys]
