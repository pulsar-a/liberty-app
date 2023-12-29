// const store = new Store()
export const useSettings = () => {
    return {
        setSetting: (key, value = null) => {
            window.api.settings.set(key, value);
        },
        getSetting: (key, defaultValue = null) => {
            return window.api.settings.get(key, defaultValue);
        },
        resetSettings: () => {
            window.api.settings.reset();
        },
    };
};
