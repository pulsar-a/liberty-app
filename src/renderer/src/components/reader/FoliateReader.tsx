import type { ReaderPosition, TocEntry } from '@app-types/reader.types'
import type { FoliateRelocateDetail, FoliateTocItem, View as FoliateView } from 'foliate-js/view.js'
import 'foliate-js/view.js'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import literataBoldUrl from '../../assets/fonts/reading/Literata_18pt-Bold.ttf?url'
import literataBoldItalicUrl from '../../assets/fonts/reading/Literata_18pt-BoldItalic.ttf?url'
import literataItalicUrl from '../../assets/fonts/reading/Literata_18pt-Italic.ttf?url'
import literataRegularUrl from '../../assets/fonts/reading/Literata_18pt-Regular.ttf?url'
import notoSansBoldUrl from '../../assets/fonts/reading/NotoSans-Bold.ttf?url'
import notoSansBoldItalicUrl from '../../assets/fonts/reading/NotoSans-BoldItalic.ttf?url'
import notoSansItalicUrl from '../../assets/fonts/reading/NotoSans-Italic.ttf?url'
import notoSansRegularUrl from '../../assets/fonts/reading/NotoSans-Regular.ttf?url'
import { READER_THEMES, useReaderSettingsStore } from '../../store/useReaderSettingsStore'

export interface FoliateReaderApi {
  goTo: (target: string | ReaderPosition) => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
}

export interface FoliateReaderLocation {
  currentPageIndex: number
  totalPages: number
  progression: number
}

interface FoliateReaderProps {
  bookFileId: number
  initialPosition: ReaderPosition | null
  onPositionChange: (position: ReaderPosition, location: FoliateReaderLocation) => void
  onReady: (toc: TocEntry[]) => void
  onError: (message: string) => void
}

const convertToc = (items: FoliateTocItem[] = [], level = 0): TocEntry[] =>
  items.map((item, index) => ({
    id: `${level}-${index}-${item.href ?? item.label ?? ''}`,
    title: item.label || 'Untitled',
    href: item.href || '',
    order: index,
    level,
    children: item.subitems?.length ? convertToc(item.subitems, level + 1) : undefined,
  }))

const clampProgression = (value: number): number => Math.min(1, Math.max(0, value))

const getFontFaceStyles = (): string => {
  const resolveUrl = (url: string) => new URL(url, document.baseURI).href

  return `
    @font-face {
      font-family: "Literata";
      src: url("${resolveUrl(literataRegularUrl)}") format("truetype");
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: "Literata";
      src: url("${resolveUrl(literataBoldUrl)}") format("truetype");
      font-style: normal;
      font-weight: 700;
    }
    @font-face {
      font-family: "Literata";
      src: url("${resolveUrl(literataItalicUrl)}") format("truetype");
      font-style: italic;
      font-weight: 400;
    }
    @font-face {
      font-family: "Literata";
      src: url("${resolveUrl(literataBoldItalicUrl)}") format("truetype");
      font-style: italic;
      font-weight: 700;
    }
    @font-face {
      font-family: "Noto Sans";
      src: url("${resolveUrl(notoSansRegularUrl)}") format("truetype");
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: "Noto Sans";
      src: url("${resolveUrl(notoSansBoldUrl)}") format("truetype");
      font-style: normal;
      font-weight: 700;
    }
    @font-face {
      font-family: "Noto Sans";
      src: url("${resolveUrl(notoSansItalicUrl)}") format("truetype");
      font-style: italic;
      font-weight: 400;
    }
    @font-face {
      font-family: "Noto Sans";
      src: url("${resolveUrl(notoSansBoldItalicUrl)}") format("truetype");
      font-style: italic;
      font-weight: 700;
    }
  `
}

export const FoliateReader = forwardRef<FoliateReaderApi, FoliateReaderProps>(
  ({ bookFileId, initialPosition, onPositionChange, onReady, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<FoliateView | null>(null)
    const initialPositionRef = useRef(initialPosition)
    const callbacksRef = useRef({ onPositionChange, onReady, onError })
    const { settings } = useReaderSettingsStore()
    const theme = READER_THEMES.find((item) => item.id === settings.theme) ?? READER_THEMES[0]

    useEffect(() => {
      initialPositionRef.current = initialPosition
    }, [bookFileId, initialPosition])

    useEffect(() => {
      callbacksRef.current = { onPositionChange, onReady, onError }
    }, [onError, onPositionChange, onReady])

    const applySettings = useCallback(() => {
      const view = viewRef.current
      if (!view?.renderer) return

      const maxWidthPx = settings.maxContentWidth * 16
      const fontFallback = settings.fontFamily === 'Noto Sans' ? 'sans-serif' : 'serif'

      view.renderer.setAttribute('flow', 'paginated')
      view.renderer.setAttribute('gap', `${Math.min(12, settings.columnGap * 2)}%`)
      view.renderer.setAttribute('margin', `${settings.contentPaddingY * 16}px`)
      view.renderer.setAttribute('max-inline-size', `${maxWidthPx}px`)
      view.renderer.setAttribute('max-column-count', String(settings.columns))
      view.renderer.setStyles?.(`
        ${getFontFaceStyles()}
        :root {
          color-scheme: ${settings.theme === 'dark' || settings.theme === 'night' || settings.theme === 'high-contrast-dark' ? 'dark' : 'light'};
          --theme-bg-color: ${theme.backgroundColor};
        }
        html, body {
          background: ${theme.backgroundColor} !important;
          color: ${theme.textColor} !important;
          font-size: ${settings.fontSize}rem !important;
          line-height: ${settings.lineHeight} !important;
          text-align: ${settings.textAlign} !important;
          hyphens: ${settings.hyphenation ? 'auto' : 'none'} !important;
        }
        body, body * {
          font-family: "${settings.fontFamily}", ${fontFallback} !important;
        }
        p {
          margin-block: ${settings.paragraphSpacing}em !important;
          text-indent: ${settings.paragraphIndent}em;
        }
      `)
    }, [settings, theme])

    const applySettingsRef = useRef(applySettings)
    useEffect(() => {
      applySettingsRef.current = applySettings
    }, [applySettings])

    useImperativeHandle(
      ref,
      () => ({
        goTo: async (target) => {
          const view = viewRef.current
          if (!view) return

          if (typeof target === 'string') {
            await view.goTo(target)
          } else if (target.locator.kind === 'cfi') {
            await view.goTo(target.locator.value)
          } else {
            await view.goToFraction(target.progression)
          }
        },
        next: async () => {
          await viewRef.current?.goRight()
        },
        previous: async () => {
          await viewRef.current?.goLeft()
        },
      }),
      []
    )

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      let cancelled = false
      const view = document.createElement('foliate-view') as FoliateView
      view.className = 'block h-full w-full'
      viewRef.current = view
      container.append(view)

      const handleRelocate = (event: Event) => {
        const detail = (event as CustomEvent<FoliateRelocateDetail>).detail
        if (!detail?.cfi || !Number.isFinite(detail.fraction)) return

        const progression = clampProgression(detail.fraction)
        const totalPages = Math.max(1, detail.location?.total ?? 1)
        const currentPageIndex = Math.min(
          Math.max(0, detail.location?.current ?? Math.round(progression * (totalPages - 1))),
          totalPages - 1
        )

        callbacksRef.current.onPositionChange(
          {
            engine: 'foliate',
            progression,
            locator: { kind: 'cfi', value: detail.cfi },
          },
          { currentPageIndex, totalPages, progression }
        )
      }

      const handleExternalLink = (event: Event) => {
        event.preventDefault()
        const detail = (event as CustomEvent<{ href_?: string; a?: HTMLAnchorElement }>).detail
        const href = detail?.href_ ?? detail?.a?.href
        if (href) void window.api.openExternal(href)
      }

      view.addEventListener('relocate', handleRelocate)
      view.addEventListener('external-link', handleExternalLink)

      const open = async () => {
        try {
          await view.open(`liberty-book://file/${bookFileId}`)
          if (cancelled) return

          applySettingsRef.current()
          callbacksRef.current.onReady(convertToc(view.book?.toc))

          const initialPosition = initialPositionRef.current
          const lastLocation =
            initialPosition?.locator.kind === 'cfi'
              ? initialPosition.locator.value
              : initialPosition
                ? { fraction: initialPosition.progression }
                : undefined
          await view.init({ lastLocation, showTextStart: !lastLocation })
        } catch (error) {
          if (!cancelled) {
            callbacksRef.current.onError(error instanceof Error ? error.message : String(error))
          }
        }
      }

      void open()

      return () => {
        cancelled = true
        view.removeEventListener('relocate', handleRelocate)
        view.removeEventListener('external-link', handleExternalLink)
        view.book?.destroy?.()
        view.remove()
        if (viewRef.current === view) viewRef.current = null
      }
    }, [bookFileId])

    useEffect(() => {
      applySettings()
    }, [applySettings])

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
          void viewRef.current?.goRight()
        } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
          event.preventDefault()
          void viewRef.current?.goLeft()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
      <div
        className="relative h-full w-full overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <div ref={containerRef} className="h-full w-full overflow-hidden" />
        <button
          type="button"
          className="page-nav-zone page-nav-zone--prev"
          onClick={() => void viewRef.current?.goLeft()}
          aria-label="Previous page"
        >
          <span className="page-nav-hint">‹</span>
        </button>
        <button
          type="button"
          className="page-nav-zone page-nav-zone--next"
          onClick={() => void viewRef.current?.goRight()}
          aria-label="Next page"
        >
          <span className="page-nav-hint">›</span>
        </button>
      </div>
    )
  }
)

FoliateReader.displayName = 'FoliateReader'
