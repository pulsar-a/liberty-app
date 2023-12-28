import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/Select'
import { useSettingsStore } from '../store/useSettingsStore'
// import { useSettings } from '../hooks/useSettings'

export const LanguageSelector: React.FC = () => {
  const {
    i18n: { changeLanguage, language },
    t,
  } = useTranslation()

  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(language)
  const { settings, setSettingValue } = useSettingsStore()

  const items = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
    { label: 'Deutsch', value: 'de' },
  ]

  useEffect(() => {
    setSelectedLanguage(settings.language || 'en')
  }, [settings.language])

  useEffect(() => {
    console.log('settings.language', settings.language)
    setSelectedLanguage(settings.language || 'en')
  }, [])

  const handleLanguageChange = async (value: string | undefined) => {
    setSelectedLanguage(value)
    await setSettingValue('language', value || 'en')
    changeLanguage(value)
  }

  return (
    <div>
      <div>SELECTED: {selectedLanguage}</div>
      <Select
        options={items}
        value={selectedLanguage}
        label={t('settingsView_config_language_title')}
        onChange={handleLanguageChange}
      />
    </div>
  )
}
