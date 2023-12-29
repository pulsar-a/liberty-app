import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/Select';
import { useSettings } from '../hooks/useSettings';
// import { useSettingsStore } from '../store/useSettingsStore'
// import { useSettings } from '../hooks/useSettings'
export const LanguageSelector = () => {
    const { i18n: { changeLanguage, language }, t, } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    // const { settings, setSettingValue } = useSettingsStore()
    const { getSetting, setSetting } = useSettings();
    const items = [
        { label: 'English', value: 'en' },
        { label: 'Русский', value: 'ru' },
        { label: 'Deutsch', value: 'de' },
    ];
    // const { setSetting, getSetting } = useSettings()
    //
    useEffect(() => {
        setSelectedLanguage(getSetting('language'));
    }, []);
    //
    // useEffect(() => {
    //   console.log('FROM SETTINGS!', getSetting('language') as string)
    //   setSelectedLanguage(getSetting('language') || 'en')
    // }, [])
    const handleLanguageChange = async (value) => {
        setSelectedLanguage(value);
        setSetting('language', value || 'en');
        changeLanguage(value);
    };
    return (_jsxs("div", { children: [_jsxs("div", { children: ["SELECTED: ", selectedLanguage] }), _jsx(Select, { options: items, value: selectedLanguage, label: t('settingsView_config_language_title'), onChange: handleLanguageChange })] }));
};
