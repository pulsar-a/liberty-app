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
 * Theme color presets
 */
export const WASM_THEME_COLORS = {
  warm: {
    backgroundColor: { r: 253, g: 251, b: 247, a: 255 },
    textColor: { r: 45, g: 42, b: 38, a: 255 },
    linkColor: { r: 59, g: 130, b: 246, a: 255 },
    headingColor: { r: 30, g: 28, b: 25, a: 255 },
  },
  cool: {
    backgroundColor: { r: 248, g: 250, b: 252, a: 255 },
    textColor: { r: 30, g: 41, b: 59, a: 255 },
    linkColor: { r: 37, g: 99, b: 235, a: 255 },
    headingColor: { r: 15, g: 23, b: 42, a: 255 },
  },
  sepia: {
    backgroundColor: { r: 249, g: 241, b: 228, a: 255 },
    textColor: { r: 68, g: 51, b: 34, a: 255 },
    linkColor: { r: 139, g: 90, b: 43, a: 255 },
    headingColor: { r: 51, g: 38, b: 25, a: 255 },
  },
  white: {
    backgroundColor: { r: 255, g: 255, b: 255, a: 255 },
    textColor: { r: 33, g: 33, b: 33, a: 255 },
    linkColor: { r: 25, g: 118, b: 210, a: 255 },
    headingColor: { r: 17, g: 17, b: 17, a: 255 },
  },
  night: {
    backgroundColor: { r: 26, g: 26, b: 31, a: 255 },
    textColor: { r: 204, g: 204, b: 209, a: 255 },
    linkColor: { r: 96, g: 165, b: 250, a: 255 },
    headingColor: { r: 229, g: 229, b: 234, a: 255 },
  },
} as const

export type WasmThemeName = keyof typeof WASM_THEME_COLORS

