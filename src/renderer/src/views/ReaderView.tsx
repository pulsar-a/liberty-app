import { BookReference, ContainerDimensions, FittingConfig } from '@app-types/reader.types'
import { useNavigate } from '@tanstack/react-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MeasurementContainer, MeasurementContainerApi } from '../components/reader/MeasurementContainer'
import { PageRenderer } from '../components/reader/PageRenderer'
import { ReaderLoadingProgress } from '../components/reader/ReaderLoadingProgress'
import { ReaderSidebar } from '../components/reader/ReaderSidebar'
import { ReferencesPanel } from '../components/reader/ReferencesPanel'
import { WasmPageRenderer } from '../components/reader/WasmPageRenderer'
import { useIpc } from '../hooks/useIpc'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { readerRoute } from '../routes/routes'
import { contentFitter } from '../services/ContentFitter'
import { useReaderSettingsStore } from '../store/useReaderSettingsStore'
import { useReaderStore } from '../store/useReaderStore'

export const ReaderView: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookId } = readerRoute.useParams()
  const { main } = useIpc()

  const [highlightedRefId, setHighlightedRefId] = useState<string | undefined>()
  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions | null>(null)
  const [measurementReady, setMeasurementReady] = useState(false)
  
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const measurementRef = useRef<MeasurementContainerApi>(null)
  const paginationDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)

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
    setFittedContent,
    setIsPaginating,
    clearFittedContent,
    isLoading,
    isPaginating,
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
    content,
    useClientSidePagination,
    fittedContent,
  } = useReaderStore()

  const bookIdNum = parseInt(bookId, 10)

  // Fetch book content with client-side pagination enabled
  const { data: bookContentData, isLoading: isContentLoading } = main.getBookContent.useQuery(
    { 
      bookId: bookIdNum, 
      paginationConfig: { mode: layoutMode },
      clientSidePagination: true, // Enable client-side pagination
    },
    {
      queryKey: ['getBookContent', bookIdNum, 'clientSide'],
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
        clientSidePagination: bookContentData.clientSidePagination,
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

  // Create typography settings for fitting config
  const typographySettings = useMemo(() => ({
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    contentPaddingX: settings.contentPaddingX,
    contentPaddingY: settings.contentPaddingY,
    maxContentWidth: settings.maxContentWidth,
    textAlign: settings.textAlign,
    hyphenation: settings.hyphenation,
    paragraphSpacing: settings.paragraphSpacing,
    paragraphIndent: settings.paragraphIndent,
  }), [settings])

  // Track when measurement container is ready
  const handleMeasurementReady = useCallback(() => {
    setMeasurementReady(true)
  }, [])

  // Run content fitting when content, dimensions, or settings change
  useEffect(() => {
    const runPagination = async () => {
      if (!content || !containerDimensions || !measurementReady || !measurementRef.current || !useClientSidePagination) {
        return
      }

      // Debounce pagination to avoid excessive recalculations
      if (paginationDebounceRef.current) {
        clearTimeout(paginationDebounceRef.current)
      }

      paginationDebounceRef.current = setTimeout(async () => {
        setIsPaginating(true)

        try {
          // Set up the measurement API
          contentFitter.setMeasurementApi(measurementRef.current)

          const fittingConfig: FittingConfig = {
            containerDimensions,
            settings: typographySettings,
            layoutMode,
          }

          const fitted = await contentFitter.fitContent(
            content,
            fittingConfig,
            (progress) => {
              // Update loading progress during pagination
              const percent = 90 + Math.round(progress.percent * 0.1) // 90-100%
              setLoadingProgress(percent, progress.phase)
            }
          )

          setFittedContent(fitted)
        } catch (err) {
          console.error('Content fitting failed:', err)
          setError(`Failed to paginate content: ${err}`)
        }
      }, 100) // 100ms debounce
    }

    runPagination()

    return () => {
      if (paginationDebounceRef.current) {
        clearTimeout(paginationDebounceRef.current)
      }
    }
  }, [content, containerDimensions, measurementReady, typographySettings, layoutMode, useClientSidePagination, setIsPaginating, setFittedContent, setLoadingProgress, setError])

  // Clear fitted content when layout mode changes and reset measurement ready
  useEffect(() => {
    if (fittedContent) {
      clearFittedContent()
      setMeasurementReady(false)
    }
  }, [layoutMode]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handle container dimension changes
  const handleDimensionsChange = useCallback((dimensions: ContainerDimensions) => {
    setContainerDimensions(dimensions)
  }, [])

  // Handle layout mode change
  const handleLayoutModeChange = useCallback((mode: 'single' | 'two-column') => {
    setLayoutMode(mode)
    // Clear fitted content to trigger re-pagination
    clearFittedContent()
  }, [setLayoutMode, clearFittedContent])

  // WASM-specific handlers
  const handlePageChange = useCallback((pageIndex: number, total: number) => {
    // Page count is managed by WASM renderer
  }, [])

  const handleLinkClick = useCallback((href: string, isInternal: boolean) => {
    if (isInternal && href.startsWith('#')) {
      // Internal anchor - try to navigate to it
      const anchor = href.substring(1)
      // TODO: Navigate to anchor in book
      console.log('[ReaderView] Navigate to anchor:', anchor)
    } else if (!isInternal) {
      // External link - open in browser
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleWasmError = useCallback((err: Error) => {
    console.error('[ReaderView] WASM error:', err)
    setError(err.message)
  }, [setError])

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

  // Loading state (before content is loaded)
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
      
      {/* Layout toggle - DISABLED: two-column mode causes content overflow issues with poems/blockquotes */}
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
          {/* Hidden measurement container for content fitting (HTML engine only) */}
          {settings.engine === 'html' && containerDimensions && (
            <MeasurementContainer
              ref={measurementRef}
              dimensions={containerDimensions}
              settings={typographySettings}
              layoutMode={layoutMode}
              onReady={handleMeasurementReady}
            />
          )}

          {/* Page content - fills available space */}
          <div ref={contentContainerRef} className="relative flex-1 overflow-hidden">
            {/* Use WASM renderer when engine is 'wasm' */}
            {settings.engine === 'wasm' ? (
              <WasmPageRenderer
                bookContent={content}
                onPageChange={handlePageChange}
                onReferenceClick={handleReferenceClick}
                onLinkClick={handleLinkClick}
                onError={handleWasmError}
              />
            ) : (
              <>
                {/* HTML-based renderer with DOM measurement */}
                <PageRenderer 
                  onReferenceClick={handleReferenceClick} 
                  onRemoveBookmark={handleRemoveBookmarkByPage}
                  onDimensionsChange={handleDimensionsChange}
                />
                
                {/* Show loading overlay while paginating */}
                {isPaginating && !fittedContent && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
                    <ReaderLoadingProgress 
                      percent={loadingProgress} 
                      stage={loadingStage || 'reader_loading_paginating'} 
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* References panel */}
          <ReferencesPanel highlightedReferenceId={highlightedRefId} />
        </div>
      }
    />
  )
}
