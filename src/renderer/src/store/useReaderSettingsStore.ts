import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Reader theme presets
 */
export type ReaderTheme = 
  | 'light'              // Clean white
  | 'warm'               // Warm beige
  | 'sepia'              // Classic sepia
  | 'dark'               // Dark mode
  | 'night'              // Night mode (lower contrast for night reading)
  | 'high-contrast-light' // High contrast light
  | 'high-contrast-dark'  // High contrast dark

/**
 * Theme configuration for visual display
 */
export interface ReaderThemeConfig {
  id: ReaderTheme
  name: string
  backgroundColor: string
  textColor: string
}

/**
 * Available reader themes with their visual configuration
 */
export const READER_THEMES: ReaderThemeConfig[] = [
  { id: 'light', name: 'Light', backgroundColor: '#ffffff', textColor: '#2c2c2c' },
  { id: 'warm', name: 'Warm', backgroundColor: '#f5f1e8', textColor: '#2c2c2c' },
  { id: 'sepia', name: 'Sepia', backgroundColor: '#f4ecd8', textColor: '#5c4b37' },
  { id: 'dark', name: 'Dark', backgroundColor: '#1f1f1f', textColor: '#e8e8e8' },
  { id: 'night', name: 'Night', backgroundColor: '#1a1a1a', textColor: '#c4c4c4' },
  { id: 'high-contrast-light', name: 'HC Light', backgroundColor: '#ffffff', textColor: '#000000' },
  { id: 'high-contrast-dark', name: 'HC Dark', backgroundColor: '#000000', textColor: '#ffffff' },
]

/**
 * Font family options for the reader
 */
export type ReaderFontFamily = 
  | 'Literata'      // Bundled for WASM reader
  | 'Georgia'
  | 'Merriweather'
  | 'Lora'
  | 'Crimson Text'
  | 'Source Serif Pro'
  | 'system-ui'

/**
 * Available font families for the reader
 */
export const READER_FONTS: { id: ReaderFontFamily; name: string }[] = [
  { id: 'Literata', name: 'Literata' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Merriweather', name: 'Merriweather' },
  { id: 'Lora', name: 'Lora' },
  { id: 'Crimson Text', name: 'Crimson Text' },
  { id: 'Source Serif Pro', name: 'Source Serif' },
  { id: 'system-ui', name: 'System' },
]

/**
 * Base font size in pixels for unit conversions
 */
export const BASE_FONT_SIZE_PX = 16

/**
 * Reader rendering engine
 */
export type ReaderEngine = 'html' | 'wasm'

/**
 * Number of columns for reading layout
 */
export type ReaderColumns = 1 | 2

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
  columns: ReaderColumns // 1 or 2 columns
  columnGap: number // gap between columns in rem (only used when columns = 2)
  
  // Theme
  theme: ReaderTheme
  
  // Advanced
  textAlign: 'left' | 'justify'
  hyphenation: boolean
  paragraphSpacing: number // in em
  paragraphIndent: number // in em

  // Rendering engine (experimental)
  engine: ReaderEngine
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
  setColumns: (columns: ReaderColumns) => void
  setColumnGap: (gap: number) => void
  setTheme: (theme: ReaderTheme) => void
  setTextAlign: (align: 'left' | 'justify') => void
  setHyphenation: (enabled: boolean) => void
  setParagraphSpacing: (spacing: number) => void
  setParagraphIndent: (indent: number) => void
  setEngine: (engine: ReaderEngine) => void
  
  // Bulk update
  updateSettings: (settings: Partial<ReaderSettings>) => void
  
  // Reset to defaults
  resetSettings: () => void
  
  // Get CSS variables object for applying to DOM
  getCssVariables: () => Record<string, string>
  
  // Get settings in pixel values (for WASM reader)
  getPixelValues: () => {
    fontSizePx: number
    paddingXPx: number
    paddingYPx: number
    maxContentWidthPx: number
    paragraphSpacingPx: number
    paragraphIndentPx: number
    columnGapPx: number
  }
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'Literata', // Default to bundled font for WASM
  fontSize: 1.125, // 18px at default root
  lineHeight: 1.8,
  contentPaddingX: 3, // rem
  contentPaddingY: 2.5, // rem
  maxContentWidth: 42, // rem
  columns: 1, // single column by default
  columnGap: 3, // rem gap between columns
  theme: 'warm',
  textAlign: 'justify',
  hyphenation: true,
  paragraphSpacing: 1.25, // em
  paragraphIndent: 1.5, // em
  engine: 'wasm', // Default to WASM for deterministic rendering
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
          settings: { ...state.settings, contentPaddingX: Math.max(0, Math.min(8, contentPaddingX)) },
        })),

      setContentPaddingY: (contentPaddingY) =>
        set((state) => ({
          settings: { ...state.settings, contentPaddingY: Math.max(0, Math.min(8, contentPaddingY)) },
        })),

      setMaxContentWidth: (maxContentWidth) =>
        set((state) => ({
          settings: { ...state.settings, maxContentWidth: Math.max(30, Math.min(100, maxContentWidth)) },
        })),

      setColumns: (columns) =>
        set((state) => ({
          settings: { ...state.settings, columns },
        })),

      setColumnGap: (columnGap) =>
        set((state) => ({
          settings: { ...state.settings, columnGap: Math.max(1, Math.min(6, columnGap)) },
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

      setEngine: (engine) =>
        set((state) => ({
          settings: { ...state.settings, engine },
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
          '--page-max-width': settings.maxContentWidth >= 100 ? 'none' : `${settings.maxContentWidth}rem`,
          '--page-columns': `${settings.columns}`,
          '--page-column-gap': `${settings.columnGap}rem`,
          '--page-text-align': settings.textAlign,
          '--page-hyphens': settings.hyphenation ? 'auto' : 'none',
          '--page-paragraph-spacing': `${settings.paragraphSpacing}em`,
          '--page-paragraph-indent': `${settings.paragraphIndent}em`,
        }
      },

      getPixelValues: () => {
        const { settings } = get()
        const fontSizePx = settings.fontSize * BASE_FONT_SIZE_PX
        return {
          fontSizePx,
          paddingXPx: settings.contentPaddingX * BASE_FONT_SIZE_PX,
          paddingYPx: settings.contentPaddingY * BASE_FONT_SIZE_PX,
          maxContentWidthPx: settings.maxContentWidth * BASE_FONT_SIZE_PX,
          // em values are relative to font size
          paragraphSpacingPx: settings.paragraphSpacing * fontSizePx,
          paragraphIndentPx: settings.paragraphIndent * fontSizePx,
          columnGapPx: settings.columnGap * BASE_FONT_SIZE_PX,
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
export const useReaderColumns = () => useReaderSettingsStore((state) => state.settings.columns)
export const useReaderEngine = () => useReaderSettingsStore((state) => state.settings.engine)
export const useReaderCssVariables = () => useReaderSettingsStore((state) => state.getCssVariables())
export const useReaderPixelValues = () => useReaderSettingsStore((state) => state.getPixelValues())

/**
 * Utility: Convert rem to pixels
 */
export function remToPx(rem: number): number {
  return rem * BASE_FONT_SIZE_PX
}

/**
 * Utility: Convert em to pixels (requires font size in pixels)
 */
export function emToPx(em: number, fontSizePx: number): number {
  return em * fontSizePx
}

