import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Reader theme presets
 */
export type ReaderTheme = 'warm' | 'cool' | 'sepia' | 'white' | 'night'

/**
 * Font family options for the reader
 */
export type ReaderFontFamily = 
  | 'Georgia'
  | 'Merriweather'
  | 'Lora'
  | 'Crimson Text'
  | 'Source Serif Pro'
  | 'system-ui'

/**
 * Reader typography and layout settings
 */
export interface ReaderSettings {
  // Typography
  fontFamily: ReaderFontFamily
  fontSize: number // in rem (e.g., 1.125)
  lineHeight: number // unitless (e.g., 1.8)
  
  // Layout
  contentPaddingX: number // in rem
  contentPaddingY: number // in rem
  maxContentWidth: number // in rem
  
  // Theme
  theme: ReaderTheme
  
  // Advanced
  textAlign: 'left' | 'justify'
  hyphenation: boolean
  paragraphSpacing: number // in em
  paragraphIndent: number // in em
}

interface ReaderSettingsState {
  settings: ReaderSettings
}

interface ReaderSettingsActions {
  // Individual setters
  setFontFamily: (fontFamily: ReaderFontFamily) => void
  setFontSize: (fontSize: number) => void
  setLineHeight: (lineHeight: number) => void
  setContentPaddingX: (padding: number) => void
  setContentPaddingY: (padding: number) => void
  setMaxContentWidth: (width: number) => void
  setTheme: (theme: ReaderTheme) => void
  setTextAlign: (align: 'left' | 'justify') => void
  setHyphenation: (enabled: boolean) => void
  setParagraphSpacing: (spacing: number) => void
  setParagraphIndent: (indent: number) => void
  
  // Bulk update
  updateSettings: (settings: Partial<ReaderSettings>) => void
  
  // Reset to defaults
  resetSettings: () => void
  
  // Get CSS variables object for applying to DOM
  getCssVariables: () => Record<string, string>
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'Georgia',
  fontSize: 1.125, // 18px at default root
  lineHeight: 1.8,
  contentPaddingX: 3, // rem
  contentPaddingY: 2.5, // rem
  maxContentWidth: 42, // rem
  theme: 'warm',
  textAlign: 'justify',
  hyphenation: true,
  paragraphSpacing: 1.25, // em
  paragraphIndent: 1.5, // em
}

export const useReaderSettingsStore = create<ReaderSettingsState & ReaderSettingsActions>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },

      setFontFamily: (fontFamily) =>
        set((state) => ({
          settings: { ...state.settings, fontFamily },
        })),

      setFontSize: (fontSize) =>
        set((state) => ({
          settings: { ...state.settings, fontSize: Math.max(0.75, Math.min(2, fontSize)) },
        })),

      setLineHeight: (lineHeight) =>
        set((state) => ({
          settings: { ...state.settings, lineHeight: Math.max(1.2, Math.min(3, lineHeight)) },
        })),

      setContentPaddingX: (contentPaddingX) =>
        set((state) => ({
          settings: { ...state.settings, contentPaddingX: Math.max(0.5, Math.min(6, contentPaddingX)) },
        })),

      setContentPaddingY: (contentPaddingY) =>
        set((state) => ({
          settings: { ...state.settings, contentPaddingY: Math.max(0.5, Math.min(6, contentPaddingY)) },
        })),

      setMaxContentWidth: (maxContentWidth) =>
        set((state) => ({
          settings: { ...state.settings, maxContentWidth: Math.max(20, Math.min(80, maxContentWidth)) },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      setTextAlign: (textAlign) =>
        set((state) => ({
          settings: { ...state.settings, textAlign },
        })),

      setHyphenation: (hyphenation) =>
        set((state) => ({
          settings: { ...state.settings, hyphenation },
        })),

      setParagraphSpacing: (paragraphSpacing) =>
        set((state) => ({
          settings: { ...state.settings, paragraphSpacing: Math.max(0, Math.min(3, paragraphSpacing)) },
        })),

      setParagraphIndent: (paragraphIndent) =>
        set((state) => ({
          settings: { ...state.settings, paragraphIndent: Math.max(0, Math.min(4, paragraphIndent)) },
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: { ...DEFAULT_SETTINGS } }),

      getCssVariables: () => {
        const { settings } = get()
        return {
          '--page-font-family': `"${settings.fontFamily}", serif`,
          '--page-font-size': `${settings.fontSize}rem`,
          '--page-line-height': `${settings.lineHeight}`,
          '--page-padding-x': `${settings.contentPaddingX}rem`,
          '--page-padding-y': `${settings.contentPaddingY}rem`,
          '--page-max-width': `${settings.maxContentWidth}rem`,
          '--page-text-align': settings.textAlign,
          '--page-hyphens': settings.hyphenation ? 'auto' : 'none',
          '--page-paragraph-spacing': `${settings.paragraphSpacing}em`,
          '--page-paragraph-indent': `${settings.paragraphIndent}em`,
        }
      },
    }),
    {
      name: 'liberty-reader-settings',
    }
  )
)

// Selector hooks for optimized re-renders
export const useReaderFontFamily = () => useReaderSettingsStore((state) => state.settings.fontFamily)
export const useReaderFontSize = () => useReaderSettingsStore((state) => state.settings.fontSize)
export const useReaderLineHeight = () => useReaderSettingsStore((state) => state.settings.lineHeight)
export const useReaderTheme = () => useReaderSettingsStore((state) => state.settings.theme)
export const useReaderCssVariables = () => useReaderSettingsStore((state) => state.getCssVariables())

