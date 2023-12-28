import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// import { useQuery } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useSettingsStore } from './store/useSettingsStore';
import { useTranslation } from 'react-i18next';
// import { useSettings } from './hooks/useSettings'
export const App = () => {
    const { setInitialSettings } = useSettingsStore();
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    useQuery({
        queryKey: ['settings'],
        queryFn: () => window.api.getAllSettings(),
        enabled: !settingsLoaded,
        onSuccess: (data) => {
            console.log('WORKS', data);
            setInitialSettings(data);
            setSettingsLoaded(true);
            changeLanguage(data.language);
        },
    });
    const { i18n: { changeLanguage }, } = useTranslation();
    return (_jsxs(_Fragment, { children: [!settingsLoaded && (_jsx("div", { className: "flex items-center justify-center h-dvh w-full bg-slate-900", children: _jsx(LoadingSpinner, { size: "lg" }) })), settingsLoaded && _jsx(Outlet, {})] }));
};
