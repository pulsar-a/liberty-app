import { BookContent } from '@app-types/reader.types'
import { clsx } from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { convertSettingsToWasm } from '../../services/WasmReaderService'
import { ReaderSettings, useReaderSettingsStore } from '../../store/useReaderSettingsStore'
import { useReaderStore } from '../../store/useReaderStore'
import {
  WasmReaderStage,
  WasmReaderWorkerCommand,
  WasmReaderWorkerEvent,
} from '../../types/wasm-reader-worker.types'
import { ReaderLoadingProgress } from './ReaderLoadingProgress'
import '../../assets/reader-theme.css'

interface WasmPageRendererProps {
  className?: string
  bookContent: BookContent | null
  initialPage?: number
  initialTotalPages?: number
}

function layoutSettingsKey(settings: ReaderSettings): string {
  return JSON.stringify({
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    contentPaddingX: settings.contentPaddingX,
    contentPaddingY: settings.contentPaddingY,
    maxContentWidth: settings.maxContentWidth,
    columns: settings.columns,
    columnGap: settings.columnGap,
    textAlign: settings.textAlign,
    hyphenation: settings.hyphenation,
    paragraphSpacing: settings.paragraphSpacing,
    paragraphIndent: settings.paragraphIndent,
  })
}

export const WasmPageRenderer: React.FC<WasmPageRendererProps> = ({
  className,
  bookContent,
  initialPage = 0,
  initialTotalPages = 0,
}) => {
  const { t } = useTranslation()
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const latestStructuralRequestRef = useRef(0)
  const latestRenderRequestRef = useRef(0)
  const lastRequestedPageRef = useRef(-1)
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousLayoutKeyRef = useRef<string | null>(null)
  const previousThemeRef = useRef<string | null>(null)
  const settingsRef = useRef<ReaderSettings | null>(null)

  const [canvasKey, setCanvasKey] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [stage, setStage] = useState<WasmReaderStage>('initializing')
  const [hasRenderedPage, setHasRenderedPage] = useState(false)
  const [isPaginated, setIsPaginated] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { settings, setEngine } = useReaderSettingsStore()
  settingsRef.current = settings

  const {
    currentPageIndex,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    bookmarks,
    applyWasmPagination,
    clearWasmPaginationMaps,
  } = useReaderStore()

  const nextRequestId = useCallback(() => {
    requestIdRef.current += 1
    return requestIdRef.current
  }, [])

  const postCommand = useCallback((command: WasmReaderWorkerCommand, transfer?: Transferable[]) => {
    workerRef.current?.postMessage(command, transfer || [])
  }, [])

  const armSlowFeedback = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    setIsSlow(false)
    slowTimerRef.current = setTimeout(() => setIsSlow(true), 4000)
  }, [])

  const clearSlowFeedback = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current)
      slowTimerRef.current = null
    }
    setIsSlow(false)
  }, [])

  const restartReader = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    clearWasmPaginationMaps()
    setError(null)
    setHasRenderedPage(false)
    setIsPaginated(false)
    setStage('initializing')
    lastRequestedPageRef.current = -1
    previousLayoutKeyRef.current = null
    previousThemeRef.current = null
    setCanvasKey((key) => key + 1)
  }, [clearWasmPaginationMaps])

  // A reader session owns one worker and one transferred canvas.
  useEffect(() => {
    const canvasHost = canvasHostRef.current
    if (!canvasHost) return

    const canvasElement = document.createElement('canvas')
    canvasElement.className = 'block h-full w-full select-none'
    canvasHost.appendChild(canvasElement)

    const transferableCanvas = canvasElement as HTMLCanvasElement & {
      transferControlToOffscreen?: () => OffscreenCanvas
    }
    if (typeof transferableCanvas.transferControlToOffscreen !== 'function') {
      setError(t('reader_wasm_offscreen_unsupported', 'This system cannot start the WASM reader.'))
      return () => canvasElement.remove()
    }

    const worker = new Worker(new URL('../../workers/wasm-reader.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WasmReaderWorkerEvent>) => {
      const message = event.data

      if (message.type === 'status') {
        if (message.stage === 'ready' && message.requestId < latestRenderRequestRef.current) {
          return
        }
        setStage(message.stage)
        if (
          message.stage === 'initializing' ||
          message.stage === 'fonts' ||
          message.stage === 'opening' ||
          message.stage === 'paginating' ||
          message.stage === 'reflowing'
        ) {
          armSlowFeedback()
        }
        return
      }

      if (message.type === 'pagination') {
        if (message.requestId < latestStructuralRequestRef.current) return
        applyWasmPagination(message.result, message.pageIndex)
        setIsPaginated(message.result.totalPages > 0)
        if (message.result.totalPages > 0) {
          const renderRequestId = nextRequestId()
          latestRenderRequestRef.current = renderRequestId
          lastRequestedPageRef.current = message.pageIndex
          postCommand({
            type: 'render-page',
            requestId: renderRequestId,
            pageIndex: message.pageIndex,
          })
        }
        return
      }

      if (message.type === 'rendered') {
        if (message.requestId < latestRenderRequestRef.current) return
        setHasRenderedPage(true)
        setStage('ready')
        clearSlowFeedback()
        return
      }

      if (message.type === 'error') {
        setError(message.message)
        clearSlowFeedback()
      }
    }

    worker.onerror = (event) => {
      setError(event.message || t('reader_wasm_error', 'The WASM reader stopped unexpectedly.'))
      clearSlowFeedback()
    }

    const offscreen = transferableCanvas.transferControlToOffscreen()
    const requestId = nextRequestId()
    postCommand(
      {
        type: 'initialize',
        requestId,
        canvas: offscreen,
        settings: convertSettingsToWasm(settingsRef.current!, settingsRef.current!.theme),
      },
      [offscreen]
    )

    return () => {
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
      worker.terminate()
      if (workerRef.current === worker) workerRef.current = null
      canvasElement.remove()
    }
  }, [
    canvasKey,
    applyWasmPagination,
    armSlowFeedback,
    clearSlowFeedback,
    nextRequestId,
    postCommand,
    t,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = (width: number, height: number) => {
      setDimensions({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(height)),
      })
    }

    const observer = new ResizeObserver(([entry]) => {
      updateDimensions(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(container)

    const rect = container.getBoundingClientRect()
    updateDimensions(rect.width, rect.height)
    return () => observer.disconnect()
  }, [canvasKey])

  useEffect(() => {
    if (!bookContent || !workerRef.current) return
    setHasRenderedPage(false)
    setIsPaginated(false)
    lastRequestedPageRef.current = -1
    const requestId = nextRequestId()
    latestStructuralRequestRef.current = requestId
    postCommand({
      type: 'load-book',
      requestId,
      content: bookContent,
      resumePage: initialPage,
      resumeTotalPages: initialTotalPages,
    })
  }, [bookContent, canvasKey, initialPage, initialTotalPages, nextRequestId, postCommand])

  useEffect(() => {
    if (!workerRef.current || dimensions.width <= 0 || dimensions.height <= 0) return
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    if (hasRenderedPage) setStage('reflowing')

    resizeTimerRef.current = setTimeout(() => {
      const requestId = nextRequestId()
      latestStructuralRequestRef.current = requestId
      armSlowFeedback()
      postCommand({
        type: 'resize',
        requestId,
        width: dimensions.width,
        height: dimensions.height,
        pixelRatio: window.devicePixelRatio || 1,
      })
    }, 100)

    return () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    }
  }, [dimensions, canvasKey, hasRenderedPage, armSlowFeedback, nextRequestId, postCommand])

  useEffect(() => {
    if (!workerRef.current) return

    const layoutKey = layoutSettingsKey(settings)
    const previousLayoutKey = previousLayoutKeyRef.current
    const previousTheme = previousThemeRef.current
    previousLayoutKeyRef.current = layoutKey
    previousThemeRef.current = settings.theme

    // Initialization already receives the current settings.
    if (previousLayoutKey === null) return

    const sendSettings = (structural: boolean) => {
      const requestId = nextRequestId()
      if (structural) latestStructuralRequestRef.current = requestId
      postCommand({
        type: 'update-settings',
        requestId,
        settings: convertSettingsToWasm(settings, settings.theme),
      })
    }

    if (layoutKey === previousLayoutKey && settings.theme !== previousTheme) {
      sendSettings(false)
      return
    }

    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
    setStage('reflowing')
    armSlowFeedback()
    settingsTimerRef.current = setTimeout(() => sendSettings(true), 150)

    return () => {
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
    }
  }, [settings, canvasKey, armSlowFeedback, nextRequestId, postCommand])

  useEffect(() => {
    if (!workerRef.current || !isPaginated || totalPages <= 0) return
    if (lastRequestedPageRef.current === currentPageIndex) return
    const requestId = nextRequestId()
    latestRenderRequestRef.current = requestId
    lastRequestedPageRef.current = currentPageIndex
    postCommand({ type: 'render-page', requestId, pageIndex: currentPageIndex })
  }, [currentPageIndex, isPaginated, totalPages, canvasKey, nextRequestId, postCommand])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        nextPage()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        previousPage()
      } else if (event.key === 'Home') {
        event.preventDefault()
        goToPage(0)
      } else if (event.key === 'End' && totalPages > 0) {
        event.preventDefault()
        goToPage(totalPages - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPage, nextPage, previousPage, totalPages])

  const handlePageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current
      if (!container || stage !== 'ready') return
      const rect = container.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      if (clickX < rect.width * 0.35) previousPage()
      else if (clickX > rect.width * 0.65) nextPage()
    },
    [nextPage, previousPage, stage]
  )

  const hasBookmark = bookmarks.some((bookmark) => bookmark.pageIndex === currentPageIndex)
  const showReflow = hasRenderedPage && stage !== 'ready' && !error

  return (
    <div
      ref={containerRef}
      className={clsx('relative h-full w-full cursor-default overflow-hidden', className)}
      onClick={handlePageClick}
    >
      {hasBookmark && <div className="bookmark-indicator" title="Bookmarked page" />}

      <div ref={canvasHostRef} className="h-full w-full" />

      {!hasRenderedPage && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
          <ReaderLoadingProgress
            percent={stage === 'fonts' ? 30 : stage === 'opening' ? 55 : 85}
            stage={
              stage === 'opening'
                ? 'reader_loading_opening'
                : stage === 'paginating'
                  ? 'reader_loading_paginating'
                  : 'reader_loading'
            }
          />
        </div>
      )}

      {showReflow && (
        <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
          {t('reader_updating_layout', 'Updating layout…')}
        </div>
      )}

      {isSlow && !error && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            restartReader()
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-md bg-gray-900/80 px-3 py-2 text-xs text-white shadow-lg"
        >
          {t('reader_loading_slow_retry', 'Taking longer than expected — restart reader')}
        </button>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 dark:bg-gray-900/95">
          <div className="max-w-md text-center">
            <p className="font-medium text-red-600 dark:text-red-400">
              {t('reader_wasm_error_title', 'Reader could not continue')}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={restartReader}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
              >
                {t('reader_retry', 'Restart Reader')}
              </button>
              <button
                type="button"
                onClick={() => setEngine('html')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t('reader_use_legacy', 'Use Legacy Reader')}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasRenderedPage && !error && (
        <>
          <button
            type="button"
            className="page-nav-zone page-nav-zone--prev"
            onClick={(event) => {
              event.stopPropagation()
              previousPage()
            }}
            aria-label={t('reader_previous_page', 'Previous page')}
          >
            <span className="page-nav-hint">‹</span>
          </button>
          <button
            type="button"
            className="page-nav-zone page-nav-zone--next"
            onClick={(event) => {
              event.stopPropagation()
              nextPage()
            }}
            aria-label={t('reader_next_page', 'Next page')}
          >
            <span className="page-nav-hint">›</span>
          </button>
          <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400">
            {currentPageIndex + 1} / {totalPages}
          </div>
        </>
      )}
    </div>
  )
}

export default WasmPageRenderer
