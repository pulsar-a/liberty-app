import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/PageTitle'
import { SettingsCard } from '../components/SettingsCard'
import { SettingsRow } from '../components/SettingsRow'
import { ReaderEngine, useReaderSettingsStore } from '../store/useReaderSettingsStore'

export const SettingsReadingView: React.FC = () => {
  const { t } = useTranslation()
  const { settings, setEngine } = useReaderSettingsStore()

  const engines: { id: ReaderEngine; name: string; description: string; badge?: string }[] = [
    {
      id: 'wasm',
      name: t('settings_reading_engine_wasm_name', 'WASM Reader'),
      description: t(
        'settings_reading_engine_wasm_description',
        'The standard reader with deterministic layout and native app integration.'
      ),
    },
    {
      id: 'html',
      name: t('settings_reading_engine_html_name', 'HTML Reader'),
      description: t(
        'settings_reading_engine_html_description',
        'Legacy browser-based rendering retained as a compatibility fallback.'
      ),
      badge: t('settings_reading_engine_legacy', 'Legacy'),
    },
  ]

  return (
    <main className="px-8 pb-8">
      <PageTitle
        title={t('settingsView_title')}
        subtitle={t('settings_subsection_reading_title')}
      />

      <div className="mt-6 max-w-2xl space-y-6">
        <SettingsCard
          title={t('settings_reading_engine_card_title', 'Reader Engine')}
          description={t(
            'settings_reading_engine_card_description',
            'Choose the rendering engine for displaying book content'
          )}
        >
          <SettingsRow
            label={t('settings_reading_engine_label', 'Rendering Engine')}
            description={t(
              'settings_reading_engine_description',
              'Select how book content is rendered on screen'
            )}
            vertical
          >
            <div className="mt-3 space-y-2">
              {engines.map((engine) => (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setEngine(engine.id)}
                  className={clsx(
                    'w-full rounded-lg border-2 p-4 text-left transition-all',
                    settings.engine === engine.id
                      ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-mako-700 dark:bg-mako-900/50 dark:hover:border-mako-600 dark:hover:bg-mako-800/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'text-sm font-semibold',
                        settings.engine === engine.id
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {engine.name}
                    </span>
                    {engine.badge && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        {engine.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={clsx(
                      'mt-1 text-sm',
                      settings.engine === engine.id
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-mako-400'
                    )}
                  >
                    {engine.description}
                  </p>
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsCard>
      </div>
    </main>
  )
}
