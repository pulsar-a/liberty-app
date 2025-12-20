/**
 * WASM-based Reader View
 * Uses the Rust/WebAssembly canvas renderer for deterministic pagination
 */

import { BookReference } from '@app-types/reader.types'
import { useNavigate } from '@tanstack/react-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReaderLoadingProgress } from '../components/reader/ReaderLoadingProgress'
import { ReaderSidebar } from '../components/reader/ReaderSidebar'
import { ReferencesPanel } from '../components/reader/ReferencesPanel'
import { WasmPageRenderer } from '../components/reader/WasmPageRenderer'
import { useIpc } from '../hooks/useIpc'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { readerRoute } from '../routes/routes'
import { useReaderSettingsStore } from '../store/useReaderSettingsStore'
import { useReaderStore } from '../store/useReaderStore'

export const WasmReaderView: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookId } = readerRoute.useParams()
  const { main } = useIpc()

  const [highlightedRefId, setHighlightedRefId] = useState<string | undefined>()
  
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reader settings
  const { settings } = useReaderSettingsStore()

  const {
    setBookData,
    setLoading,
    setLoadingProgress,
    setError,
    resetReader,
    setBookmarks,
    addBookmarkToState,
    removeBookmarkFromState,
    markProgressSaved,
    isLoading,
    error,
    loadingProgress,
    loadingStage,
    bookTitle,
    bookAuthor,
    currentPageIndex,
    totalPages,
    progressDirty,
    getCurrentChapterId,
    bookmarks,
    content,
    goToChapter,
  } = useReaderStore()

  const bookIdNum = parseInt(bookId, 10)

  // Fetch book content
  const { data: bookContentData, isLoading: isContentLoading } = main.getBookContent.useQuery(
    { 
      bookId: bookIdNum, 
      paginationConfig: { mode: 'single' },
      clientSidePagination: true,
    },
    {
      queryKey: ['getBookContent', bookIdNum, 'wasm'],
      enabled: !isNaN(bookIdNum),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  )

  // Fetch book details
  const { data: bookDetails } = main.getBookById.useQuery(
    { id: bookIdNum },
    {
      queryKey: ['getBookById', { id: bookIdNum }],
      enabled: !isNaN(bookIdNum),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  )

  // Fetch bookmarks
  const { data: bookmarksData } = main.getBookmarks.useQuery(
    { bookId: bookIdNum },
    {
      queryKey: ['getBookmarks', bookIdNum],
      enabled: !isNaN(bookIdNum),
      refetchOnWindowFocus: false,
    }
  )

  // Mutations
  const updateProgressMutation = main.updateReadingProgress.useMutation()
  const createBookmarkMutation = main.createBookmark.useMutation()
  const deleteBookmarkMutation = main.deleteBookmark.useMutation()

  // Set loading state
  useEffect(() => {
    setLoading(isContentLoading)
  }, [isContentLoading, setLoading])

  // Set book data when loaded
  useEffect(() => {
    if (bookContentData && bookDetails) {
      const authorNames = bookDetails.authors?.map((a) => a.name).join(', ') || ''

      setBookData({
        bookId: bookIdNum,
        bookTitle: bookDetails.name,
        bookAuthor: authorNames,
        content: bookContentData.content,
        paginatedContent: null, // WASM handles pagination
        lastReadPage: bookContentData.lastReadPage,
        clientSidePagination: true,
      })
    }
  }, [bookContentData, bookDetails, bookIdNum, setBookData])

  // Set bookmarks
  useEffect(() => {
    if (bookmarksData) {
      setBookmarks(
        bookmarksData.map((b) => ({
          id: b.id,
          bookId: b.bookId,
          chapterId: b.chapterId,
          pageIndex: b.pageIndex,
          label: b.label,
          selectedText: b.selectedText,
          createdAt: b.createdAt,
        }))
      )
    }
  }, [bookmarksData, setBookmarks])

  // Save progress when it changes
  useEffect(() => {
    if (progressDirty && totalPages > 0) {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }

      progressSaveTimeoutRef.current = setTimeout(() => {
        updateProgressMutation.mutate({
          bookId: bookIdNum,
          currentPage: currentPageIndex,
          totalPages,
        })
        markProgressSaved()
      }, 1000)
    }

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }
    }
  }, [progressDirty, currentPageIndex, totalPages, bookIdNum, updateProgressMutation, markProgressSaved])

  // Reset on unmount
  useEffect(() => {
    return () => {
      resetReader()
    }
  }, [resetReader])

  // Handlers
  const handleReferenceClick = useCallback((reference: BookReference) => {
    setHighlightedRefId(reference.id)
  }, [])

  const handleLinkClick = useCallback((href: string, isInternal: boolean) => {
    if (isInternal && href.startsWith('#')) {
      // Internal anchor - try to navigate to it
      const anchor = href.substring(1)
      // Find chapter containing this anchor
      // For now, just log it
      console.log('[WasmReaderView] Navigate to anchor:', anchor)
    } else if (!isInternal) {
      // External link - open in browser
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handlePageChange = useCallback((pageIndex: number, total: number) => {
    // Update store with new page count if needed
    if (total !== totalPages) {
      // Total pages changed (after pagination)
    }
  }, [totalPages])

  const handleAddBookmark = useCallback(async () => {
    const chapterId = getCurrentChapterId()
    if (!chapterId) return

    try {
      const newBookmark = await createBookmarkMutation.mutateAsync({
        bookId: bookIdNum,
        chapterId,
        pageIndex: currentPageIndex,
      })

      addBookmarkToState({
        id: newBookmark.id,
        bookId: newBookmark.bookId,
        chapterId: newBookmark.chapterId,
        pageIndex: newBookmark.pageIndex,
        label: newBookmark.label,
        selectedText: newBookmark.selectedText,
        createdAt: newBookmark.createdAt,
      })
    } catch (err) {
      console.error('Failed to create bookmark:', err)
    }
  }, [bookIdNum, currentPageIndex, getCurrentChapterId, createBookmarkMutation, addBookmarkToState])

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: number) => {
      try {
        await deleteBookmarkMutation.mutateAsync({ bookmarkId })
        removeBookmarkFromState(bookmarkId)
      } catch (err) {
        console.error('Failed to delete bookmark:', err)
      }
    },
    [deleteBookmarkMutation, removeBookmarkFromState]
  )

  const handleError = useCallback((err: Error) => {
    setError(err.message)
  }, [setError])

  // Invalid book ID
  if (isNaN(bookIdNum)) {
    return (
      <ThreeSectionsLayout
        sidebarTop={<div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>}
        sidebar={<div />}
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-gray-500">{t('reader_invalid_book', 'Invalid book ID')}</p>
              <button
                onClick={() => navigate({ to: '/' })}
                className="mt-4 text-indigo-600 hover:underline"
              >
                {t('reader_go_to_library', 'Go to Library')}
              </button>
            </div>
          </div>
        }
      />
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <ThreeSectionsLayout
        sidebarTop={<div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>}
        sidebar={<div />}
        content={
          <div className="flex h-full items-center justify-center">
            <ReaderLoadingProgress percent={loadingProgress} stage={loadingStage} />
          </div>
        }
      />
    )
  }

  // Error state
  if (error) {
    return (
      <ThreeSectionsLayout
        sidebarTop={<div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>}
        sidebar={<div />}
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-red-500">{error}</p>
              <button
                onClick={() => navigate({ to: '/' })}
                className="mt-4 text-indigo-600 hover:underline"
              >
                {t('reader_go_to_library', 'Go to Library')}
              </button>
            </div>
          </div>
        }
      />
    )
  }

  // Sidebar header
  const sidebarTop = (
    <div className="px-4 pt-2">
      <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
        {bookTitle}
      </h1>
      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{bookAuthor}</p>
      <p className="mt-1 text-xs text-indigo-500">WASM Reader</p>
    </div>
  )

  return (
    <ThreeSectionsLayout
      sidebarTop={sidebarTop}
      sidebar={
        <ReaderSidebar
          onAddBookmark={handleAddBookmark}
          onDeleteBookmark={handleDeleteBookmark}
        />
      }
      content={
        <div className="absolute inset-0 flex flex-col">
          {/* WASM Page Renderer */}
          <div className="relative flex-1 overflow-hidden">
            <WasmPageRenderer
              bookContent={content}
              onPageChange={handlePageChange}
              onReferenceClick={handleReferenceClick}
              onLinkClick={handleLinkClick}
              onError={handleError}
            />
          </div>

          {/* References panel */}
          <ReferencesPanel highlightedReferenceId={highlightedRefId} />
        </div>
      }
    />
  )
}

export default WasmReaderView

