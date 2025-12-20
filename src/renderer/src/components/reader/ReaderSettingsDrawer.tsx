import { faColumns, faFileAlt, faMinus, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import {
  READER_FONTS,
  READER_THEMES,
  ReaderFontFamily,
  ReaderTheme,
  useReaderSettingsStore,
} from '../../store/useReaderSettingsStore'
import { useReaderStore } from '../../store/useReaderStore'

interface ReaderSettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export const ReaderSettingsDrawer: React.FC<ReaderSettingsDrawerProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const {
    settings,
    setFontFamily,
    setTheme,
    setFontSize,
    setLineHeight,
    setContentPaddingX,
    setContentPaddingY,
    setMaxContentWidth,
    setEngine,
  } = useReaderSettingsStore()
  
  const { layoutMode, setLayoutMode, clearFittedContent } = useReaderStore()

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.round((settings.fontSize + delta) * 1000) / 1000
    setFontSize(newSize)
    clearFittedContent() // Trigger re-pagination with new font size
  }

  const handleLineHeightChange = (delta: number) => {
    const newHeight = Math.round((settings.lineHeight + delta) * 10) / 10
    setLineHeight(newHeight)
    clearFittedContent() // Trigger re-pagination with new line height
  }

  const handlePaddingChange = (delta: number) => {
    const newPaddingX = Math.round((settings.contentPaddingX + delta) * 10) / 10
    const newPaddingY = Math.round((settings.contentPaddingY + delta * 0.8) * 10) / 10 // Y padding slightly less
    setContentPaddingX(newPaddingX)
    setContentPaddingY(newPaddingY)
    clearFittedContent() // Trigger re-pagination with new margins
  }

  const handleWidthChange = (delta: number) => {
    const newWidth = Math.round((settings.maxContentWidth + delta) * 10) / 10
    setMaxContentWidth(newWidth)
    clearFittedContent() // Trigger re-pagination with new width
  }

  return (
    <Transition show={open} as={Fragment}>
      {/* Drawer panel - no backdrop for live preview */}
      <Transition.Child
        as={Fragment}
        enter="transform transition ease-out duration-300"
        enterFrom="translate-y-full"
        enterTo="translate-y-0"
        leave="transform transition ease-in duration-200"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-full"
      >
        <div className="pointer-events-none fixed bottom-7 left-[calc(15rem+14rem)] right-0 z-50">
          <div className="pointer-events-auto rounded-t-xl border-t border-x border-gray-300 bg-white shadow-2xl dark:border-gray-700 dark:bg-bright-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('reader_settings_title', 'Reader Settings')}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-6">
                  {/* Font Selection */}
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('reader_settings_font', 'Font')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {READER_FONTS.map((font) => (
                        <FontButton
                          key={font.id}
                          fontId={font.id}
                          fontName={font.name}
                          isActive={settings.fontFamily === font.id}
                          onClick={() => setFontFamily(font.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div className="min-w-[200px]">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('reader_settings_theme', 'Theme')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {READER_THEMES.map((theme) => (
                        <ThemeSwatch
                          key={theme.id}
                          theme={theme}
                          isActive={settings.theme === theme.id}
                          onClick={() => setTheme(theme.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Typography Controls - responsive grid */}
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">
                    {/* Font Size */}
                    <div className="min-w-[100px]">
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('reader_settings_size', 'Size')}
                      </label>
                      <StepperControl
                        value={`${Math.round(settings.fontSize * 16)}px`}
                        onDecrement={() => handleFontSizeChange(-0.125)}
                        onIncrement={() => handleFontSizeChange(0.125)}
                        decrementDisabled={settings.fontSize <= 0.75}
                        incrementDisabled={settings.fontSize >= 2}
                      />
                    </div>

                    {/* Line Height */}
                    <div className="min-w-[100px]">
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('reader_settings_spacing', 'Spacing')}
                      </label>
                      <StepperControl
                        value={settings.lineHeight.toFixed(1)}
                        onDecrement={() => handleLineHeightChange(-0.1)}
                        onIncrement={() => handleLineHeightChange(0.1)}
                        decrementDisabled={settings.lineHeight <= 1.2}
                        incrementDisabled={settings.lineHeight >= 3}
                      />
                    </div>

                    {/* Padding */}
                    <div className="min-w-[100px]">
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('reader_settings_margins', 'Margins')}
                      </label>
                      <StepperControl
                        value={`${Math.round(settings.contentPaddingX * 16)}px`}
                        onDecrement={() => handlePaddingChange(-1)}
                        onIncrement={() => handlePaddingChange(1)}
                        decrementDisabled={settings.contentPaddingX <= 0}
                        incrementDisabled={settings.contentPaddingX >= 8}
                      />
                    </div>

                    {/* Max Width */}
                    <div className="min-w-[100px]">
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('reader_settings_width', 'Width')}
                      </label>
                      <StepperControl
                        value={settings.maxContentWidth >= 100 ? 'Full' : `${Math.round(settings.maxContentWidth * 16)}px`}
                        onDecrement={() => handleWidthChange(-4)}
                        onIncrement={() => handleWidthChange(4)}
                        decrementDisabled={settings.maxContentWidth <= 30}
                        incrementDisabled={settings.maxContentWidth >= 100}
                      />
                    </div>
                  </div>

                  {/* Layout */}
                  <div className="min-w-[100px]">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('reader_settings_layout', 'Layout')}
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLayoutMode('single')
                          clearFittedContent()
                        }}
                        className={clsx(
                          'flex h-8 w-10 items-center justify-center rounded-md transition-colors',
                          layoutMode === 'single'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        )}
                        title={t('reader_settings_single_column', 'Single column')}
                      >
                        <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLayoutMode('two-column')
                          clearFittedContent()
                        }}
                        className={clsx(
                          'flex h-8 w-10 items-center justify-center rounded-md transition-colors',
                          layoutMode === 'two-column'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        )}
                        title={t('reader_settings_two_columns', 'Two columns')}
                      >
                        <FontAwesomeIcon icon={faColumns} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rendering Engine */}
                  <div className="min-w-[100px]">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('reader_settings_engine', 'Engine')}
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEngine('wasm')}
                        className={clsx(
                          'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                          settings.engine === 'wasm'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        )}
                        title={t('reader_settings_engine_wasm', 'WASM canvas renderer - faster, consistent')}
                      >
                        WASM
                      </button>
                      <button
                        type="button"
                        onClick={() => setEngine('html')}
                        className={clsx(
                          'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                          settings.engine === 'html'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        )}
                        title={t('reader_settings_engine_html', 'HTML DOM renderer - traditional')}
                      >
                        HTML
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition.Child>
    </Transition>
  )
}

// Font Button Component
interface FontButtonProps {
  fontId: ReaderFontFamily
  fontName: string
  isActive: boolean
  onClick: () => void
}

const FontButton: React.FC<FontButtonProps> = ({ fontId, fontName, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-md px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      )}
      style={{ fontFamily: fontId === 'system-ui' ? 'system-ui' : `"${fontId}", serif` }}
    >
      {fontName}
    </button>
  )
}

// Theme Swatch Component
interface ThemeSwatchProps {
  theme: { id: ReaderTheme; name: string; backgroundColor: string; textColor: string }
  isActive: boolean
  onClick: () => void
}

const ThemeSwatch: React.FC<ThemeSwatchProps> = ({ theme, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
        isActive
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
      )}
      style={{ backgroundColor: theme.backgroundColor }}
      title={theme.name}
    >
      <span
        className="text-xs font-bold"
        style={{ color: theme.textColor }}
      >
        Aa
      </span>
    </button>
  )
}

// Stepper Control Component
interface StepperControlProps {
  value: string
  onDecrement: () => void
  onIncrement: () => void
  decrementDisabled?: boolean
  incrementDisabled?: boolean
}

const StepperControl: React.FC<StepperControlProps> = ({
  value,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
}) => {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button
        type="button"
        onClick={onDecrement}
        disabled={decrementDisabled}
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors sm:h-8 sm:w-8',
          decrementDisabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
      </button>
      <span className="min-w-[2.75rem] text-center text-xs font-medium text-gray-900 sm:min-w-[3.5rem] sm:text-sm dark:text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={incrementDisabled}
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors sm:h-8 sm:w-8',
          incrementDisabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        )}
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
      </button>
    </div>
  )
}

