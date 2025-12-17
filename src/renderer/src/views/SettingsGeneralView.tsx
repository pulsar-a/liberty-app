import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../components/LanguageSelector'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'

export const SettingsGeneralView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="px-8 pb-8">
      <PageTitle
        title={t('settingsView_title')}
        subtitle={t('settings_subsection_general_title')}
      />

      <div className="mt-6 max-w-2xl space-y-6">
        <SettingsCard
          title={t('settings_general_language_card_title', 'Language & Region')}
          description={t(
            'settings_general_language_card_description',
            'Configure your preferred language and regional settings'
          )}
        >
          <LanguageSelector />
        </SettingsCard>
      </div>
    </main>
  )
}
