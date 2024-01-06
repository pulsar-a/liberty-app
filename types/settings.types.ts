export type SettingsType = {
  language: string | null
  theme: 'light' | 'dark'
  userFilesDir: string
  currentlyReading: number | null
}

export type SettingKeys = keyof SettingsType

export type SettingValues = SettingsType[SettingKeys]
