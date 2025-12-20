/**
 * Types for the WASM Reader module
 */

/**
 * RGBA color for WASM settings
 */
export interface WasmColor {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Text alignment options
 */
export type WasmTextAlign = 'left' | 'right' | 'center' | 'justify'

/**
 * Reader settings passed to WASM module
 * All measurements are in pixels (converted from rem/em in TypeScript)
 */
export interface WasmReaderSettings {
  // Typography
  fontFamily: string
  fontSize: number        // pixels
  lineHeight: number      // multiplier (1.0 - 2.5)
  letterSpacing: number   // pixels

  // Layout
  paddingX: number        // pixels
  paddingY: number        // pixels
  textAlign: WasmTextAlign
  paragraphIndent: number // pixels
  paragraphSpacing: number // pixels
  maxContentWidth: number // pixels (0 = no limit)
  
  // Column layout
  columns: number         // 1 or 2
  columnGap: number       // pixels (gap between columns)

  // Theme colors
  backgroundColor: WasmColor
  textColor: WasmColor
  linkColor: WasmColor
  headingColor: WasmColor

  // Advanced
  hyphenation: boolean
}

/**
 * Result from loading a book
 */
export interface WasmLoadBookResult {
  loaded: boolean
  chapterCount: number
}

/**
 * Result from pagination
 */
export interface WasmPaginationResult {
  totalPages: number
  pageChapterMap: Array<{
    pageIndex: number
    chapterId: string
    chapterTitle: string
  }>
}

/**
 * Result from settings update
 */
export interface WasmSettingsUpdateResult {
  totalPages: number
  repaginated: boolean
}

/**
 * Chapter info for a page
 */
export interface WasmPageChapter {
  chapterId: string
  chapterTitle: string
}

/**
 * Search result
 */
export interface WasmSearchResult {
  pageIndex: number
  chapterId: string
  chapterTitle: string
  snippet: string
  matchStart: number
  matchEnd: number
}

/**
 * Font to load into the WASM module
 */
export interface FontToLoad {
  name: string
  url: string
}

/**
 * Default fonts bundled with the reader
 * These must match the actual font files in src/renderer/src/assets/fonts/reading/
 */
export const DEFAULT_READER_FONTS: FontToLoad[] = [
  { name: 'Literata', url: '/fonts/reading/Literata_18pt-Regular.ttf' },
  { name: 'Literata-Bold', url: '/fonts/reading/Literata_18pt-Bold.ttf' },
  { name: 'Literata-Italic', url: '/fonts/reading/Literata_18pt-Italic.ttf' },
  { name: 'Literata-BoldItalic', url: '/fonts/reading/Literata_18pt-BoldItalic.ttf' },
]

/**
 * Theme color presets - matching READER_THEMES from useReaderSettingsStore
 */
export const WASM_THEME_COLORS = {
  // Light theme: #ffffff bg, #2c2c2c text
  light: {
    backgroundColor: { r: 255, g: 255, b: 255, a: 255 },
    textColor: { r: 44, g: 44, b: 44, a: 255 },
    linkColor: { r: 37, g: 99, b: 235, a: 255 },
    headingColor: { r: 28, g: 28, b: 28, a: 255 },
  },
  // Warm theme: #f5f1e8 bg, #2c2c2c text
  warm: {
    backgroundColor: { r: 245, g: 241, b: 232, a: 255 },
    textColor: { r: 44, g: 44, b: 44, a: 255 },
    linkColor: { r: 59, g: 130, b: 246, a: 255 },
    headingColor: { r: 30, g: 28, b: 25, a: 255 },
  },
  // Sepia theme: #f4ecd8 bg, #5c4b37 text
  sepia: {
    backgroundColor: { r: 244, g: 236, b: 216, a: 255 },
    textColor: { r: 92, g: 75, b: 55, a: 255 },
    linkColor: { r: 139, g: 90, b: 43, a: 255 },
    headingColor: { r: 68, g: 51, b: 34, a: 255 },
  },
  // Dark theme: #1f1f1f bg, #e8e8e8 text
  dark: {
    backgroundColor: { r: 31, g: 31, b: 31, a: 255 },
    textColor: { r: 232, g: 232, b: 232, a: 255 },
    linkColor: { r: 96, g: 165, b: 250, a: 255 },
    headingColor: { r: 245, g: 245, b: 245, a: 255 },
  },
  // Night theme: #1a1a1a bg, #c4c4c4 text
  night: {
    backgroundColor: { r: 26, g: 26, b: 26, a: 255 },
    textColor: { r: 196, g: 196, b: 196, a: 255 },
    linkColor: { r: 96, g: 165, b: 250, a: 255 },
    headingColor: { r: 220, g: 220, b: 220, a: 255 },
  },
  // High contrast light: #ffffff bg, #000000 text
  'high-contrast-light': {
    backgroundColor: { r: 255, g: 255, b: 255, a: 255 },
    textColor: { r: 0, g: 0, b: 0, a: 255 },
    linkColor: { r: 0, g: 0, b: 200, a: 255 },
    headingColor: { r: 0, g: 0, b: 0, a: 255 },
  },
  // High contrast dark: #000000 bg, #ffffff text
  'high-contrast-dark': {
    backgroundColor: { r: 0, g: 0, b: 0, a: 255 },
    textColor: { r: 255, g: 255, b: 255, a: 255 },
    linkColor: { r: 100, g: 180, b: 255, a: 255 },
    headingColor: { r: 255, g: 255, b: 255, a: 255 },
  },
} as const

export type WasmThemeName = keyof typeof WASM_THEME_COLORS

