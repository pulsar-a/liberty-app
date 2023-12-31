import { useTranslation } from 'react-i18next'

export const SettingsAboutView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8">
      <h2 className="text-2xl font-semibold">{t('settings_subsection_about_title')}</h2>
    </main>
  )
}
