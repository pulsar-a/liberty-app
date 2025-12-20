import { useTranslation } from 'react-i18next'
import { useSettings } from '../hooks/useSettings'
import { LanguageSelector } from '../components/LanguageSelector'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'
import { SettingsRow } from '../components/SettingsRow'
import { Toggle } from '../components/Toggle'

export const SettingsGeneralView: React.FC = () => {
  const { t } = useTranslation()
  const { getSetting, setSetting } = useSettings()

  const confirmRemoveFromCollection = getSetting('confirmRemoveFromCollection', true) as boolean

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

        <SettingsCard
          title={t('settings_general_confirmations_card_title', 'Confirmations')}
          description={t(
            'settings_general_confirmations_card_description',
            'Control when confirmation dialogs are shown'
          )}
        >
          <SettingsRow
            label={t(
              'settings_general_confirmRemoveFromCollection_label',
              'Ask for confirmation to remove book from collection'
            )}
          >
            <Toggle
              value={confirmRemoveFromCollection}
              onChange={(value) => setSetting('confirmRemoveFromCollection', value)}
            />
          </SettingsRow>
        </SettingsCard>
      </div>
    </main>
  )
}
