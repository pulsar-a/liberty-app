import { useTranslation } from 'react-i18next'

export const SettingsAppearanceView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8">
      <h2 className="text-2xl font-semibold">{t('settings_subsection_appearance_title')}</h2>
    </main>
  )
}
