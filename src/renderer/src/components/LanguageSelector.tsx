import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/Select'

export const LanguageSelector: React.FC = () => {
  const {
    i18n: { changeLanguage, language },
  } = useTranslation()

  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(language)

  const items = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
  ]

  const handleLanguageChange = (value: string | undefined) => {
    changeLanguage(value)
    setSelectedLanguage(value)
  }

  return (
    <div>
      <Select options={items} value={selectedLanguage} onChange={handleLanguageChange} />
    </div>
  )
}
