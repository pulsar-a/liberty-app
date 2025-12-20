import { BookPage, BookReference, ContainerDimensions, FittedPage } from '@app-types/reader.types'
import { clsx } from 'clsx'
import React, { useCallback, useEffect, useRef } from 'react'
import { useReaderSettingsStore } from '../../store/useReaderSettingsStore'
import { useReaderStore } from '../../store/useReaderStore'
import '../../assets/reader-theme.css'

interface PageRendererProps {
  className?: string
  onReferenceClick?: (reference: BookReference) => void
  onRemoveBookmark?: (pageIndex: number) => void
  onDimensionsChange?: (dimensions: ContainerDimensions) => void
}

export const PageRenderer: React.FC<PageRendererProps> = ({ 
  className, 
  onReferenceClick, 
  onRemoveBookmark,
  onDimensionsChange,
}) => {
  const {
    paginatedContent,
    fittedContent,
    useClientSidePagination,
    currentPageIndex,
    layoutMode,
    bookmarks,
    nextPage,
    previousPage,
    goToPage,
    openReferencesPanel,
  } = useReaderStore()

  const { settings, getCssVariables } = useReaderSettingsStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Get CSS variables for dynamic styling
  const cssVariables = getCssVariables()

  // Get current page(s) based on layout mode
  const getCurrentPages = (): (BookPage | FittedPage)[] => {
    // Use fitted content if using client-side pagination
    const pages = useClientSidePagination && fittedContent 
      ? fittedContent.pages 
      : paginatedContent?.pages

    if (!pages) return []

    if (layoutMode === 'single') {
      const page = pages[currentPageIndex]
      return page ? [page] : []
    }

    // Two-column mode: show two pages
    const leftPage = pages[currentPageIndex]
    const rightPage = pages[currentPageIndex + 1]
    const result: (BookPage | FittedPage)[] = []

    if (leftPage) result.push(leftPage)
    if (rightPage) result.push(rightPage)

    return result
  }

  const currentPages = getCurrentPages()

  // Check if a page has a bookmark
  const hasBookmark = (pageIndex: number): boolean => {
    return bookmarks.some((b) => b.pageIndex === pageIndex)
  }

  // Handle bookmark indicator click - remove the bookmark
  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent, pageIndex: number) => {
      e.stopPropagation()
      e.preventDefault()
      if (onRemoveBookmark) {
        onRemoveBookmark(pageIndex)
      }
    },
    [onRemoveBookmark]
  )

  // Handle clicks on footnote/reference links
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link) {
        const href = link.getAttribute('href') || ''

        // Check if it's a footnote/reference link
        if (
          href.includes('#fn') ||
          href.includes('#note') ||
          href.includes('footnote') ||
          link.closest('sup')
        ) {
          e.preventDefault()
          e.stopPropagation()

          // Find the reference
          const pages = useClientSidePagination && fittedContent 
            ? fittedContent.pages 
            : paginatedContent?.pages
          const currentPage = pages?.[currentPageIndex]
          
          if (currentPage?.references.length) {
            const refId = href.replace('#', '')
            const reference = currentPage.references.find(
              (r) => r.id === refId || r.id.includes(refId) || refId.includes(r.id)
            )

            if (reference && onReferenceClick) {
              onReferenceClick(reference)
            }

            // Open references panel
            openReferencesPanel()
          }
        } else {
          // Regular link - prevent navigation for now
          e.preventDefault()
        }
      }
    },
    [currentPageIndex, paginatedContent, fittedContent, useClientSidePagination, onReferenceClick, openReferencesPanel]
  )

  // Set up ResizeObserver to report dimensions
  useEffect(() => {
    if (!containerRef.current || !onDimensionsChange) return

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        onDimensionsChange({ width, height })
      }
    }

    resizeObserverRef.current = new ResizeObserver(handleResize)
    resizeObserverRef.current.observe(containerRef.current)

    // Report initial dimensions
    const rect = containerRef.current.getBoundingClientRect()
    onDimensionsChange({ width: rect.width, height: rect.height })

    return () => {
      resizeObserverRef.current?.disconnect()
    }
  }, [onDimensionsChange])

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

      const totalPages = useClientSidePagination && fittedContent 
        ? fittedContent.totalPages 
        : paginatedContent?.totalPages ?? 0

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
  }, [nextPage, previousPage, goToPage, paginatedContent, fittedContent, useClientSidePagination])

  // Click navigation (click on left/right side of page)
  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
    [nextPage, previousPage]
  )

  // Get total pages for display
  const totalPages = useClientSidePagination && fittedContent 
    ? fittedContent.totalPages 
    : paginatedContent?.totalPages ?? 0

  // If no pages yet, still render the container so we can measure dimensions
  // This is crucial for client-side pagination to work
  if (totalPages === 0 || currentPages.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={clsx('flex h-full w-full items-center justify-center', className)}
      >
        {/* Empty container - dimensions will be reported for pagination */}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative h-full w-full cursor-default select-text',
        layoutMode === 'two-column' && 'reader-spread',
        className
      )}
      style={cssVariables as React.CSSProperties}
      onClick={handlePageClick}
    >
      {currentPages.map((page, index) => (
        <div
          key={`${page.pageIndex}-${index}`}
          ref={index === 0 ? pageRef : undefined}
          className={clsx(
            'reader-page relative h-full',
            `reader-theme-${settings.theme}`,
            layoutMode === 'two-column' && index === 0 && 'border-r border-black/5'
          )}
        >
          {/* Bookmark indicator - click to remove */}
          {hasBookmark(page.pageIndex) && (
            <div
              className="bookmark-indicator cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => handleBookmarkClick(e, page.pageIndex)}
              title="Click to remove bookmark"
              role="button"
              aria-label="Remove bookmark"
            />
          )}

          {/* Page content */}
          <div
            className="page-content"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: page.htmlContent }}
          />

          {/* Page number */}
          <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400">
            {page.pageIndex + 1}
          </div>
        </div>
      ))}

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
    </div>
  )
}
