import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'

export const SettingsAboutView: React.FC = () => {
  const { t } = useTranslation()

  const credits = [
    {
      text: 'Image by kjpargeter',
      url: 'https://www.freepik.com/free-photo/vintage-grunge-paper-background_5405364.htm',
    },
    {
      text: 'Image by efe_madrid',
      url: 'https://www.freepik.com/free-photo/sepia-plasterboard-texture_17556731.htm',
    },
    {
      text: 'Image by efe_madrid',
      url: 'https://www.freepik.com/free-photo/paperboard-texture_4896372.htm',
    },
    {
      text: 'Image by kues1',
      url: 'https://www.freepik.com/free-photo/smooth-white-stucco-wall_1037198.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-vector/blank-cream-notepaper-design_13311373.htm',
    },
    {
      text: 'Image by vector_corp',
      url: 'https://www.freepik.com/free-photo/fabric-texture-background_17197741.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/black-concrete-textured-background_19140670.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/dark-blue-plain-textured-background-fabric-block-prints_16463853.htm',
    },
    {
      text: 'Image by nikitabuida',
      url: 'https://www.freepik.com/free-photo/textile-material-texture_1204762.htm',
    },
    {
      text: 'Image by kjpargeter',
      url: 'https://www.freepik.com/free-photo/grunge-with-decorative-frame_12570147.htm',
    },
    {
      text: 'Image by Freepik',
      url: 'https://www.freepik.com/free-photo/top-view-leather-texture-background_12095498.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/pink-leather-grain-texture_4640671.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/dark-green-creased-leather-textured-background_17119408.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/blue-creased-leather-textured-background_17850335.htm',
    },
    {
      text: 'Image by rawpixel.com',
      url: 'https://www.freepik.com/free-photo/brown-creased-leather-textured-background_16015633.htm',
    },
    {
      text: 'Image by Freepik',
      url: 'https://www.freepik.com/free-photo/notebook-with-black-cover_2273861.htm',
    },
  ]

  return (
    <main className="px-8 pb-8">
      <PageTitle title={t('settingsView_title')} subtitle={t('settings_subsection_about_title')} />

      <div className="mt-6 max-w-2xl space-y-6">
        <SettingsCard
          title={t('settings_about_app_card_title', 'About Liberty')}
          description={t('settings_about_app_card_description', 'Application information')}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-mako-300">
                {t('settings_about_developer', 'Developer')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Garfild</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-mako-300">
                {t('settings_about_year', 'Year')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                2023-{new Date().getFullYear()}
              </span>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title={t('settings_about_credits_card_title', 'Credits')}
          description={t(
            'settings_about_credits_card_description',
            'Third-party assets used in this application'
          )}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {credits.map((credit, index) => (
              <a
                key={index}
                href={credit.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 dark:text-mako-300 dark:hover:bg-mako-800/50 dark:hover:text-indigo-400"
              >
                <span className="truncate">{credit.text}</span>
                <svg
                  className="ml-auto h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </SettingsCard>
      </div>
    </main>
  )
}
