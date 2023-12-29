import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// import { useQuery } from '@tanstack/react-query'
// import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
// import { LoadingSpinner } from './components/LoadingSpinner'
import { useSettings } from './hooks/useSettings';
import { useTranslation } from 'react-i18next';
export const App = () => {
    // const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false)
    const { i18n: { changeLanguage }, } = useTranslation();
    const { getSetting } = useSettings();
    useEffect(() => {
        changeLanguage(getSetting('language'));
        // setSettingsLoaded(true)
    }, []);
    return (_jsx(_Fragment, { children: _jsx(Outlet, {}) }));
};
