import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/Select'
import { useSettings } from '../hooks/useSettings'

export const LanguageSelector: React.FC = () => {
  const {
    i18n: { changeLanguage, language },
    t,
  } = useTranslation()
  const settings = useSettings()

  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(language)

  const items = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
  ]

  const handleLanguageChange = (value: string | undefined) => {
    changeLanguage(value)
    setSelectedLanguage(value)
    settings.set('language', value || 'en')
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
