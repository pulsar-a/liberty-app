import { DOMParser } from '@xmldom/xmldom'
import {
  BookChapter,
  BookContent,
  BookPage,
  BookReference,
  PageBoundary,
  PaginatedContent,
  PaginationConfig,
} from '../../../types/reader.types'
import { logger } from '../utils/logger'

// Default characters per page based on layout mode
// Very conservative estimates to ensure content fits within visible page area
// These values account for larger fonts, line-heights, and variable content
const DEFAULT_CHARS_PER_PAGE = {
  single: 900,       // Very conservative for single page mode
  'two-column': 600, // Per column - very conservative for spread mode
}

/**
 * Service for paginating book content
 * Pre-computes page boundaries when a book is opened
 */
export class PaginationService {
  private config: PaginationConfig

  constructor(config?: Partial<PaginationConfig>) {
    this.config = {
      mode: config?.mode || 'single',
      charsPerPage:
        config?.charsPerPage || DEFAULT_CHARS_PER_PAGE[config?.mode || 'single'],
      containerWidth: config?.containerWidth,
      containerHeight: config?.containerHeight,
    }
  }

  /**
   * Paginate the entire book content
   */
  paginate(content: BookContent): PaginatedContent {
    const pages: BookPage[] = []
    const pageBoundaries: PageBoundary[] = []

    for (const chapter of content.chapters) {
      const chapterPages = this.paginateChapter(chapter, content.references, pages.length)
      pages.push(...chapterPages.pages)
      pageBoundaries.push(...chapterPages.boundaries)
    }

    logger.debug(`Paginated book into ${pages.length} pages`)

    return {
      pages,
      totalPages: pages.length,
      pageBoundaries,
    }
  }

  /**
   * Paginate a single chapter
   */
  private paginateChapter(
    chapter: BookChapter,
    allReferences: BookReference[],
    startPageIndex: number
  ): { pages: BookPage[]; boundaries: PageBoundary[] } {
    const pages: BookPage[] = []
    const boundaries: PageBoundary[] = []

    // Get references for this chapter
    const chapterReferences = allReferences.filter((ref) => ref.chapterId === chapter.id)

    // Split the chapter HTML into logical segments
    const segments = this.splitIntoSegments(chapter.htmlContent)

    let currentPageContent = ''
    let currentCharCount = 0
    let segmentIndex = 0
    const maxChars = this.config.charsPerPage

    for (const segment of segments) {
      const segmentText = this.getTextContent(segment)
      const segmentCharCount = segmentText.length

      // Check if adding this segment would exceed the page limit
      if (currentCharCount > 0 && currentCharCount + segmentCharCount > maxChars) {
        // Create a page with current content
        const pageIndex = startPageIndex + pages.length
        const pageReferences = this.getReferencesForContent(
          currentPageContent,
          chapterReferences
        )

        pages.push({
          pageIndex,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          htmlContent: this.wrapPageContent(currentPageContent),
          references: pageReferences,
        })

        boundaries.push({
          pageIndex,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          startOffset: segmentIndex - 1,
          endOffset: segmentIndex,
        })

        // Reset for next page
        currentPageContent = ''
        currentCharCount = 0
      }

      // Add segment to current page
      currentPageContent += segment
      currentCharCount += segmentCharCount
      segmentIndex++
    }

    // Add remaining content as final page
    if (currentPageContent.trim()) {
      const pageIndex = startPageIndex + pages.length
      const pageReferences = this.getReferencesForContent(
        currentPageContent,
        chapterReferences
      )

      pages.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        htmlContent: this.wrapPageContent(currentPageContent),
        references: pageReferences,
      })

      boundaries.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        startOffset: segmentIndex,
        endOffset: segmentIndex,
      })
    }

    // Ensure at least one page per chapter
    if (pages.length === 0) {
      const pageIndex = startPageIndex
      pages.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        htmlContent: this.wrapPageContent('<p></p>'),
        references: [],
      })

      boundaries.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        startOffset: 0,
        endOffset: 0,
      })
    }

    return { pages, boundaries }
  }

  /**
   * Split HTML content into logical segments that shouldn't be broken
   * (paragraphs, headings, block elements, etc.)
   */
  private splitIntoSegments(html: string): string[] {
    const segments: string[] = []

    // Parse the HTML
    const doc = new DOMParser().parseFromString(`<root>${html}</root>`, 'text/html')
    const root = doc.documentElement

    if (!root) {
      return [html]
    }

    // Process child nodes
    this.extractSegments(root, segments)

    // If no segments found, return the original HTML as one segment
    if (segments.length === 0) {
      return [html]
    }

    return segments
  }

  /**
   * Recursively extract segments from DOM nodes
   */
  private extractSegments(node: Element, segments: string[]): void {
    const blockElements = new Set([
      'p',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'ul',
      'ol',
      'li',
      'table',
      'tr',
      'figure',
      'figcaption',
      'section',
      'article',
      'aside',
      'header',
      'footer',
      'nav',
      'hr',
      'br',
    ])

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]

      if (child.nodeType === 3) {
        // Text node
        const text = child.textContent?.trim()
        if (text) {
          segments.push(text)
        }
      } else if (child.nodeType === 1) {
        // Element node
        const element = child as Element
        const tagName = element.tagName.toLowerCase()

        if (blockElements.has(tagName)) {
          // Serialize this block element as a segment
          const serializer = new (require('@xmldom/xmldom').XMLSerializer)()
          segments.push(serializer.serializeToString(element))
        } else {
          // Recurse into inline elements
          this.extractSegments(element, segments)
        }
      }
    }
  }

  /**
   * Get plain text content from HTML
   */
  private getTextContent(html: string): string {
    const doc = new DOMParser().parseFromString(`<root>${html}</root>`, 'text/html')
    return doc.documentElement?.textContent || ''
  }

  /**
   * Find references that are linked from the given content
   */
  private getReferencesForContent(
    content: string,
    chapterReferences: BookReference[]
  ): BookReference[] {
    const foundReferences: BookReference[] = []

    for (const ref of chapterReferences) {
      // Check if the reference ID or marker appears in the content
      if (content.includes(ref.id) || content.includes(`#${ref.id}`)) {
        foundReferences.push(ref)
      }

      // Also check for common footnote link patterns
      const markerNum = ref.marker.replace(/[\[\]\(\)]/g, '')
      if (
        content.includes(`href="#fn${markerNum}"`) ||
        content.includes(`href="#note${markerNum}"`) ||
        content.includes(`href="#footnote${markerNum}"`)
      ) {
        if (!foundReferences.includes(ref)) {
          foundReferences.push(ref)
        }
      }
    }

    return foundReferences
  }

  /**
   * Wrap page content with proper structure for rendering
   * Note: Don't wrap with page-content as PageRenderer already provides that wrapper
   */
  private wrapPageContent(content: string): string {
    return content
  }

  /**
   * Update pagination config
   */
  setConfig(config: Partial<PaginationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }

    // Update chars per page based on mode if not explicitly set
    if (config.mode && !config.charsPerPage) {
      this.config.charsPerPage = DEFAULT_CHARS_PER_PAGE[config.mode]
    }
  }

  /**
   * Get current config
   */
  getConfig(): PaginationConfig {
    return { ...this.config }
  }
}

// Export a singleton instance for simple usage
export const paginationService = new PaginationService()

