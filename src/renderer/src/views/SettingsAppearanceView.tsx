import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'

export const SettingsAppearanceView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8 pb-8">
      <PageTitle
        title={t('settingsView_title')}
        subtitle={t('settings_subsection_appearance_title')}
      />

      <div className="mt-6 max-w-2xl space-y-6">
        <SettingsCard
          title={t('settings_appearance_theme_card_title', 'Theme')}
          description={t(
            'settings_appearance_theme_card_description',
            'Customize the look and feel of the application'
          )}
        >
          <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-mako-400">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300 dark:text-mako-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <p className="mt-2">{t('settings_appearance_coming_soon', 'Coming soon')}</p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </main>
  )
}
