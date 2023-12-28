import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
export const SettingsView = () => {
    const { t } = useTranslation();
    return (_jsxs("div", { children: [_jsx("div", { className: "text-3xl", children: t('settingsView_title') }), _jsx("div", { children: _jsx(LanguageSelector, {}) })] }));
};
