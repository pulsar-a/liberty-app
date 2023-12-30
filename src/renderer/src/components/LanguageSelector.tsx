import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../hooks/useSettings'
import { Select } from './Select'

export const LanguageSelector: React.FC = () => {
  const {
    i18n: { changeLanguage, language },
    t,
  } = useTranslation()

  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(language)
  const { getSetting, setSetting } = useSettings()

  const items = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
    { label: 'Deutsch', value: 'de' },
  ]

  useEffect(() => {
    setSelectedLanguage(getSetting('language') as string)
  }, [])

  const handleLanguageChange = async (value: string | undefined) => {
    setSelectedLanguage(value)
    setSetting('language', value || 'en')
    changeLanguage(value)
  }

  return (
    <div>
      <Select
        options={items}
        value={selectedLanguage}
        label={t('settingsView_config_language_title')}
        onChange={handleLanguageChange}
      />
    </div>
  )
}
