import { BookReference } from '@app-types/reader.types'
import { faColumns, faFileAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageRenderer } from '../components/reader/PageRenderer'
import { ReaderLoadingProgress } from '../components/reader/ReaderLoadingProgress'
import { ReaderSidebar } from '../components/reader/ReaderSidebar'
import { ReferencesPanel } from '../components/reader/ReferencesPanel'
import { useIpc } from '../hooks/useIpc'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { readerRoute } from '../routes/routes'
import { useReaderStore } from '../store/useReaderStore'

export const ReaderView: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookId } = readerRoute.useParams()
  const { main } = useIpc()

  const [highlightedRefId, setHighlightedRefId] = useState<string | undefined>()
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    layoutMode,
    setLayoutMode,
    progressDirty,
    getCurrentChapterId,
    bookmarks,
  } = useReaderStore()

  const bookIdNum = parseInt(bookId, 10)

  // Fetch book content - don't refetch on window focus to preserve reading position
  const { data: bookContentData, isLoading: isContentLoading } = main.getBookContent.useQuery(
    { bookId: bookIdNum, paginationConfig: { mode: layoutMode } },
    {
      queryKey: ['getBookContent', bookIdNum, layoutMode],
      enabled: !isNaN(bookIdNum),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  )

  // Fetch book details for title/author
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

  // Subscribe to loading progress updates from main process
  useEffect(() => {
    const handleProgress = (data: { bookId: number; percent: number; stage: string }) => {
      // Only update progress for the current book
      if (data.bookId === bookIdNum) {
        setLoadingProgress(data.percent, data.stage)
      }
    }

    window.api.onReaderProgress(handleProgress)

    return () => {
      window.api.offReaderProgress()
    }
  }, [bookIdNum, setLoadingProgress])

  // Set book data when loaded
  useEffect(() => {
    if (bookContentData && bookDetails) {
      const authorNames = bookDetails.authors?.map((a) => a.name).join(', ') || ''

      setBookData({
        bookId: bookIdNum,
        bookTitle: bookDetails.name,
        bookAuthor: authorNames,
        content: bookContentData.content,
        paginatedContent: bookContentData.paginatedContent,
        lastReadPage: bookContentData.lastReadPage,
      })
    }
  }, [bookContentData, bookDetails, bookIdNum, setBookData])

  // Set bookmarks when loaded
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

  // Save progress when it changes (debounced)
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

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (progressDirty && totalPages > 0) {
        updateProgressMutation.mutate({
          bookId: bookIdNum,
          currentPage: currentPageIndex,
          totalPages,
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset reader on unmount
  useEffect(() => {
    return () => {
      resetReader()
    }
  }, [resetReader])

  // Handle reference click
  const handleReferenceClick = useCallback((reference: BookReference) => {
    setHighlightedRefId(reference.id)
  }, [])

  // Handle add bookmark
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

  // Handle delete bookmark by ID
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

  // Handle remove bookmark by page index (for clicking the indicator)
  const handleRemoveBookmarkByPage = useCallback(
    async (pageIndex: number) => {
      const bookmark = bookmarks.find((b) => b.pageIndex === pageIndex)
      if (bookmark) {
        await handleDeleteBookmark(bookmark.id)
      }
    },
    [bookmarks, handleDeleteBookmark]
  )

  // Handle invalid book ID
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

  // Sidebar header with book info and layout toggle
  const sidebarTop = (
    <div className="px-4 pt-2">
      <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
        {bookTitle}
      </h1>
      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{bookAuthor}</p>
      
      {/* Layout toggle */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">{t('reader_layout', 'Layout')}:</span>
        <div className="flex rounded border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setLayoutMode('single')}
            className={clsx(
              'flex items-center gap-1 rounded-l px-2 py-1 text-xs transition-colors',
              layoutMode === 'single'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
            title={t('reader_single_page', 'Single page')}
          >
            <FontAwesomeIcon icon={faFileAlt} className="h-3 w-3" />
          </button>
          <button
            onClick={() => setLayoutMode('two-column')}
            className={clsx(
              'flex items-center gap-1 rounded-r px-2 py-1 text-xs transition-colors',
              layoutMode === 'two-column'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
            title={t('reader_two_column', 'Two-page spread')}
          >
            <FontAwesomeIcon icon={faColumns} className="h-3 w-3" />
          </button>
        </div>
      </div>
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
          {/* Page content - fills available space */}
          <div className="relative flex-1 overflow-hidden">
            <PageRenderer onReferenceClick={handleReferenceClick} onRemoveBookmark={handleRemoveBookmarkByPage} />
          </div>

          {/* References panel */}
          <ReferencesPanel highlightedReferenceId={highlightedRefId} />
        </div>
      }
    />
  )
}
