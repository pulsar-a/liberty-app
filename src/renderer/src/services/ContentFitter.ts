import {
  BookChapter,
  BookContent,
  BookReference,
  ContainerDimensions,
  ContentSegment,
  ContentSegmentType,
  FittedContent,
  FittedPage,
  FittingConfig,
  FittingProgressCallback,
  ImageDimension,
  ParsedChapterContent,
  ReaderTypographySettings,
} from '@app-types/reader.types'
import { imagePreloader } from './ImagePreloader'
import { MeasurementContainerApi } from '../components/reader/MeasurementContainer'

/**
 * Service for fitting book content into pages based on actual rendered dimensions.
 * This replaces the character-count based pagination with accurate DOM measurements.
 */
export class ContentFitter {
  private measurementApi: MeasurementContainerApi | null = null
  private segmentCache: Map<string, ContentSegment[]> = new Map()
  private measurementCache: Map<string, number> = new Map()

  /**
   * Set the measurement API (from MeasurementContainer ref)
   */
  setMeasurementApi(api: MeasurementContainerApi | null): void {
    this.measurementApi = api
    // Clear measurement cache when API changes (dimensions might have changed)
    this.measurementCache.clear()
  }

  /**
   * Parse HTML content into segments
   */
  parseHtmlToSegments(html: string, chapterId: string): ContentSegment[] {
    const cacheKey = `${chapterId}:${html.length}`
    const cached = this.segmentCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const segments: ContentSegment[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
    const container = doc.body.firstChild as HTMLElement

    if (!container) {
      return segments
    }

    let segmentIndex = 0

    const processNode = (node: Node, depth: number = 0): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text && depth === 1) {
          // Top-level text node - wrap in paragraph
          segments.push({
            id: `${chapterId}-seg-${segmentIndex++}`,
            type: 'paragraph',
            htmlContent: `<p>${text}</p>`,
            textContent: text,
          })
        }
        return
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return
      }

      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()

      // Determine segment type
      const segmentType = this.getSegmentType(tagName)

      if (this.isBlockElement(tagName)) {
        const segment: ContentSegment = {
          id: `${chapterId}-seg-${segmentIndex++}`,
          type: segmentType,
          htmlContent: element.outerHTML,
          textContent: element.textContent || '',
        }

        // Add heading level for headings
        if (tagName.match(/^h[1-6]$/)) {
          segment.headingLevel = parseInt(tagName[1], 10)
          segment.keepWithNext = true // Headings should stay with next content
        }

        // Handle images
        if (tagName === 'img' || tagName === 'figure') {
          const img = tagName === 'img' ? element : element.querySelector('img')
          if (img) {
            const src = img.getAttribute('src') || ''
            const cached = imagePreloader.getCachedDimension(src)
            if (cached && cached.loaded) {
              segment.imageData = {
                src,
                naturalWidth: cached.naturalWidth,
                naturalHeight: cached.naturalHeight,
                scaledWidth: 0, // Will be calculated during fitting
                scaledHeight: 0,
              }
            }
          }
        }

        segments.push(segment)
      } else {
        // For inline elements at top level, recurse into children
        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i], depth)
        }
      }
    }

    // Process direct children
    for (let i = 0; i < container.childNodes.length; i++) {
      processNode(container.childNodes[i], 1)
    }

    this.segmentCache.set(cacheKey, segments)
    return segments
  }

  /**
   * Get the segment type for an HTML tag
   */
  private getSegmentType(tagName: string): ContentSegmentType {
    switch (tagName) {
      case 'p':
        return 'paragraph'
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return 'heading'
      case 'blockquote':
        return 'blockquote'
      case 'ul':
      case 'ol':
        return 'list'
      case 'li':
        return 'listItem'
      case 'img':
        return 'image'
      case 'figure':
        return 'figure'
      case 'pre':
        return 'codeBlock'
      case 'table':
        return 'table'
      case 'hr':
        return 'hr'
      default:
        return 'unknown'
    }
  }

  /**
   * Check if a tag is a block element
   */
  private isBlockElement(tagName: string): boolean {
    const blockElements = new Set([
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'ul', 'ol', 'li', 'table',
      'figure', 'figcaption', 'section', 'article',
      'aside', 'header', 'footer', 'nav', 'hr', 'img',
      'address', 'dl', 'dt', 'dd', 'form', 'fieldset',
    ])
    return blockElements.has(tagName)
  }

  /**
   * Try to split an oversized segment into smaller parts
   * Returns array with original segment if splitting not possible
   * 
   * For blockquotes: Split at <br> tags, first part keeps blockquote styling,
   * continuation parts use a special class without the left border.
   */
  private trySplitSegment(
    segment: ContentSegment,
    maxHeight: number,
    chapterId: string
  ): ContentSegment[] {
    // Only split certain types
    if (!['blockquote', 'list'].includes(segment.type)) {
      return [segment]
    }

    const html = segment.htmlContent
    
    // For blockquotes with <br> tags (poems), split into continuation parts
    if (segment.type === 'blockquote' && (html.includes('<br') || html.includes('<BR'))) {
      const parts = this.splitBlockquoteForContinuation(html, chapterId)
      if (parts.length > 1) {
        return this.combineFittingParts(parts, maxHeight)
      }
    }
    
    // For lists, try to split by list items
    if (segment.type === 'list' && (html.includes('<li') || html.includes('<LI'))) {
      const parts = this.splitListItems(html, chapterId)
      if (parts.length > 1) {
        return this.combineFittingParts(parts, maxHeight)
      }
    }

    // Could not split
    return [segment]
  }

  /**
   * Split blockquote into parts for page continuation
   * First part keeps blockquote styling, subsequent parts use continuation class
   */
  private splitBlockquoteForContinuation(html: string, chapterId: string): ContentSegment[] {
    // Extract inner content from blockquote
    const blockquoteMatch = html.match(/<blockquote([^>]*)>([\s\S]*)<\/blockquote>/i)
    if (!blockquoteMatch) {
      return []
    }

    const attrs = blockquoteMatch[1]
    const innerHtml = blockquoteMatch[2]
    
    // Split at <br> tags
    const lines = innerHtml.split(/<br\s*\/?>/i).filter(line => line.trim())
    
    if (lines.length <= 1) {
      return []
    }

    // Group lines into chunks (e.g., 4-6 lines per chunk for visual continuity)
    const linesPerChunk = 5
    const chunks: string[][] = []
    for (let i = 0; i < lines.length; i += linesPerChunk) {
      chunks.push(lines.slice(i, i + linesPerChunk))
    }

    // Create segments - first chunk is blockquote, rest are continuations
    const segments: ContentSegment[] = []
    let segIndex = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunkLines = chunks[i].join('<br>')
      const isFirst = i === 0
      
      // First part: regular blockquote
      // Continuation parts: div with continuation class (no left border)
      const htmlContent = isFirst
        ? `<blockquote${attrs}>${chunkLines}</blockquote>`
        : `<div class="blockquote-continuation">${chunkLines}</div>`

      segments.push({
        id: `${chapterId}-bq-${segIndex++}-${Date.now()}`,
        type: isFirst ? 'blockquote' : 'paragraph', // continuation treated as paragraph
        htmlContent,
        textContent: chunkLines.replace(/<[^>]+>/g, '').trim(),
      })
    }

    return segments
  }

  /**
   * Split content at <br> tags
   */
  private splitAtBreaks(html: string, type: ContentSegmentType, chapterId: string): ContentSegment[] {
    // Extract the tag wrapper (e.g., <blockquote>, <p>)
    const openTagMatch = html.match(/^<(\w+)([^>]*)>/)
    const closeTagMatch = html.match(/<\/(\w+)>\s*$/)
    
    if (!openTagMatch || !closeTagMatch) {
      return []
    }

    const tagName = openTagMatch[1]
    const tagAttrs = openTagMatch[2]
    const innerHtml = html.slice(openTagMatch[0].length, html.length - closeTagMatch[0].length)
    
    // Split at <br> tags
    const parts = innerHtml.split(/<br\s*\/?>/i).filter(p => p.trim())
    
    if (parts.length <= 1) {
      return []
    }

    // Create segments from parts
    let segIndex = 0
    return parts.map(part => ({
      id: `${chapterId}-split-${segIndex++}-${Date.now()}`,
      type,
      htmlContent: `<${tagName}${tagAttrs}>${part.trim()}</${tagName}>`,
      textContent: part.replace(/<[^>]+>/g, '').trim(),
    }))
  }

  /**
   * Split list into individual items
   */
  private splitListItems(html: string, chapterId: string): ContentSegment[] {
    const isOrdered = html.toLowerCase().startsWith('<ol')
    const listMatch = html.match(/^<(ul|ol)([^>]*)>([\s\S]*)<\/\1>$/i)
    
    if (!listMatch) {
      return []
    }

    const tagName = listMatch[1]
    const tagAttrs = listMatch[2]
    const innerHtml = listMatch[3]
    
    // Extract list items
    const itemMatches = innerHtml.match(/<li[^>]*>[\s\S]*?<\/li>/gi)
    
    if (!itemMatches || itemMatches.length <= 1) {
      return []
    }

    // Create segments - each containing a list with one item
    let segIndex = 0
    return itemMatches.map(item => ({
      id: `${chapterId}-split-${segIndex++}-${Date.now()}`,
      type: 'listItem' as ContentSegmentType,
      htmlContent: `<${tagName}${tagAttrs}>${item}</${tagName}>`,
      textContent: item.replace(/<[^>]+>/g, '').trim(),
    }))
  }

  /**
   * Combine split parts that fit together on the same page
   */
  private combineFittingParts(parts: ContentSegment[], maxHeight: number): ContentSegment[] {
    if (parts.length === 0) return []
    
    const result: ContentSegment[] = []
    let currentGroup: ContentSegment[] = []
    
    for (const part of parts) {
      const testGroup = [...currentGroup, part]
      const combinedHtml = testGroup.map(p => p.htmlContent).join('')
      const combinedSegment: ContentSegment = {
        id: testGroup[0].id,
        type: testGroup[0].type,
        htmlContent: combinedHtml,
        textContent: testGroup.map(p => p.textContent).join(' '),
      }
      
      const height = this.measureSegment(combinedSegment)
      
      if (height <= maxHeight) {
        // Still fits, add to current group
        currentGroup = testGroup
      } else if (currentGroup.length > 0) {
        // Doesn't fit, save current group and start new one
        const groupHtml = currentGroup.map(p => p.htmlContent).join('')
        result.push({
          id: currentGroup[0].id,
          type: currentGroup[0].type,
          htmlContent: groupHtml,
          textContent: currentGroup.map(p => p.textContent).join(' '),
        })
        currentGroup = [part]
      } else {
        // Single part that doesn't fit - add it anyway
        currentGroup = [part]
      }
    }
    
    // Add remaining group
    if (currentGroup.length > 0) {
      const groupHtml = currentGroup.map(p => p.htmlContent).join('')
      result.push({
        id: currentGroup[0].id,
        type: currentGroup[0].type,
        htmlContent: groupHtml,
        textContent: currentGroup.map(p => p.textContent).join(' '),
      })
    }
    
    return result
  }

  /**
   * Measure the height of a segment
   */
  measureSegment(segment: ContentSegment): number {
    if (!this.measurementApi) {
      console.warn('MeasurementApi not set, using estimated height')
      return this.estimateSegmentHeight(segment)
    }

    const cacheKey = `${segment.id}:${segment.htmlContent.length}`
    const cached = this.measurementCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    const height = this.measurementApi.measureContent(segment.htmlContent)
    this.measurementCache.set(cacheKey, height)
    return height
  }

  /**
   * Estimate segment height without DOM measurement (fallback)
   */
  private estimateSegmentHeight(segment: ContentSegment): number {
    const baseLineHeight = 28 // Approximate line height in pixels
    const charsPerLine = 60

    switch (segment.type) {
      case 'paragraph':
        const lines = Math.ceil(segment.textContent.length / charsPerLine)
        return lines * baseLineHeight + 20 // Add margin
      case 'heading':
        const headingMultiplier = segment.headingLevel
          ? 2.5 - (segment.headingLevel * 0.2)
          : 1.5
        return baseLineHeight * headingMultiplier + 32
      case 'image':
      case 'figure':
        return segment.imageData?.scaledHeight || 200
      case 'blockquote':
        const quoteLines = Math.ceil(segment.textContent.length / (charsPerLine - 10))
        return quoteLines * baseLineHeight + 40
      case 'list':
        const items = (segment.htmlContent.match(/<li/g) || []).length
        return items * baseLineHeight + 20
      case 'codeBlock':
        const codeLines = segment.textContent.split('\n').length
        return codeLines * 24 + 32
      case 'hr':
        return 40
      default:
        return baseLineHeight + 16
    }
  }

  /**
   * Measure combined height of multiple segments
   */
  measureCombinedContent(segments: ContentSegment[]): number {
    if (!this.measurementApi) {
      return segments.reduce((total, seg) => total + this.estimateSegmentHeight(seg), 0)
    }

    const combinedHtml = segments.map(s => s.htmlContent).join('')
    return this.measurementApi.measureContent(combinedHtml)
  }

  /**
   * Get references that appear in given segments
   */
  private getReferencesForSegments(
    segments: ContentSegment[],
    allReferences: BookReference[]
  ): BookReference[] {
    const combinedHtml = segments.map(s => s.htmlContent).join('')
    const foundRefs: BookReference[] = []

    for (const ref of allReferences) {
      if (
        combinedHtml.includes(ref.id) ||
        combinedHtml.includes(`#${ref.id}`) ||
        combinedHtml.includes(`href="#fn${ref.marker.replace(/[\[\]]/g, '')}"`)
      ) {
        if (!foundRefs.includes(ref)) {
          foundRefs.push(ref)
        }
      }
    }

    return foundRefs
  }

  /**
   * Fit segments into pages
   */
  fitSegmentsToPages(
    segments: ContentSegment[],
    chapterId: string,
    chapterTitle: string,
    references: BookReference[],
    availableHeight: number,
    startPageIndex: number
  ): FittedPage[] {
    const pages: FittedPage[] = []
    let currentPageSegments: ContentSegment[] = []
    let currentHeight = 0
    let pageIndex = startPageIndex

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const segmentHeight = this.measureSegment(segment)

      // Add safety margin for single segment check too
      const safeAvailableHeightForSingle = availableHeight * 0.95

      // Check if this segment alone is taller than available height
      if (segmentHeight > safeAvailableHeightForSingle && currentPageSegments.length === 0) {
        // Segment is too tall - try to split it
        const splitSegments = this.trySplitSegment(segment, safeAvailableHeightForSingle, chapterId)
        
        if (splitSegments.length > 1) {
          // Successfully split - process each part
          for (const splitSeg of splitSegments) {
            const splitHeight = this.measureSegment(splitSeg)
            
            if (splitHeight > safeAvailableHeightForSingle && currentPageSegments.length > 0) {
              // This split part still doesn't fit, create page with current content first
              pages.push(this.createFittedPage(
                pageIndex++,
                chapterId,
                chapterTitle,
                currentPageSegments,
                references,
                currentHeight,
                availableHeight
              ))
              currentPageSegments = []
              currentHeight = 0
            }
            
            currentPageSegments.push(splitSeg)
            currentHeight = this.measureCombinedContent(currentPageSegments)
            
            // If this split part fills the page, create a new page
            if (currentHeight >= safeAvailableHeightForSingle) {
              pages.push(this.createFittedPage(
                pageIndex++,
                chapterId,
                chapterTitle,
                currentPageSegments,
                references,
                currentHeight,
                availableHeight
              ))
              currentPageSegments = []
              currentHeight = 0
            }
          }
          continue
        }
        
        // Could not split - add as oversized (will overflow)
        currentPageSegments.push(segment)
        currentHeight = segmentHeight

        // Create page with oversized content
        pages.push(this.createFittedPage(
          pageIndex++,
          chapterId,
          chapterTitle,
          currentPageSegments,
          references,
          currentHeight,
          availableHeight
        ))

        currentPageSegments = []
        currentHeight = 0
        continue
      }

      // Check if adding this segment would overflow
      const combinedHeight = this.measureCombinedContent([...currentPageSegments, segment])

      // Add a safety margin (5%) to account for rendering differences
      const safeAvailableHeight = availableHeight * 0.95

      if (combinedHeight > safeAvailableHeight) {
        // Would overflow - check if we need to keep with previous
        if (currentPageSegments.length > 0) {
          // Create page with current content
          pages.push(this.createFittedPage(
            pageIndex++,
            chapterId,
            chapterTitle,
            currentPageSegments,
            references,
            currentHeight,
            availableHeight
          ))

          currentPageSegments = []
          currentHeight = 0
        }

        // Check if this segment itself is oversized (now that we're starting fresh)
        if (segmentHeight > safeAvailableHeight) {
          // Try to split the oversized segment
          const splitSegments = this.trySplitSegment(segment, safeAvailableHeight, chapterId)
          
          if (splitSegments.length > 1) {
            // Successfully split - add parts
            for (const splitSeg of splitSegments) {
              const splitHeight = this.measureSegment(splitSeg)
              
              if (currentPageSegments.length > 0 && currentHeight + splitHeight > safeAvailableHeight) {
                // Create page with current content
                pages.push(this.createFittedPage(
                  pageIndex++,
                  chapterId,
                  chapterTitle,
                  currentPageSegments,
                  references,
                  currentHeight,
                  availableHeight
                ))
                currentPageSegments = []
                currentHeight = 0
              }
              
              currentPageSegments.push(splitSeg)
              currentHeight = this.measureCombinedContent(currentPageSegments)
            }
            continue
          }
          
          // Could not split - add as oversized page
          currentPageSegments.push(segment)
          currentHeight = segmentHeight
          
          pages.push(this.createFittedPage(
            pageIndex++,
            chapterId,
            chapterTitle,
            currentPageSegments,
            references,
            currentHeight,
            availableHeight
          ))
          
          currentPageSegments = []
          currentHeight = 0
          continue
        }

        // Start new page with this segment (it fits)
        currentPageSegments.push(segment)
        currentHeight = segmentHeight
      } else {
        // Fits on current page
        currentPageSegments.push(segment)
        currentHeight = combinedHeight

        // If this segment should stay with next, and there is a next segment,
        // check if they fit together
        if (segment.keepWithNext && i < segments.length - 1) {
          const nextSegment = segments[i + 1]
          const nextHeight = this.measureSegment(nextSegment)
          const combinedWithNext = this.measureCombinedContent([
            ...currentPageSegments,
            nextSegment
          ])

          if (combinedWithNext > availableHeight) {
            // The heading + following content doesn't fit
            // Move heading to next page
            currentPageSegments.pop()
            currentHeight = this.measureCombinedContent(currentPageSegments)

            if (currentPageSegments.length > 0) {
              pages.push(this.createFittedPage(
                pageIndex++,
                chapterId,
                chapterTitle,
                currentPageSegments,
                references,
                currentHeight,
                availableHeight
              ))
            }

            currentPageSegments = [segment]
            currentHeight = segmentHeight
          }
        }
      }
    }

    // Add remaining content as final page
    if (currentPageSegments.length > 0) {
      pages.push(this.createFittedPage(
        pageIndex++,
        chapterId,
        chapterTitle,
        currentPageSegments,
        references,
        currentHeight,
        availableHeight
      ))
    }

    return pages
  }

  /**
   * Create a fitted page object
   */
  private createFittedPage(
    pageIndex: number,
    chapterId: string,
    chapterTitle: string,
    segments: ContentSegment[],
    allReferences: BookReference[],
    measuredHeight: number,
    availableHeight: number
  ): FittedPage {
    return {
      pageIndex,
      chapterId,
      chapterTitle,
      segments: [...segments],
      htmlContent: segments.map(s => s.htmlContent).join(''),
      references: this.getReferencesForSegments(segments, allReferences),
      measuredHeight,
      availableHeight,
      overflow: measuredHeight > availableHeight,
    }
  }

  /**
   * Parse a chapter into segments
   */
  async parseChapter(
    chapter: BookChapter,
    references: BookReference[],
    containerDimensions: ContainerDimensions
  ): Promise<ParsedChapterContent> {
    // Preload images first
    await imagePreloader.preloadImagesFromHtml(chapter.htmlContent)

    // Parse into segments
    const segments = this.parseHtmlToSegments(chapter.htmlContent, chapter.id)

    // Calculate scaled image dimensions for each image segment
    for (const segment of segments) {
      if (segment.imageData) {
        const scaled = imagePreloader.calculateScaledDimensions(
          segment.imageData.naturalWidth,
          segment.imageData.naturalHeight,
          containerDimensions
        )
        segment.imageData.scaledWidth = scaled.width
        segment.imageData.scaledHeight = scaled.height
      }
    }

    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      segments,
      references: references.filter(r => r.chapterId === chapter.id),
    }
  }

  /**
   * Fit entire book content into pages
   */
  async fitContent(
    content: BookContent,
    config: FittingConfig,
    onProgress?: FittingProgressCallback
  ): Promise<FittedContent> {
    if (!this.measurementApi) {
      throw new Error('MeasurementApi not set. Call setMeasurementApi first.')
    }

    const pages: FittedPage[] = []
    const totalChapters = content.chapters.length
    const availableHeight = this.measurementApi.getAvailableHeight()

    onProgress?.({
      phase: 'parsing',
      percent: 0,
      totalChapters,
      currentChapterIndex: 0,
    })

    // Process each chapter
    for (let i = 0; i < content.chapters.length; i++) {
      const chapter = content.chapters[i]

      onProgress?.({
        phase: 'measuring',
        percent: Math.round((i / totalChapters) * 50),
        currentChapter: chapter.title,
        totalChapters,
        currentChapterIndex: i,
      })

      // Parse chapter into segments
      const parsedChapter = await this.parseChapter(
        chapter,
        content.references,
        config.containerDimensions
      )

      onProgress?.({
        phase: 'fitting',
        percent: Math.round(50 + (i / totalChapters) * 45),
        currentChapter: chapter.title,
        totalChapters,
        currentChapterIndex: i,
      })

      // Fit segments into pages
      const chapterPages = this.fitSegmentsToPages(
        parsedChapter.segments,
        parsedChapter.chapterId,
        parsedChapter.chapterTitle,
        parsedChapter.references,
        availableHeight,
        pages.length
      )

      pages.push(...chapterPages)
    }

    onProgress?.({
      phase: 'complete',
      percent: 100,
      totalChapters,
      currentChapterIndex: totalChapters,
    })

    return {
      pages,
      totalPages: pages.length,
      fittingConfig: config,
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.segmentCache.clear()
    this.measurementCache.clear()
  }

  /**
   * Get current available height from measurement API
   */
  getAvailableHeight(): number {
    return this.measurementApi?.getAvailableHeight() ?? 0
  }
}

// Export singleton instance
export const contentFitter = new ContentFitter()

/**
 * Hook-friendly function to fit content
 */
export async function fitBookContent(
  content: BookContent,
  config: FittingConfig,
  measurementApi: MeasurementContainerApi,
  onProgress?: FittingProgressCallback
): Promise<FittedContent> {
  contentFitter.setMeasurementApi(measurementApi)
  return contentFitter.fitContent(content, config, onProgress)
}

