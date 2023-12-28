import create from 'zustand';
import { produce } from 'immer';
import { devtools } from 'zustand/middleware';
import { get as getField } from 'radash';
const getInitialState = () => {
    return {
        settings: {
            language: 'en',
            theme: 'system',
            autoUpdate: false,
        },
    };
};
export const useSettingsStore = create()(devtools((set) => ({
    // State
    ...getInitialState(),
    // Methods
    getAllSettings: async () => {
        return window.api.getAllSettings();
    },
    // Methods
    setInitialSettings: async (settings) => {
        set({ settings });
    },
    getSettingValue: async (key, defaultValue = null) => {
        const settings = await window.api.getAllSettings();
        console.log('settings:', settings);
        return getField(settings, key, defaultValue);
    },
    setSettingValue: async (key, value) => {
        set((state) => {
            window.api.setAllSettings(state.settings);
            return state;
        });
        // window.api.setAllSettings(state.settings)
        set(produce((state) => {
            state.settings[key] = value;
        }));
    },
    flushSettings: async () => {
        const initialState = getInitialState();
        set(initialState);
        window.api.setAllSettings(initialState.settings);
    },
})));
export const grabLanguage = (state) => {
    return state.settings.language || 'en';
};
