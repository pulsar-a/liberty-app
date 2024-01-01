import { FilePathInput } from '@/components/FilePathInput'
import { useSettings } from '@/hooks/useSettings'
import { SettingKeys, SettingsType } from '@app-types/settings.types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
    <main>
      <h2 className="px-8 pb-8 text-2xl font-semibold">{t('settings_subsection_files_title')}</h2>
      <div className="divide-y divide-white/5">
        <div className="grid grid-cols-3 gap-x-8 gap-y-10 px-8">
          <form className="col-span-2">
            <div className="grid grid-cols-6 gap-x-6 gap-y-8">
              <div className="col-span-full">
                <FilePathInput
                  id="user-upload-path"
                  name="user-upload-path"
                  label={t('settings_subsection_files_userFilesFolder_label')}
                  placeholder={t('settings_subsection_files_defaultSystemFolder_placeholder')}
                  value={fileSettings.userFilesDir}
                  onChange={(value) => {
                    updateSettingField('userFilesDir', value)
                  }}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
