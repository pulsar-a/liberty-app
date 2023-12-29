import { SettingKeys } from '@app-types/settings.types';
export declare const useSettings: () => {
    setSetting: (key: SettingKeys, value?: string | number | null | object) => void;
    getSetting: (key: string, defaultValue?: string | number | null | object) => string | number | null | object;
    resetSettings: () => void;
};
