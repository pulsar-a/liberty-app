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
  paginatedContent: PaginatedContent
  lastReadPage: number
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

