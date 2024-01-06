import { useTranslation } from 'react-i18next'

export const SettingsAppearanceView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8">
      <h2 className="flex gap-4 px-8 pb-8 text-2xl font-semibold">
        {t('settingsView_title')}
        <span>.</span>
        <span className="text-gray-600 dark:text-indigo-300/50">
          {t('settings_subsection_appearance_title')}
        </span>
      </h2>
    </main>
  )
}
