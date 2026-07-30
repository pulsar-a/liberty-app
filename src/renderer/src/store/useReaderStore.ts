import {
  Bookmark,
  BookContent,
  BookPage,
  BookReference,
  ContainerDimensions,
  FittedContent,
  FittedPage,
  PaginatedContent,
} from '@app-types/reader.types'
import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

interface WasmPageChapterLocation {
  pageIndex: number
  chapterId: string
  chapterTitle: string
}

interface WasmChapterLocation {
  chapterId: string
  chapterTitle: string
  firstPageIndex: number
  pageCount: number
}

interface WasmAnchorLocation {
  chapterId: string
  anchorId: string
  pageIndex: number
}

interface ReaderState {
  // Book data
  bookId: number | null
  bookTitle: string
  bookAuthor: string
  content: BookContent | null
  paginatedContent: PaginatedContent | null

  // Client-side pagination (new)
  fittedContent: FittedContent | null
  useClientSidePagination: boolean
  isPaginating: boolean
  containerDimensions: ContainerDimensions | null

  // Navigation state
  currentPageIndex: number
  totalPages: number
  wasmPageChapterMap: WasmPageChapterLocation[]
  wasmChapterPageMap: WasmChapterLocation[]
  wasmAnchorPageMap: WasmAnchorLocation[]

  // UI state
  layoutMode: 'single' | 'two-column'
  isLoading: boolean
  error: string | null

  // Loading progress (0-100)
  loadingProgress: number
  loadingStage: string

  // References panel
  isReferencesPanelOpen: boolean

  // Sidebar
  sidebarTab: 'contents' | 'bookmarks'
  bookmarks: Bookmark[]

  // Progress saving
  progressDirty: boolean
  lastSavedPage: number
}

interface ReaderActions {
  // Initialization
  setBookData: (data: {
    bookId: number
    bookTitle: string
    bookAuthor: string
    content: BookContent
    paginatedContent: PaginatedContent | null
    lastReadPage: number
    clientSidePagination?: boolean
  }) => void
  setLoading: (loading: boolean) => void
  setLoadingProgress: (percent: number, stage: string) => void
  setError: (error: string | null) => void
  resetReader: () => void

  // Client-side pagination
  setFittedContent: (content: FittedContent) => void
  setContainerDimensions: (dimensions: ContainerDimensions) => void
  setIsPaginating: (isPaginating: boolean) => void
  clearFittedContent: () => void

  // Navigation
  goToPage: (pageIndex: number) => void
  nextPage: () => void
  previousPage: () => void
  goToChapter: (chapterId: string, anchorId?: string) => void
  setWasmPaginationMaps: (maps: {
    pageChapterMap: WasmPageChapterLocation[]
    chapterPageMap: WasmChapterLocation[]
    anchorPageMap: WasmAnchorLocation[]
  }) => void
  clearWasmPaginationMaps: () => void

  // Layout
  setLayoutMode: (mode: 'single' | 'two-column') => void

  // References
  openReferencesPanel: () => void
  closeReferencesPanel: () => void
  toggleReferencesPanel: () => void

  // Bookmarks
  setBookmarks: (bookmarks: Bookmark[]) => void
  addBookmarkToState: (bookmark: Bookmark) => void
  removeBookmarkFromState: (bookmarkId: number) => void

  // Sidebar
  setSidebarTab: (tab: 'contents' | 'bookmarks') => void

  // Progress
  markProgressDirty: () => void
  markProgressSaved: () => void

  // Computed getters
  getCurrentPage: () => BookPage | FittedPage | null
  getCurrentPageReferences: () => BookReference[]
  getCurrentChapterId: () => string | null
  getCurrentChapterTitle: () => string
  getProgressPercentage: () => number
  hasBookmarkOnCurrentPage: () => boolean
}

const initialState: ReaderState = {
  bookId: null,
  bookTitle: '',
  bookAuthor: '',
  content: null,
  paginatedContent: null,
  fittedContent: null,
  useClientSidePagination: true, // Enable by default
  isPaginating: false,
  containerDimensions: null,
  currentPageIndex: 0,
  totalPages: 0,
  wasmPageChapterMap: [],
  wasmChapterPageMap: [],
  wasmAnchorPageMap: [],
  layoutMode: 'single', // Two-column mode disabled - causes content overflow issues
  isLoading: false,
  error: null,
  loadingProgress: 0,
  loadingStage: '',
  isReferencesPanelOpen: false,
  sidebarTab: 'contents',
  bookmarks: [],
  progressDirty: false,
  lastSavedPage: 0,
}

export const useReaderStore = create<ReaderState & ReaderActions>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // Initialization
      setBookData: (data) => {
        const currentState = get()
        const isNewBook = currentState.bookId !== data.bookId
        const useClientSide = data.clientSidePagination ?? true

        // For client-side pagination, we'll set totalPages to 0 initially
        // It will be updated when fitContent completes
        const paginatedTotalPages = data.paginatedContent?.totalPages ?? 0

        // Determine the page to start on:
        // - If it's a new book, use lastReadPage from database
        // - If returning to same book, preserve currentPageIndex (from persisted state or session)
        // - Ensure page index is within valid bounds
        let pageIndex = isNewBook ? data.lastReadPage : currentState.currentPageIndex
        if (paginatedTotalPages > 0) {
          pageIndex = Math.max(0, Math.min(pageIndex, paginatedTotalPages - 1))
        }

        set({
          bookId: data.bookId,
          bookTitle: data.bookTitle,
          bookAuthor: data.bookAuthor,
          content: data.content,
          paginatedContent: data.paginatedContent,
          fittedContent: null, // Will be set by client-side pagination
          useClientSidePagination: useClientSide,
          isPaginating: useClientSide, // Start paginating if using client-side
          totalPages: paginatedTotalPages,
          wasmPageChapterMap: [],
          wasmChapterPageMap: [],
          wasmAnchorPageMap: [],
          currentPageIndex: pageIndex,
          lastSavedPage: isNewBook ? data.lastReadPage : currentState.lastSavedPage,
          isLoading: false,
          error: null,
          loadingProgress: useClientSide ? 90 : 100,
          loadingStage: useClientSide ? 'reader_loading_paginating' : '',
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setLoadingProgress: (percent, stage) =>
        set({ loadingProgress: percent, loadingStage: stage }),

      setError: (error) => set({ error, isLoading: false, loadingProgress: 0, loadingStage: '' }),

      // Reset reader state but keep essential data for the "Reading" menu item and resume
      resetReader: () => {
        const { bookId, bookTitle, bookAuthor, currentPageIndex, totalPages, layoutMode } = get()
        set({
          ...initialState,
          bookId,
          bookTitle,
          bookAuthor,
          currentPageIndex,
          totalPages,
          layoutMode,
          loadingProgress: 0,
          loadingStage: '',
        })
      },

      // Client-side pagination methods
      setFittedContent: (content) => {
        const currentState = get()
        const isNewBook = currentState.fittedContent === null

        // Restore page position when re-paginating (e.g., after font change)
        let pageIndex = currentState.currentPageIndex
        if (content.totalPages > 0) {
          // Try to maintain reading position proportionally
          if (!isNewBook && currentState.totalPages > 0) {
            const progressRatio = currentState.currentPageIndex / currentState.totalPages
            pageIndex = Math.round(progressRatio * content.totalPages)
          }
          pageIndex = Math.max(0, Math.min(pageIndex, content.totalPages - 1))
        }

        set({
          fittedContent: content,
          totalPages: content.totalPages,
          currentPageIndex: pageIndex,
          isPaginating: false,
          loadingProgress: 100,
          loadingStage: '',
        })
      },

      setContainerDimensions: (dimensions) => set({ containerDimensions: dimensions }),

      setIsPaginating: (isPaginating) =>
        set({
          isPaginating,
          loadingProgress: isPaginating ? 90 : 100,
          loadingStage: isPaginating ? 'reader_loading_paginating' : '',
        }),

      clearFittedContent: () =>
        set({
          fittedContent: null,
          isPaginating: true,
          loadingProgress: 90,
          loadingStage: 'reader_loading_paginating',
        }),

      // Navigation
      goToPage: (pageIndex) => {
        const { totalPages, currentPageIndex } = get()
        // FIX: Ensure we don't set invalid page indices when totalPages is 0
        if (totalPages === 0) {
          // When WASM handles pagination, store totalPages might be 0
          // Just set the page index directly, but clamp to >= 0
          const clampedIndex = Math.max(0, pageIndex)
          if (clampedIndex !== currentPageIndex) {
            set({
              currentPageIndex: clampedIndex,
              progressDirty: true,
            })
          }
          return
        }
        const clampedIndex = Math.max(0, Math.min(pageIndex, totalPages - 1))

        if (clampedIndex !== currentPageIndex) {
          set({
            currentPageIndex: clampedIndex,
            progressDirty: true,
          })
        }
      },

      nextPage: () => {
        const { currentPageIndex, totalPages, layoutMode, wasmPageChapterMap } = get()
        // If totalPages is 0, we can't navigate properly
        if (totalPages <= 0) return
        const increment = wasmPageChapterMap.length > 0 ? 1 : layoutMode === 'two-column' ? 2 : 1
        const nextIndex = Math.min(currentPageIndex + increment, totalPages - 1)

        if (nextIndex !== currentPageIndex && nextIndex >= 0) {
          set({
            currentPageIndex: nextIndex,
            progressDirty: true,
          })
        }
      },

      previousPage: () => {
        const { currentPageIndex, layoutMode, wasmPageChapterMap } = get()
        const decrement = wasmPageChapterMap.length > 0 ? 1 : layoutMode === 'two-column' ? 2 : 1
        const prevIndex = Math.max(currentPageIndex - decrement, 0)

        if (prevIndex !== currentPageIndex) {
          set({
            currentPageIndex: prevIndex,
            progressDirty: true,
          })
        }
      },

      goToChapter: (chapterId, anchorId?: string) => {
        const {
          fittedContent,
          paginatedContent,
          useClientSidePagination,
          wasmChapterPageMap,
          wasmAnchorPageMap,
        } = get()

        if (wasmChapterPageMap.length > 0) {
          const anchorTarget = anchorId
            ? wasmAnchorPageMap.find(
                (entry) => entry.chapterId === chapterId && entry.anchorId === anchorId
              )
            : undefined
          const chapterTarget = wasmChapterPageMap.find((entry) => entry.chapterId === chapterId)
          const targetPageIndex = anchorTarget?.pageIndex ?? chapterTarget?.firstPageIndex

          if (targetPageIndex !== undefined) {
            set({ currentPageIndex: targetPageIndex, progressDirty: true })
          }
          return
        }

        // Get pages from the appropriate source
        const pages =
          useClientSidePagination && fittedContent ? fittedContent.pages : paginatedContent?.pages

        if (!pages) return

        let targetPage: BookPage | FittedPage | undefined

        // If we have an anchor ID, search for the page containing that anchor
        if (anchorId) {
          targetPage = pages.find(
            (p) => p.chapterId === chapterId && p.htmlContent.includes(`id="${anchorId}"`)
          )
          // Also try with single quotes and other formats
          if (!targetPage) {
            targetPage = pages.find(
              (p) =>
                p.chapterId === chapterId &&
                (p.htmlContent.includes(`id='${anchorId}'`) ||
                  p.htmlContent.includes(`name="${anchorId}"`) ||
                  p.htmlContent.includes(`name='${anchorId}'`))
            )
          }
        }

        // Fall back to first page of chapter if anchor not found
        if (!targetPage) {
          targetPage = pages.find((p) => p.chapterId === chapterId)
        }

        if (targetPage) {
          set({
            currentPageIndex: targetPage.pageIndex,
            progressDirty: true,
          })
        }
      },

      setWasmPaginationMaps: (maps) =>
        set({
          wasmPageChapterMap: maps.pageChapterMap,
          wasmChapterPageMap: maps.chapterPageMap,
          wasmAnchorPageMap: maps.anchorPageMap,
        }),

      clearWasmPaginationMaps: () =>
        set({
          wasmPageChapterMap: [],
          wasmChapterPageMap: [],
          wasmAnchorPageMap: [],
        }),

      // Layout
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      // References
      openReferencesPanel: () => set({ isReferencesPanelOpen: true }),
      closeReferencesPanel: () => set({ isReferencesPanelOpen: false }),
      toggleReferencesPanel: () =>
        set((state) => ({ isReferencesPanelOpen: !state.isReferencesPanelOpen })),

      // Bookmarks
      setBookmarks: (bookmarks) => set({ bookmarks }),

      addBookmarkToState: (bookmark) =>
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark].sort((a, b) => a.pageIndex - b.pageIndex),
        })),

      removeBookmarkFromState: (bookmarkId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
        })),

      // Sidebar
      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      // Progress
      markProgressDirty: () => set({ progressDirty: true }),
      markProgressSaved: () =>
        set((state) => ({
          progressDirty: false,
          lastSavedPage: state.currentPageIndex,
        })),

      // Computed getters
      getCurrentPage: () => {
        const { fittedContent, paginatedContent, currentPageIndex, useClientSidePagination } = get()

        if (useClientSidePagination && fittedContent) {
          return fittedContent.pages[currentPageIndex] || null
        }
        return paginatedContent?.pages[currentPageIndex] || null
      },

      getCurrentPageReferences: () => {
        const { fittedContent, paginatedContent, currentPageIndex, useClientSidePagination } = get()

        if (useClientSidePagination && fittedContent) {
          return fittedContent.pages[currentPageIndex]?.references || []
        }
        return paginatedContent?.pages[currentPageIndex]?.references || []
      },

      getCurrentChapterId: () => {
        const {
          fittedContent,
          paginatedContent,
          currentPageIndex,
          useClientSidePagination,
          wasmPageChapterMap,
        } = get()

        const wasmPage = wasmPageChapterMap.find((entry) => entry.pageIndex === currentPageIndex)
        if (wasmPage) return wasmPage.chapterId

        if (useClientSidePagination && fittedContent) {
          return fittedContent.pages[currentPageIndex]?.chapterId || null
        }
        return paginatedContent?.pages[currentPageIndex]?.chapterId || null
      },

      getCurrentChapterTitle: () => {
        const {
          fittedContent,
          paginatedContent,
          currentPageIndex,
          useClientSidePagination,
          wasmPageChapterMap,
        } = get()

        const wasmPage = wasmPageChapterMap.find((entry) => entry.pageIndex === currentPageIndex)
        if (wasmPage) return wasmPage.chapterTitle

        if (useClientSidePagination && fittedContent) {
          return fittedContent.pages[currentPageIndex]?.chapterTitle || ''
        }
        return paginatedContent?.pages[currentPageIndex]?.chapterTitle || ''
      },

      getProgressPercentage: () => {
        const { currentPageIndex, totalPages } = get()
        if (totalPages === 0) return 0
        return Math.round(((currentPageIndex + 1) / totalPages) * 100)
      },

      hasBookmarkOnCurrentPage: () => {
        const { bookmarks, currentPageIndex } = get()
        return bookmarks.some((b) => b.pageIndex === currentPageIndex)
      },
    })),
    {
      name: 'liberty-reader-state',
      // Persist essential reading state for resume functionality
      partialize: (state) => ({
        bookId: state.bookId,
        bookTitle: state.bookTitle,
        bookAuthor: state.bookAuthor,
        currentPageIndex: state.currentPageIndex,
        totalPages: state.totalPages,
        // layoutMode removed - always use 'single' to avoid content overflow issues
      }),
      version: 2, // Bump version to clear old persisted layoutMode
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>
        if (version < 2) {
          // Remove layoutMode from old persisted state, force single-column
          delete state.layoutMode
        }
        return state as unknown as ReaderState & ReaderActions
      },
    }
  )
)

// Selector hooks for optimized re-renders
export const useCurrentPage = () => useReaderStore((state) => state.getCurrentPage())
export const useCurrentPageReferences = () =>
  useReaderStore((state) => state.getCurrentPageReferences())
export const useProgressPercentage = () => useReaderStore((state) => state.getProgressPercentage())
export const useIsLoading = () => useReaderStore((state) => state.isLoading)
export const useReaderError = () => useReaderStore((state) => state.error)
export const useLoadingProgress = () =>
  useReaderStore((state) => ({ percent: state.loadingProgress, stage: state.loadingStage }))

// Client-side pagination selectors
export const useIsPaginating = () => useReaderStore((state) => state.isPaginating)
export const useContainerDimensions = () => useReaderStore((state) => state.containerDimensions)
export const useFittedContent = () => useReaderStore((state) => state.fittedContent)
export const useBookContent = () => useReaderStore((state) => state.content)
export const useUseClientSidePagination = () =>
  useReaderStore((state) => state.useClientSidePagination)
