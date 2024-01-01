export type SettingsType = {
  language: string | null
  theme: 'light' | 'dark'
  userFilesDir: string
}

export type SettingKeys = keyof SettingsType

export type SettingValues = SettingsType[SettingKeys]
