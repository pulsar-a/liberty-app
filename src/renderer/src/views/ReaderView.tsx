import {
  Bookmark,
  BookReference,
  ContainerDimensions,
  FittingConfig,
  ReaderPosition,
  TocEntry,
} from '@app-types/reader.types'
import { getReaderEngineDescriptor, resolveReaderEngine } from '@app-types/reader-engines'
import { useNavigate } from '@tanstack/react-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MeasurementContainer,
  MeasurementContainerApi,
} from '../components/reader/MeasurementContainer'
import {
  FoliateReader,
  FoliateReaderApi,
  FoliateReaderLocation,
} from '../components/reader/FoliateReader'
import { PageRenderer } from '../components/reader/PageRenderer'
import { ReaderLoadingProgress } from '../components/reader/ReaderLoadingProgress'
import { ReaderSidebar } from '../components/reader/ReaderSidebar'
import { ReferencesPanel } from '../components/reader/ReferencesPanel'
import { WasmPageRenderer } from '../components/reader/WasmPageRenderer'
import { Toast } from '../components/Toast'
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
  const utils = main.useUtils()

  const [highlightedRefId, setHighlightedRefId] = useState<string | undefined>()
  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions | null>(null)
  const [measurementReady, setMeasurementReady] = useState(false)
  const [foliateToc, setFoliateToc] = useState<TocEntry[]>([])
  const [foliatePosition, setFoliatePosition] = useState<ReaderPosition | null>(null)
  const [showFallbackNotice, setShowFallbackNotice] = useState(false)

  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const measurementRef = useRef<MeasurementContainerApi>(null)
  const paginationDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const foliateReaderRef = useRef<FoliateReaderApi>(null)
  const latestPositionRef = useRef<ReaderPosition | null>(null)
  const pendingBookmarkMigrationRef = useRef<number | null>(null)
  const initializedBookFileRef = useRef<number | null>(null)
  const initializedFoliateFileRef = useRef<number | null>(null)

  // Reader settings
  const { settings } = useReaderSettingsStore()

  const {
    setBookMetadata,
    setBookData,
    setEngineLocation,
    setLoading,
    setLoadingProgress,
    setError,
    resetReader,
    setBookmarks,
    addBookmarkToState,
    updateBookmarkInState,
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
    progressDirty,
    getCurrentChapterId,
    bookmarks,
    content,
    useClientSidePagination,
    fittedContent,
  } = useReaderStore()

  const bookIdNum = parseInt(bookId, 10)

  // Fetch book details for title/author
  const { data: bookDetails, isLoading: isBookDetailsLoading } = main.getBookById.useQuery(
    { id: bookIdNum },
    {
      queryKey: ['getBookById', { id: bookIdNum }],
      enabled: !isNaN(bookIdNum),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  )
  const selectedFile = bookDetails?.preferredFile || null
  const selectedBookFileId = selectedFile?.id
  const selectedFileFormat = selectedFile?.fileFormat
  const storedPositionKey = selectedFile?.readingPosition
    ? JSON.stringify(selectedFile.readingPosition)
    : null
  const bookName = bookDetails?.name ?? ''
  const bookAuthors = bookDetails?.authors?.map((author) => author.name).join(', ') || ''

  const engineResolution = useMemo(
    () => resolveReaderEngine(settings.engine, selectedFileFormat),
    [selectedFileFormat, settings.engine]
  )
  const effectiveEngine = engineResolution.engine
  const usesLegacyContent = effectiveEngine === 'html' || effectiveEngine === 'wasm'
  const initialFoliatePosition = useMemo<ReaderPosition | null>(() => {
    if (storedPositionKey) return JSON.parse(storedPositionKey) as ReaderPosition
    if (bookDetails?.readingProgression !== null && bookDetails?.readingProgression !== undefined) {
      return {
        engine: 'foliate',
        progression: bookDetails.readingProgression,
        locator: { kind: 'page', index: 0, total: 1 },
      }
    }
    return null
  }, [bookDetails?.readingProgression, storedPositionKey])
  const legacyResumeProgression =
    selectedFile?.readingPosition?.locator.kind === 'page'
      ? null
      : (selectedFile?.readingPosition?.progression ?? bookDetails?.readingProgression ?? null)

  // Only run Liberty's custom EPUB parser for the legacy engines.
  const { data: bookContentData, isLoading: isContentLoading } = main.getBookContent.useQuery(
    {
      bookId: bookIdNum,
      bookFileId: selectedBookFileId,
      paginationConfig: { mode: layoutMode },
      clientSidePagination: true,
    },
    {
      enabled:
        !isNaN(bookIdNum) &&
        Boolean(bookDetails) &&
        Boolean(selectedBookFileId) &&
        usesLegacyContent,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  )

  // Fetch bookmarks
  const { data: bookmarksData } = main.getBookmarks.useQuery(
    { bookId: bookIdNum },
    {
      enabled: !isNaN(bookIdNum),
      refetchOnWindowFocus: false,
    }
  )

  // Mutations
  const updatePositionMutation = main.updateReadingPosition.useMutation({
    onSuccess: () => {
      utils.invalidate(undefined, { queryKey: ['getBooks', undefined] })
      utils.invalidate(undefined, { queryKey: ['getBookById', { id: bookIdNum }] })
    },
  })
  const updateReadingPosition = updatePositionMutation.mutate
  const createBookmarkMutation = main.createBookmark.useMutation()
  const deleteBookmarkMutation = main.deleteBookmark.useMutation()
  const updateBookmarkPositionMutation = main.updateBookmarkPosition.useMutation()

  // Set loading state
  useEffect(() => {
    setLoading(isBookDetailsLoading || (usesLegacyContent && isContentLoading))
  }, [isBookDetailsLoading, isContentLoading, setLoading, usesLegacyContent])

  useEffect(() => {
    if (!bookDetails) return

    setBookMetadata({
      bookId: bookIdNum,
      bookTitle: bookName,
      bookAuthor: bookAuthors,
    })

    if (!engineResolution.engine) {
      setError(
        t('reader_unsupported_format', 'No installed reader can open {{format}} files.', {
          format: selectedFileFormat?.toUpperCase() || 'this',
        })
      )
    }
  }, [
    bookAuthors,
    bookDetails?.id,
    bookIdNum,
    bookName,
    engineResolution.engine,
    selectedFileFormat,
    setBookMetadata,
    setError,
    t,
  ])

  useEffect(() => {
    if (!engineResolution.usedFallback || !effectiveEngine) {
      setShowFallbackNotice(false)
      return
    }

    setShowFallbackNotice(true)
    const timeout = setTimeout(() => setShowFallbackNotice(false), 5000)
    return () => clearTimeout(timeout)
  }, [effectiveEngine, engineResolution.usedFallback])

  useEffect(() => {
    if (effectiveEngine !== 'foliate' || !selectedBookFileId) {
      initializedFoliateFileRef.current = null
      setFoliatePosition((current) => (current === null ? current : null))
      setFoliateToc((current) => (current.length === 0 ? current : []))
      return
    }

    if (initializedFoliateFileRef.current === selectedBookFileId) return
    initializedFoliateFileRef.current = selectedBookFileId
    initializedBookFileRef.current = null
    setEngineLocation({
      currentPageIndex: 0,
      totalPages: 0,
      progression: initialFoliatePosition?.progression ?? null,
    })
    setFoliatePosition((current) => {
      const currentKey = current ? JSON.stringify(current) : null
      const initialKey = initialFoliatePosition ? JSON.stringify(initialFoliatePosition) : null
      return currentKey === initialKey ? current : initialFoliatePosition
    })
  }, [effectiveEngine, initialFoliatePosition, selectedBookFileId, setEngineLocation])

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
    if (!usesLegacyContent) return

    if (bookContentData && bookDetails) {
      if (initializedBookFileRef.current === bookContentData.bookFileId) return
      initializedBookFileRef.current = bookContentData.bookFileId
      const authorNames = bookDetails.authors?.map((a) => a.name).join(', ') || ''

      setBookData({
        bookId: bookIdNum,
        bookTitle: bookDetails.name,
        bookAuthor: authorNames,
        content: bookContentData.content,
        paginatedContent: bookContentData.paginatedContent,
        lastReadPage: bookContentData.lastReadPage,
        lastReadProgression: legacyResumeProgression,
        clientSidePagination: bookContentData.clientSidePagination,
      })
    }
  }, [
    bookContentData,
    bookDetails,
    bookIdNum,
    effectiveEngine,
    legacyResumeProgression,
    setBookData,
    usesLegacyContent,
  ])

  // Set bookmarks when loaded
  useEffect(() => {
    if (bookmarksData) {
      setBookmarks(
        bookmarksData
          .filter((b) => b.bookFileId === selectedBookFileId)
          .map((b) => ({
            id: b.id,
            bookId: b.bookId,
            bookFileId: b.bookFileId,
            chapterId: b.chapterId,
            pageIndex: b.pageIndex,
            position: b.position,
            progression: b.progression,
            label: b.label,
            selectedText: b.selectedText,
            createdAt: b.createdAt,
          }))
      )
    }
  }, [bookmarksData, selectedBookFileId, setBookmarks])

  // Create typography settings for fitting config
  const typographySettings = useMemo(
    () => ({
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
    }),
    [settings]
  )

  // Track when measurement container is ready
  const handleMeasurementReady = useCallback(() => {
    setMeasurementReady(true)
  }, [])

  // Run content fitting when content, dimensions, or settings change
  useEffect(() => {
    const runPagination = async () => {
      if (
        effectiveEngine !== 'html' ||
        !content ||
        !containerDimensions ||
        !measurementReady ||
        !measurementRef.current ||
        !useClientSidePagination
      ) {
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

          const fitted = await contentFitter.fitContent(content, fittingConfig, (progress) => {
            // Update loading progress during pagination
            const percent = 90 + Math.round(progress.percent * 0.1) // 90-100%
            setLoadingProgress(percent, progress.phase)
          })

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
  }, [
    content,
    containerDimensions,
    measurementReady,
    typographySettings,
    layoutMode,
    useClientSidePagination,
    effectiveEngine,
    setIsPaginating,
    setFittedContent,
    setLoadingProgress,
    setError,
  ])

  // Clear fitted content when layout mode changes and reset measurement ready
  useEffect(() => {
    if (fittedContent) {
      clearFittedContent()
      setMeasurementReady(false)
    }
  }, [layoutMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const legacyPosition = useMemo<ReaderPosition | null>(() => {
    if (!usesLegacyContent || !effectiveEngine || totalPages <= 0) return null

    return {
      engine: effectiveEngine,
      progression:
        totalPages <= 1 ? 0 : Math.min(1, Math.max(0, currentPageIndex / (totalPages - 1))),
      locator: {
        kind: 'page',
        index: currentPageIndex,
        total: totalPages,
      },
    }
  }, [currentPageIndex, effectiveEngine, totalPages, usesLegacyContent])

  useEffect(() => {
    latestPositionRef.current = effectiveEngine === 'foliate' ? foliatePosition : legacyPosition
  }, [effectiveEngine, foliatePosition, legacyPosition])

  // Save page-based progress when it changes (debounced).
  useEffect(() => {
    if (progressDirty && legacyPosition && selectedBookFileId) {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }

      progressSaveTimeoutRef.current = setTimeout(() => {
        updateReadingPosition({
          bookId: bookIdNum,
          bookFileId: selectedBookFileId,
          position: legacyPosition,
        })
        markProgressSaved()
      }, 1000)
    }

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }
    }
  }, [
    progressDirty,
    legacyPosition,
    bookIdNum,
    selectedBookFileId,
    updateReadingPosition,
    markProgressSaved,
  ])

  // Foliate emits stable CFIs as the visible location changes.
  useEffect(() => {
    if (
      effectiveEngine !== 'foliate' ||
      foliatePosition?.engine !== 'foliate' ||
      !selectedBookFileId
    )
      return

    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current)
    }

    progressSaveTimeoutRef.current = setTimeout(() => {
      updateReadingPosition({
        bookId: bookIdNum,
        bookFileId: selectedBookFileId,
        position: foliatePosition,
      })
    }, 1000)

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current)
      }
    }
  }, [bookIdNum, effectiveEngine, foliatePosition, selectedBookFileId, updateReadingPosition])

  // Persist the latest position when leaving the reader.
  useEffect(() => {
    return () => {
      const position = latestPositionRef.current
      if (position && selectedBookFileId) {
        updateReadingPosition({ bookId: bookIdNum, bookFileId: selectedBookFileId, position })
      }
    }
  }, [bookIdNum, selectedBookFileId, updateReadingPosition])

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
    const position = effectiveEngine === 'foliate' ? foliatePosition : legacyPosition
    if (!position || !selectedBookFileId) return

    const chapterId =
      effectiveEngine === 'foliate' ? undefined : (getCurrentChapterId() ?? undefined)
    const pageIndex = position.locator.kind === 'page' ? position.locator.index : undefined

    try {
      const newBookmark = await createBookmarkMutation.mutateAsync({
        bookId: bookIdNum,
        bookFileId: selectedBookFileId,
        position,
        chapterId,
        pageIndex,
      })

      addBookmarkToState({
        id: newBookmark.id,
        bookId: newBookmark.bookId,
        bookFileId: newBookmark.bookFileId,
        chapterId: newBookmark.chapterId,
        pageIndex: newBookmark.pageIndex,
        position: newBookmark.position,
        progression: newBookmark.progression,
        label: newBookmark.label,
        selectedText: newBookmark.selectedText,
        createdAt: newBookmark.createdAt,
      })
    } catch (err) {
      console.error('Failed to create bookmark:', err)
    }
  }, [
    addBookmarkToState,
    bookIdNum,
    createBookmarkMutation,
    effectiveEngine,
    foliatePosition,
    getCurrentChapterId,
    legacyPosition,
    selectedBookFileId,
  ])

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

  const handleNavigateToc = useCallback((entry: TocEntry) => {
    if (entry.href) {
      void foliateReaderRef.current?.goTo(entry.href)
    }
  }, [])

  const handleNavigateBookmark = useCallback(
    (bookmark: Bookmark) => {
      if (effectiveEngine === 'foliate') {
        if (bookmark.position?.locator.kind !== 'cfi') {
          pendingBookmarkMigrationRef.current = bookmark.id
        } else {
          pendingBookmarkMigrationRef.current = null
        }
        if (bookmark.position) {
          void foliateReaderRef.current?.goTo(bookmark.position)
        } else {
          void foliateReaderRef.current?.goTo({
            engine: 'foliate',
            progression:
              bookmark.progression ??
              (bookmark.pageIndex !== null && totalPages > 1
                ? bookmark.pageIndex / (totalPages - 1)
                : 0),
            locator: {
              kind: 'page',
              index: bookmark.pageIndex ?? 0,
              total: Math.max(1, totalPages),
            },
          })
        }
        return
      }

      if (bookmark.pageIndex !== null) {
        useReaderStore.getState().goToPage(bookmark.pageIndex)
      } else if (bookmark.progression !== null && totalPages > 0) {
        useReaderStore
          .getState()
          .goToPage(Math.round(bookmark.progression * Math.max(0, totalPages - 1)))
      }
    },
    [effectiveEngine, totalPages]
  )

  const handleFoliatePositionChange = useCallback(
    (position: ReaderPosition, location: FoliateReaderLocation) => {
      setFoliatePosition(position)
      setEngineLocation(location)

      const bookmarkId = pendingBookmarkMigrationRef.current
      if (bookmarkId === null || position.locator.kind !== 'cfi') return
      pendingBookmarkMigrationRef.current = null

      void updateBookmarkPositionMutation
        .mutateAsync({ bookmarkId, position })
        .then((bookmark) => {
          if (!bookmark) return
          updateBookmarkInState({
            id: bookmark.id,
            bookId: bookmark.bookId,
            bookFileId: bookmark.bookFileId,
            chapterId: bookmark.chapterId,
            pageIndex: bookmark.pageIndex,
            position: bookmark.position,
            progression: bookmark.progression,
            label: bookmark.label,
            selectedText: bookmark.selectedText,
            createdAt: bookmark.createdAt,
          })
        })
        .catch((error) => {
          console.error('Failed to migrate bookmark position:', error)
        })
    },
    [setEngineLocation, updateBookmarkInState, updateBookmarkPositionMutation]
  )

  const handleFoliateReady = useCallback(
    (toc: TocEntry[]) => {
      setFoliateToc(toc)
      setLoading(false)
    },
    [setLoading]
  )

  const handleFoliateError = useCallback(
    (message: string) => {
      setError(
        t('reader_foliate_error', 'Failed to open this book with Foliate: {{message}}', {
          message,
        })
      )
    },
    [setError, t]
  )

  const hasFoliateBookmark = useMemo(() => {
    if (foliatePosition?.locator.kind !== 'cfi') return false
    const currentCfi = foliatePosition.locator.value
    return bookmarks.some((bookmark) => {
      const locator = bookmark.position?.locator
      return locator?.kind === 'cfi' && locator.value === currentCfi
    })
  }, [bookmarks, foliatePosition])

  // Handle container dimension changes
  const handleDimensionsChange = useCallback((dimensions: ContainerDimensions) => {
    setContainerDimensions(dimensions)
  }, [])

  // Handle invalid book ID
  if (isNaN(bookIdNum)) {
    return (
      <ThreeSectionsLayout
        sidebarTop={
          <div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>
        }
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
        sidebarTop={
          <div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>
        }
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
        sidebarTop={
          <div className="px-4 pt-2 text-lg font-semibold">{t('reader_title', 'Reader')}</div>
        }
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
      <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{bookTitle}</h1>
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
          tocEntries={effectiveEngine === 'foliate' ? foliateToc : undefined}
          onNavigateToc={effectiveEngine === 'foliate' ? handleNavigateToc : undefined}
          onNavigateBookmark={handleNavigateBookmark}
          hasBookmarkOnCurrentLocation={
            effectiveEngine === 'foliate' ? hasFoliateBookmark : undefined
          }
        />
      }
      content={
        <div className="absolute inset-0 flex flex-col">
          <Toast
            show={showFallbackNotice}
            withCloseButton
            onCloseClick={() => setShowFallbackNotice(false)}
          >
            <div className="py-4 text-sm text-gray-700 dark:text-gray-200">
              {t(
                'reader_engine_fallback',
                '{{selected}} cannot open {{format}}. Using {{fallback}} for this book.',
                {
                  selected: getReaderEngineDescriptor(settings.engine).label,
                  fallback: effectiveEngine ? getReaderEngineDescriptor(effectiveEngine).label : '',
                  format: engineResolution.format?.toUpperCase() ?? '',
                }
              )}
            </div>
          </Toast>

          {/* Hidden measurement container for content fitting (HTML engine only) */}
          {effectiveEngine === 'html' && containerDimensions && (
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
            {effectiveEngine === 'foliate' && selectedBookFileId ? (
              <FoliateReader
                ref={foliateReaderRef}
                bookFileId={selectedBookFileId}
                initialPosition={initialFoliatePosition}
                onPositionChange={handleFoliatePositionChange}
                onReady={handleFoliateReady}
                onError={handleFoliateError}
              />
            ) : effectiveEngine === 'wasm' ? (
              <WasmPageRenderer
                bookContent={content}
                initialPage={
                  legacyResumeProgression !== null
                    ? Math.round(legacyResumeProgression * 10000)
                    : (bookContentData?.lastReadPage ?? 0)
                }
                initialTotalPages={
                  legacyResumeProgression !== null
                    ? 10001
                    : (bookContentData?.lastReadTotalPages ?? 0)
                }
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
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
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
