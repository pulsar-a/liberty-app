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
  const confirmDeleteBook = getSetting('confirmDeleteBook', true) as boolean
  const confirmLastBookFileRemoval = getSetting('confirmLastBookFileRemoval', true) as boolean

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
          <SettingsRow
            label={t(
              'settings_general_confirmDeleteBook_label',
              'Ask for confirmation before deleting a book'
            )}
          >
            <Toggle
              value={confirmDeleteBook}
              onChange={(value) => setSetting('confirmDeleteBook', value)}
            />
          </SettingsRow>
          <SettingsRow
            label={t(
              'settings_general_confirmLastBookFileRemoval_label',
              'Ask what to do when removing the last available book file'
            )}
          >
            <Toggle
              value={confirmLastBookFileRemoval}
              onChange={(value) => {
                if (!value) {
                  setSetting('lastBookFileRemovalAction', 'keepBook')
                }
                setSetting('confirmLastBookFileRemoval', value)
              }}
            />
          </SettingsRow>
        </SettingsCard>
      </div>
    </main>
  )
}
