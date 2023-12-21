import { LanguageSelector } from '@/components/LanguageSelector'
import { useTranslation } from 'react-i18next'

export const SettingsView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="text-3xl">{t('settingsView_title')}</div>
      <div>
        <LanguageSelector />
      </div>
    </div>
  )
}
