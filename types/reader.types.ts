/**
 * Reader Types
 * Type definitions for the book reader functionality
 */

// ============================================================================
// Table of Contents Types
// ============================================================================

export interface TocEntry {
  id: string
  title: string
  href: string
  order: number
  level: number
  children?: TocEntry[]
}

// ============================================================================
// Book Content Types
// ============================================================================

export interface BookChapter {
  id: string
  title: string
  htmlContent: string
  order: number
  href: string
}

export interface BookReference {
  id: string
  marker: string // e.g., "[1]" or "*"
  content: string // The footnote/endnote text
  chapterId: string
}

export interface BookContent {
  bookId: number
  chapters: BookChapter[]
  references: BookReference[]
  tableOfContents: TocEntry[]
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PageBoundary {
  pageIndex: number
  chapterId: string
  chapterTitle: string
  startOffset: number
  endOffset: number
}

export interface PaginatedContent {
  pages: BookPage[]
  totalPages: number
  pageBoundaries: PageBoundary[]
}

export interface BookPage {
  pageIndex: number
  chapterId: string
  chapterTitle: string
  htmlContent: string
  references: BookReference[]
}

export interface PaginationConfig {
  mode: 'single' | 'two-column'
  charsPerPage: number
  containerWidth?: number
  containerHeight?: number
}

// ============================================================================
// Bookmark Types
// ============================================================================

export interface Bookmark {
  id: number
  bookId: number
  chapterId: string
  pageIndex: number
  label: string | null
  selectedText: string | null
  createdAt: Date
}

export interface CreateBookmarkInput {
  bookId: number
  chapterId: string
  pageIndex: number
  label?: string
  selectedText?: string
}

// ============================================================================
// Reader State Types
// ============================================================================

export interface ReaderState {
  // Book data
  bookId: number | null
  bookTitle: string
  bookAuthor: string
  content: BookContent | null
  paginatedContent: PaginatedContent | null

  // Navigation state
  currentPageIndex: number
  currentChapterId: string | null
  totalPages: number

  // UI state
  layoutMode: 'single' | 'two-column'
  isLoading: boolean
  error: string | null

  // References panel
  isReferencesPanelOpen: boolean
  currentPageReferences: BookReference[]

  // Sidebar
  sidebarTab: 'contents' | 'bookmarks'
  bookmarks: Bookmark[]
}

export interface ReaderActions {
  // Initialization
  loadBook: (bookId: number) => Promise<void>
  unloadBook: () => void

  // Navigation
  goToPage: (pageIndex: number) => void
  nextPage: () => void
  previousPage: () => void
  goToChapter: (chapterId: string) => void

  // Layout
  setLayoutMode: (mode: 'single' | 'two-column') => void

  // References
  openReferencesPanel: () => void
  closeReferencesPanel: () => void

  // Bookmarks
  addBookmark: (input: Omit<CreateBookmarkInput, 'bookId'>) => Promise<void>
  removeBookmark: (bookmarkId: number) => Promise<void>
  loadBookmarks: () => Promise<void>

  // Sidebar
  setSidebarTab: (tab: 'contents' | 'bookmarks') => void

  // Progress
  saveProgress: () => Promise<void>
}

// ============================================================================
// IPC Request/Response Types
// ============================================================================

export interface GetBookContentRequest {
  bookId: number
  paginationConfig?: PaginationConfig
}

export interface GetBookContentResponse {
  content: BookContent
  paginatedContent: PaginatedContent | null
  lastReadPage: number
  /** If true, pagination was skipped and client should handle it */
  clientSidePagination?: boolean
}

export interface UpdateReadingProgressRequest {
  bookId: number
  currentPage: number
  totalPages: number
}

export interface GetBookmarksRequest {
  bookId: number
}

export interface CreateBookmarkRequest extends CreateBookmarkInput {}

export interface DeleteBookmarkRequest {
  bookmarkId: number
}

// ============================================================================
// Content Fitting Types (Client-Side Pagination)
// ============================================================================

/**
 * Reader theme presets
 */
export type ReaderThemePreset = 'warm' | 'cool' | 'sepia' | 'white' | 'night'

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
 * Reader typography and layout settings used for content fitting
 */
export interface ReaderTypographySettings {
  fontFamily: ReaderFontFamily
  fontSize: number // in rem
  lineHeight: number // unitless
  contentPaddingX: number // in rem
  contentPaddingY: number // in rem
  maxContentWidth: number // in rem
  textAlign: 'left' | 'justify'
  hyphenation: boolean
  paragraphSpacing: number // in em
  paragraphIndent: number // in em
}

/**
 * Container dimensions for content fitting calculations
 */
export interface ContainerDimensions {
  width: number // in pixels
  height: number // in pixels
}

/**
 * Configuration for the content fitter
 */
export interface FittingConfig {
  containerDimensions: ContainerDimensions
  settings: ReaderTypographySettings
  layoutMode: 'single' | 'two-column'
}

/**
 * Types of content segments that can be identified in HTML
 */
export type ContentSegmentType =
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'list'
  | 'listItem'
  | 'image'
  | 'figure'
  | 'codeBlock'
  | 'table'
  | 'hr'
  | 'unknown'

/**
 * A segment of content that represents an atomic unit for pagination.
 * These segments should not be broken across pages when possible.
 */
export interface ContentSegment {
  id: string
  type: ContentSegmentType
  htmlContent: string
  textContent: string
  // Measured dimensions (populated during fitting)
  measuredHeight?: number
  // For images
  imageData?: {
    src: string
    naturalWidth: number
    naturalHeight: number
    scaledWidth: number
    scaledHeight: number
  }
  // For headings - level (1-6)
  headingLevel?: number
  // Should this segment stay with the next one (e.g., heading with paragraph)
  keepWithNext?: boolean
}

/**
 * Result of parsing HTML into segments
 */
export interface ParsedChapterContent {
  chapterId: string
  chapterTitle: string
  segments: ContentSegment[]
  references: BookReference[]
}

/**
 * Image dimension data for preloading
 */
export interface ImageDimension {
  src: string
  naturalWidth: number
  naturalHeight: number
  loaded: boolean
  error?: string
}

/**
 * Result of content fitting for a single page
 */
export interface FittedPage {
  pageIndex: number
  chapterId: string
  chapterTitle: string
  segments: ContentSegment[]
  htmlContent: string
  references: BookReference[]
  // Fitting metadata
  measuredHeight: number
  availableHeight: number
  overflow: boolean
}

/**
 * Result of fitting all content
 */
export interface FittedContent {
  pages: FittedPage[]
  totalPages: number
  fittingConfig: FittingConfig
}

/**
 * Callback for progress updates during content fitting
 */
export type FittingProgressCallback = (progress: {
  phase: 'parsing' | 'measuring' | 'fitting' | 'complete'
  percent: number
  currentChapter?: string
  totalChapters?: number
  currentChapterIndex?: number
}) => void

