/**
 * WASM-based Page Renderer
 * Renders book pages using the Rust/WASM canvas renderer
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { BookContent, BookReference } from '@app-types/reader.types'
import { useReaderSettingsStore } from '../../store/useReaderSettingsStore'
import { useReaderStore } from '../../store/useReaderStore'
import {
  initWasmReader,
  loadBundledFonts,
  convertSettingsToWasm,
  updateSettings,
  loadBook,
  paginateBook,
  renderPage,
  unloadBook,
  isInitialized,
  selectionStart,
  selectionUpdate,
  selectionEnd,
  selectionClear,
  getSelectionRects,
  getSelectedText,
  getLinkAtPosition,
  prerenderPages,
} from '../../services/WasmReaderService'
import '../../assets/reader-theme.css'

interface WasmPageRendererProps {
  className?: string
  bookContent: BookContent | null
  onPageChange?: (pageIndex: number, totalPages: number) => void
  onChapterChange?: (chapterId: string, chapterTitle: string) => void
  onReferenceClick?: (reference: BookReference) => void
  onLinkClick?: (href: string, isInternal: boolean) => void
  onError?: (error: Error) => void
}

export const WasmPageRenderer: React.FC<WasmPageRendererProps> = ({
  className,
  bookContent,
  onPageChange,
  onChapterChange,
  onLinkClick,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isWasmReady, setIsWasmReady] = useState(false)
  const [isPaginated, setIsPaginated] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedText, setSelectedText] = useState<string | null>(null)

  const {
    currentPageIndex,
    goToPage,
    nextPage,
    previousPage,
    bookmarks,
  } = useReaderStore()

  const { settings } = useReaderSettingsStore()

  // Initialize WASM module
  useEffect(() => {
    const initWasm = async () => {
      try {
        await initWasmReader()
        await loadBundledFonts()
        setIsWasmReady(true)
        console.log('[WasmPageRenderer] WASM module ready')
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
      }
    }

    if (!isInitialized()) {
      initWasm()
    } else {
      setIsWasmReady(true)
    }

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [onError])

  // Track container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      // Use device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1
      setDimensions({
        width: Math.floor(width * dpr),
        height: Math.floor(height * dpr),
      })
    })

    observer.observe(container)

    // Initial dimensions
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    setDimensions({
      width: Math.floor(rect.width * dpr),
      height: Math.floor(rect.height * dpr),
    })

    return () => observer.disconnect()
  }, [])

  // Update settings when they change
  useEffect(() => {
    if (!isWasmReady) return

    try {
      const wasmSettings = convertSettingsToWasm(settings, settings.theme)
      updateSettings(wasmSettings)

      // Re-paginate if book is loaded
      if (isPaginated && dimensions.width > 0 && dimensions.height > 0) {
        const result = paginateBook(dimensions.width, dimensions.height)
        setTotalPages(result.totalPages)
      }
    } catch (err) {
      console.error('[WasmPageRenderer] Failed to update settings:', err)
    }
  }, [settings, isWasmReady, isPaginated, dimensions])

  // Load book when content changes
  useEffect(() => {
    if (!isWasmReady || !bookContent) return

    try {
      // Unload previous book
      unloadBook()
      setIsPaginated(false)

      // Load new book
      const result = loadBook(bookContent)
      console.log('[WasmPageRenderer] Book loaded:', result)

      // Paginate if dimensions are known
      if (dimensions.width > 0 && dimensions.height > 0) {
        const paginationResult = paginateBook(dimensions.width, dimensions.height)
        setTotalPages(paginationResult.totalPages)
        setIsPaginated(true)
        onPageChange?.(currentPageIndex, paginationResult.totalPages)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    }
  }, [bookContent, isWasmReady, dimensions, currentPageIndex, onPageChange, onError])

  // Paginate when dimensions change
  useEffect(() => {
    if (!isWasmReady || !bookContent || dimensions.width === 0) return

    try {
      const result = paginateBook(dimensions.width, dimensions.height)
      setTotalPages(result.totalPages)
      setIsPaginated(true)
      onPageChange?.(currentPageIndex, result.totalPages)
    } catch (err) {
      console.error('[WasmPageRenderer] Pagination failed:', err)
    }
  }, [dimensions, isWasmReady, bookContent, currentPageIndex, onPageChange])

  // Render current page
  useEffect(() => {
    if (!isWasmReady || !isPaginated || !canvasRef.current) return
    if (dimensions.width === 0 || dimensions.height === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Cancel any pending render
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Schedule render on next frame
    animationFrameRef.current = requestAnimationFrame(() => {
      try {
        const pixels = renderPage(currentPageIndex, dimensions.width, dimensions.height)
        const imageData = new ImageData(pixels, dimensions.width, dimensions.height)
        ctx.putImageData(imageData, 0, 0)

        // Pre-render adjacent pages in the background for smoother navigation
        requestIdleCallback(() => {
          prerenderPages(currentPageIndex, dimensions.width, dimensions.height, 2)
        }, { timeout: 1000 })
      } catch (err) {
        console.error('[WasmPageRenderer] Render failed:', err)
      }
    })
  }, [currentPageIndex, dimensions, isWasmReady, isPaginated])

  // Notify about page/chapter changes
  useEffect(() => {
    if (!isPaginated || totalPages === 0) return
    onPageChange?.(currentPageIndex, totalPages)
  }, [currentPageIndex, totalPages, isPaginated, onPageChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          nextPage()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          previousPage()
          break
        case 'Home':
          e.preventDefault()
          goToPage(0)
          break
        case 'End':
          e.preventDefault()
          if (totalPages > 0) {
            goToPage(totalPages - 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, previousPage, goToPage, totalPages])

  // Mouse event handlers for text selection
  const getMousePosition = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      }
    },
    []
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return // Only left click

      const { x, y } = getMousePosition(e)
      selectionStart(x, y)
      setIsSelecting(true)
      setSelectedText(null)
    },
    [getMousePosition]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isSelecting) return

      const { x, y } = getMousePosition(e)
      selectionUpdate(x, y)

      // Optionally trigger re-render with selection highlight
      // For now, we'll handle this in the render loop
    },
    [isSelecting, getMousePosition]
  )

  const handleMouseUp = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isSelecting) return

      setIsSelecting(false)
      const selection = selectionEnd()

      if (selection?.text) {
        setSelectedText(selection.text)
        console.log('[WasmPageRenderer] Selected text:', selection.text)
      }
    },
    [isSelecting]
  )

  // Handle link clicks
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If we have a selection, don't handle as link click
      if (selectedText) return

      const { x, y } = getMousePosition(e)
      const link = getLinkAtPosition(currentPageIndex, x, y)

      if (link) {
        e.preventDefault()
        e.stopPropagation()

        // Determine if it's an internal link (starts with # or is relative)
        const isInternal = link.startsWith('#') || 
          (!link.startsWith('http://') && !link.startsWith('https://'))

        if (onLinkClick) {
          onLinkClick(link, isInternal)
        } else if (!isInternal) {
          // Default behavior for external links: open in browser
          window.open(link, '_blank', 'noopener,noreferrer')
        } else if (isInternal && link.startsWith('#')) {
          // Internal anchor link - navigate to chapter/anchor
          const anchor = link.substring(1)
          // TODO: Navigate to anchor
          console.log('[WasmPageRenderer] Internal link:', anchor)
        }
      }
    },
    [currentPageIndex, selectedText, getMousePosition, onLinkClick]
  )

  // Copy selected text to clipboard
  const handleCopy = useCallback(
    async (e: ClipboardEvent) => {
      if (selectedText) {
        e.preventDefault()
        await navigator.clipboard.writeText(selectedText)
      }
    },
    [selectedText]
  )

  useEffect(() => {
    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [handleCopy])

  // Click navigation (click on left/right side of page)
  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't navigate if we just finished selecting
      if (selectedText) {
        selectionClear()
        setSelectedText(null)
        return
      }

      const container = containerRef.current
      if (!container) return

      // Don't navigate if clicking on a link or interactive element
      const target = e.target as HTMLElement
      if (target.closest('a') || target.closest('button')) return

      const rect = container.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const containerWidth = rect.width

      // Click on left 35% goes back, right 35% goes forward, middle does nothing
      if (clickX < containerWidth * 0.35) {
        previousPage()
      } else if (clickX > containerWidth * 0.65) {
        nextPage()
      }
    },
    [nextPage, previousPage, selectedText]
  )

  // Check if current page has a bookmark
  const hasBookmark = bookmarks.some((b) => b.pageIndex === currentPageIndex)

  // Loading state
  if (!isWasmReady) {
    return (
      <div
        ref={containerRef}
        className={clsx('flex h-full w-full items-center justify-center', className)}
      >
        <div className="text-gray-500">Initializing reader...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        ref={containerRef}
        className={clsx('flex h-full w-full items-center justify-center', className)}
      >
        <div className="text-center text-red-500">
          <p className="font-medium">Reader Error</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!bookContent) {
    return (
      <div
        ref={containerRef}
        className={clsx('flex h-full w-full items-center justify-center', className)}
      >
        <div className="text-gray-500">No book loaded</div>
      </div>
    )
  }

  const dpr = window.devicePixelRatio || 1

  return (
    <div
      ref={containerRef}
      className={clsx('relative h-full w-full cursor-default', className)}
      onClick={handlePageClick}
    >
      {/* Bookmark indicator */}
      {hasBookmark && (
        <div
          className="bookmark-indicator"
          title="Bookmarked page"
        />
      )}

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: dimensions.width / dpr,
          height: dimensions.height / dpr,
          cursor: isSelecting ? 'text' : 'default',
        }}
        className="block select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />

      {/* Navigation zones */}
      <div
        className="page-nav-zone page-nav-zone--prev"
        onClick={(e) => {
          e.stopPropagation()
          previousPage()
        }}
        role="button"
        aria-label="Previous page"
      >
        <span className="page-nav-hint">‹</span>
      </div>
      <div
        className="page-nav-zone page-nav-zone--next"
        onClick={(e) => {
          e.stopPropagation()
          nextPage()
        }}
        role="button"
        aria-label="Next page"
      >
        <span className="page-nav-hint">›</span>
      </div>

      {/* Page number */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400">
        {isPaginated ? `${currentPageIndex + 1} / ${totalPages}` : 'Loading...'}
      </div>
    </div>
  )
}

export default WasmPageRenderer

