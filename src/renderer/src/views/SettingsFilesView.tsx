import { FilePathInput } from '@/components/FilePathInput'
import { useSettings } from '@/hooks/useSettings'
import { SettingKeys, SettingsType } from '@app-types/settings.types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'
import { SettingsRow } from '../components/SettingsRow'

export const SettingsFilesView: React.FC = () => {
  const { t } = useTranslation()
  const { setSetting, getSetting } = useSettings()

  const [fileSettings, setFileSettings] = useState<Pick<SettingsType, 'userFilesDir'>>({
    userFilesDir: '',
  })

  useEffect(() => {
    setFileSettings({
      userFilesDir: getSetting('userFilesDir', '') as string,
    })
  }, [])

  const updateSettingField = (field: SettingKeys, value: string) => {
    setFileSettings({
      ...fileSettings,
      [field]: value,
    })

    setSetting(field, value)
  }

  return (
    <main className="px-8 pb-8">
      <PageTitle
        title={t('settingsView_title')}
        subtitle={t('settings_subsection_files_title')}
      />

      <div className="mt-6 max-w-2xl space-y-6">
        <SettingsCard
          title={t('settings_files_storage_card_title', 'File Storage')}
          description={t(
            'settings_files_storage_card_description',
            'Configure where your book files are stored on your computer'
          )}
        >
          <SettingsRow
            label={t('settings_subsection_files_userFilesFolder_label')}
            description={t(
              'settings_files_folder_description',
              'Choose a custom folder for your book collection'
            )}
            vertical
          >
            <FilePathInput
              id="user-upload-path"
              name="user-upload-path"
              placeholder={t('settings_subsection_files_defaultSystemFolder_placeholder')}
              value={fileSettings.userFilesDir}
              onChange={(value) => {
                updateSettingField('userFilesDir', value)
              }}
              className="mt-2"
            />
          </SettingsRow>
        </SettingsCard>
      </div>
    </main>
  )
}
