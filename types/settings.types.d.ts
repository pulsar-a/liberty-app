export type SettingsType = {
    language: string | null;
    theme: 'light' | 'dark' | 'system';
};
export type SettingKeys = keyof SettingsType;
export type SettingValues = SettingsType[SettingKeys];
