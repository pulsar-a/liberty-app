import { SettingsTypes } from '@app-types/settings.types';
export interface SettingsState {
    settings: SettingsTypes;
}
export interface SettingsMethods {
    getAllSettings: () => Promise<SettingsTypes>;
    setInitialSettings: (settings: SettingsTypes) => void;
    getSettingValue: (key: string, defaultValue: string | number | null | object) => Promise<string | number | null | object>;
    setSettingValue: (key: string, value: string | number | null | object) => Promise<void>;
    flushSettings: () => Promise<void>;
}
export interface SettingsStoreState extends SettingsState, SettingsMethods {
}
export declare const useSettingsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<SettingsStoreState>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: SettingsStoreState | Partial<SettingsStoreState> | ((state: SettingsStoreState) => SettingsStoreState | Partial<SettingsStoreState>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
export declare const grabLanguage: (state: SettingsStoreState) => string;
