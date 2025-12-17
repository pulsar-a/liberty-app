import { ContainerDimensions, ReaderTypographySettings } from '@app-types/reader.types'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'
import '../../assets/reader-theme.css'

/**
 * API exposed by the MeasurementContainer
 */
export interface MeasurementContainerApi {
  /**
   * Measure the height of HTML content
   */
  measureContent: (htmlContent: string) => number
  
  /**
   * Measure multiple HTML contents and return their heights
   */
  measureContents: (htmlContents: string[]) => number[]
  
  /**
   * Get the available content height (container height minus padding)
   */
  getAvailableHeight: () => number
  
  /**
   * Get the container dimensions
   */
  getContainerDimensions: () => ContainerDimensions
  
  /**
   * Set content and measure incrementally
   * Returns true if content fits, false if it overflows
   */
  testContentFits: (htmlContent: string, availableHeight: number) => boolean
  
  /**
   * Get the scrollHeight of the current content
   */
  getCurrentScrollHeight: () => number
}

interface MeasurementContainerProps {
  /**
   * Container dimensions to match the actual reader dimensions
   */
  dimensions: ContainerDimensions
  
  /**
   * Typography settings to apply
   */
  settings: ReaderTypographySettings
  
  /**
   * Layout mode (single or two-column)
   */
  layoutMode: 'single' | 'two-column'
  
  /**
   * Callback when the measurement container is ready
   */
  onReady?: () => void
}

/**
 * Hidden container for measuring content dimensions.
 * This component renders off-screen with identical styling to the reader
 * and provides methods for measuring content height.
 */
export const MeasurementContainer = forwardRef<MeasurementContainerApi, MeasurementContainerProps>(
  ({ dimensions, settings, layoutMode, onReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const readyCalledRef = useRef(false)

    // Calculate the effective width for content based on layout mode
    const getEffectiveWidth = useCallback(() => {
      if (layoutMode === 'two-column') {
        return dimensions.width / 2
      }
      return dimensions.width
    }, [dimensions.width, layoutMode])

    // Calculate available height for content (total height minus vertical padding)
    const getAvailableHeight = useCallback(() => {
      const paddingY = settings.contentPaddingY * 16 // Convert rem to px (assuming 16px base)
      // Account for page number area at bottom (approximately 2rem)
      const pageNumberHeight = 32
      const available = dimensions.height - (paddingY * 2) - pageNumberHeight
      return available
    }, [dimensions.height, settings.contentPaddingY])

    // Generate CSS variables from settings
    const getCssVariables = useCallback((): React.CSSProperties => {
      return {
        '--page-font-family': `"${settings.fontFamily}", serif`,
        '--page-font-size': `${settings.fontSize}rem`,
        '--page-line-height': `${settings.lineHeight}`,
        '--page-padding-x': `${settings.contentPaddingX}rem`,
        '--page-padding-y': `${settings.contentPaddingY}rem`,
        '--page-max-width': `${settings.maxContentWidth}rem`,
        '--page-text-align': settings.textAlign,
        '--page-hyphens': settings.hyphenation ? 'auto' : 'none',
        '--page-paragraph-spacing': `${settings.paragraphSpacing}em`,
        '--page-paragraph-indent': `${settings.paragraphIndent}em`,
      } as React.CSSProperties
    }, [settings])

    // Expose measurement methods via ref
    useImperativeHandle(ref, () => ({
      measureContent: (htmlContent: string): number => {
        if (!contentRef.current) return 0
        
        contentRef.current.innerHTML = htmlContent
        const height = contentRef.current.scrollHeight
        return height
      },

      measureContents: (htmlContents: string[]): number[] => {
        if (!contentRef.current) return htmlContents.map(() => 0)
        
        return htmlContents.map((html) => {
          contentRef.current!.innerHTML = html
          return contentRef.current!.scrollHeight
        })
      },

      getAvailableHeight,

      getContainerDimensions: (): ContainerDimensions => ({
        width: getEffectiveWidth(),
        height: dimensions.height,
      }),

      testContentFits: (htmlContent: string, availableHeight: number): boolean => {
        if (!contentRef.current) return false
        
        contentRef.current.innerHTML = htmlContent
        const scrollHeight = contentRef.current.scrollHeight
        return scrollHeight <= availableHeight
      },

      getCurrentScrollHeight: (): number => {
        if (!contentRef.current) return 0
        return contentRef.current.scrollHeight
      },
    }), [getAvailableHeight, getEffectiveWidth, dimensions.height])

    // Ensure we have a portal target
    const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

    useEffect(() => {
      // Create a portal container if it doesn't exist
      let container = document.getElementById('measurement-container-portal')
      if (!container) {
        container = document.createElement('div')
        container.id = 'measurement-container-portal'
        container.style.cssText = `
          position: fixed;
          left: -99999px;
          top: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: -1;
        `
        document.body.appendChild(container)
      }
      setPortalTarget(container)

      return () => {
        // Don't remove the portal container on unmount - it can be reused
      }
    }, [])

    // Call onReady when portal target is available
    useEffect(() => {
      if (portalTarget && !readyCalledRef.current) {
        readyCalledRef.current = true
        // Use setTimeout to ensure the portal content has rendered
        const timeoutId = setTimeout(() => {
          onReady?.()
        }, 50) // Small delay to ensure DOM is ready
        return () => clearTimeout(timeoutId)
      }
    }, [portalTarget, onReady])

    if (!portalTarget) {
      return null
    }

    const effectiveWidth = getEffectiveWidth()
    const paddingX = settings.contentPaddingX * 16
    const paddingY = settings.contentPaddingY * 16
    const contentWidth = Math.min(
      effectiveWidth - (paddingX * 2),
      settings.maxContentWidth * 16
    )

    return createPortal(
      <div
        ref={containerRef}
        className="reader-page"
        style={{
          ...getCssVariables(),
          width: `${effectiveWidth}px`,
          height: 'auto', // Don't constrain height for measurement
          minHeight: 0, // Override any min-height
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible', // Allow content to determine height
          boxSizing: 'border-box',
          // Match actual render: use flex column layout
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          ref={contentRef}
          className="page-content"
          style={{
            width: `${contentWidth}px`,
            maxWidth: `${contentWidth}px`,
            margin: '0 auto',
            padding: 0,
            height: 'auto', // Content determines height
            minHeight: 0,
            flex: 'none', // Prevent flex expansion
            overflow: 'visible', // Allow scroll height measurement
            position: 'relative', // Override any absolute positioning
            // Apply typography settings
            fontFamily: `"${settings.fontFamily}", serif`,
            fontSize: `${settings.fontSize}rem`,
            lineHeight: settings.lineHeight,
            textAlign: settings.textAlign,
            hyphens: settings.hyphenation ? 'auto' : 'none',
          }}
        />
      </div>,
      portalTarget
    )
  }
)

MeasurementContainer.displayName = 'MeasurementContainer'

/**
 * Hook to create and manage a measurement container
 */
export function useMeasurementContainer(
  dimensions: ContainerDimensions,
  settings: ReaderTypographySettings,
  layoutMode: 'single' | 'two-column'
) {
  const measurementRef = useRef<MeasurementContainerApi>(null)

  const measureContent = useCallback((html: string): number => {
    return measurementRef.current?.measureContent(html) ?? 0
  }, [])

  const measureContents = useCallback((htmlContents: string[]): number[] => {
    return measurementRef.current?.measureContents(htmlContents) ?? htmlContents.map(() => 0)
  }, [])

  const getAvailableHeight = useCallback((): number => {
    return measurementRef.current?.getAvailableHeight() ?? 0
  }, [])

  const testContentFits = useCallback((html: string, availableHeight: number): boolean => {
    return measurementRef.current?.testContentFits(html, availableHeight) ?? false
  }, [])

  const MeasurementContainerComponent = useCallback(() => (
    <MeasurementContainer
      ref={measurementRef}
      dimensions={dimensions}
      settings={settings}
      layoutMode={layoutMode}
    />
  ), [dimensions, settings, layoutMode])

  return {
    measurementRef,
    measureContent,
    measureContents,
    getAvailableHeight,
    testContentFits,
    MeasurementContainerComponent,
  }
}

