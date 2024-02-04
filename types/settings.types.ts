export type SettingsType = {
  language: string | null
  theme: 'light' | 'dark'
  userFilesDir: string
  currentlyReading: number | null
  libraryViewStyle: 'list' | 'grid'
}

export type SettingKeys = keyof SettingsType

export type SettingValues = SettingsType[SettingKeys]
