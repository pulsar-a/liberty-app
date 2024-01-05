import { RouteEntry } from '@app-types/router.types'
import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'

export const SettingsView: React.FC = () => {
  const { t } = useTranslation()

  const sections: RouteEntry[] = [
    {
      id: 'general',
      name: t('settings_subsection_general_title'),
      to: '/settings',
    },
    {
      id: 'appearance',
      name: t('settings_subsection_appearance_title'),
      to: '/settings/appearance',
      disabled: true,
    },
    {
      id: 'reading',
      name: t('settings_subsection_reading_title'),
      // to: '/settings/reading',
      disabled: true,
    },
    {
      id: 'files',
      name: t('settings_subsection_files_title'),
      to: '/settings/files',
    },
    {
      id: 'plugins',
      name: t('settings_subsection_plugins_title'),
      // to: '/settings/plugins',
      disabled: true,
    },
    {
      id: 'about',
      name: t('settings_subsection_about_title'),
      to: '/settings/about',
    },
  ]

  return (
    <ThreeSectionsLayout
      content={<Outlet />}
      sidebar={<SubmenuEntries className="pt-16" items={sections} />}
    />
  )
}
