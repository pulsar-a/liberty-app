/**
 * EPUB Parser Worker
 * Runs heavy EPUB parsing in a separate thread to keep the main process responsive.
 * Sends progress updates back to the main thread via postMessage.
 */

import { parentPort, workerData } from 'worker_threads'
import fs from 'fs'
import NodeZip from 'node-zip'
import xml2js from 'xml2js'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import {
  BookChapter,
  BookContent,
  BookReference,
  TocEntry,
  PaginatedContent,
  BookPage,
  PageBoundary,
  PaginationConfig,
} from '../../../types/reader.types'

// ============================================================================
// Progress Stages
// ============================================================================

const PROGRESS_STAGES = {
  OPENING: 'reader_loading_opening',
  CHAPTERS: 'reader_loading_chapters',
  IMAGES: 'reader_loading_images',
  PAGINATING: 'reader_loading_paginating',
}

// Progress ranges for each stage
const PROGRESS_RANGES = {
  OPENING: { start: 0, end: 5 },
  CHAPTERS: { start: 5, end: 70 },
  IMAGES: { start: 70, end: 90 },
  PAGINATING: { start: 90, end: 100 },
}

// ============================================================================
// Message Types
// ============================================================================

interface WorkerInput {
  filePath: string
  bookId: number
  paginationConfig: PaginationConfig
}

interface ProgressMessage {
  type: 'progress'
  percent: number
  stage: string
}

interface ResultMessage {
  type: 'result'
  content: BookContent
  paginatedContent: PaginatedContent
}

interface ErrorMessage {
  type: 'error'
  message: string
}

type WorkerMessage = ProgressMessage | ResultMessage | ErrorMessage

// ============================================================================
// Helper Functions
// ============================================================================

function sendProgress(percent: number, stage: string): void {
  const message: ProgressMessage = { type: 'progress', percent: Math.round(percent), stage }
  parentPort?.postMessage(message)
}

function sendResult(content: BookContent, paginatedContent: PaginatedContent): void {
  const message: ResultMessage = { type: 'result', content, paginatedContent }
  parentPort?.postMessage(message)
}

function sendError(error: string): void {
  const message: ErrorMessage = { type: 'error', message: error }
  parentPort?.postMessage(message)
}

function calculateProgress(stage: keyof typeof PROGRESS_RANGES, current: number, total: number): number {
  const range = PROGRESS_RANGES[stage]
  const stageProgress = total > 0 ? current / total : 0
  return range.start + (range.end - range.start) * stageProgress
}

// ============================================================================
// EPUB Parser (Worker-compatible version)
// ============================================================================

interface SpineItem {
  id: string
  href: string
  order: number
}

interface ManifestItem {
  id: string
  href: string
  mediaType: string
}

class WorkerEpubParser {
  private xmlParser: xml2js.Parser
  private archive: NodeZip | null = null
  private opfPath: string = ''
  private opfDir: string = ''
  private manifest: Map<string, ManifestItem> = new Map()
  private spine: SpineItem[] = []
  private filePath: string
  private bookId: number
  private totalImages: number = 0
  private processedImages: number = 0

  constructor(filePath: string, bookId: number) {
    this.filePath = filePath
    this.bookId = bookId
    this.xmlParser = new xml2js.Parser()
  }

  private loadArchive(): void {
    try {
      const buffer: Buffer = fs.readFileSync(this.filePath, 'binary') as unknown as Buffer
      this.archive = new NodeZip(buffer, { binary: true, base64: false, checkCRC32: true })
    } catch (error) {
      throw new Error(`Failed to load EPUB file: ${error}`)
    }
  }

  async extractContent(): Promise<BookContent> {
    // Stage: Opening (0-5%)
    sendProgress(PROGRESS_RANGES.OPENING.start, PROGRESS_STAGES.OPENING)
    
    this.loadArchive()
    
    sendProgress(2, PROGRESS_STAGES.OPENING)

    // Get container.xml to find OPF location
    const containerXml = this.getFileContent('META-INF/container.xml')
    if (!containerXml) {
      throw new Error('Invalid EPUB: missing container.xml')
    }

    const containerData = await this.xmlParser.parseStringPromise(containerXml)
    this.opfPath = containerData?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.['full-path']

    if (!this.opfPath) {
      throw new Error('Invalid EPUB: cannot find OPF path')
    }

    this.opfDir = this.opfPath.split('/').slice(0, -1).join('/')

    // Parse the OPF file
    const opfXml = this.getFileContent(this.opfPath)
    if (!opfXml) {
      throw new Error('Invalid EPUB: cannot read OPF file')
    }

    await this.parseOpf(opfXml)
    
    sendProgress(PROGRESS_RANGES.OPENING.end, PROGRESS_STAGES.OPENING)

    // Stage: Chapters (5-70%)
    sendProgress(PROGRESS_RANGES.CHAPTERS.start, PROGRESS_STAGES.CHAPTERS)
    
    const chapters = await this.extractChapters()

    // Extract references from chapters
    const references = this.extractReferences(chapters)

    // Build table of contents
    const tableOfContents = await this.extractTableOfContents()

    return {
      bookId: this.bookId,
      chapters,
      references,
      tableOfContents,
    }
  }

  private getFileContent(filename: string): string | null {
    if (!this.archive) {
      return null
    }

    try {
      const fileData = this.archive.file(filename)
      return fileData?.asText() || null
    } catch {
      return null
    }
  }

  private async parseOpf(opfXml: string): Promise<void> {
    const opfData = await this.xmlParser.parseStringPromise(opfXml)
    const pkg = opfData?.package

    // Parse manifest
    const manifestItems = pkg?.manifest?.[0]?.item || []
    for (const item of manifestItems) {
      const id = item.$?.id
      const href = item.$?.href
      const mediaType = item.$?.['media-type']

      if (id && href) {
        this.manifest.set(id, { id, href, mediaType })
      }
    }

    // Parse spine
    const spineItems = pkg?.spine?.[0]?.itemref || []
    let order = 0
    for (const itemRef of spineItems) {
      const idref = itemRef.$?.idref
      const manifestItem = this.manifest.get(idref)

      if (manifestItem) {
        this.spine.push({
          id: idref,
          href: manifestItem.href,
          order: order++,
        })
      }
    }
  }

  private async extractChapters(): Promise<BookChapter[]> {
    const chapters: BookChapter[] = []
    const totalSpineItems = this.spine.length

    for (let i = 0; i < this.spine.length; i++) {
      const spineItem = this.spine[i]
      const fullPath = this.opfDir ? `${this.opfDir}/${spineItem.href}` : spineItem.href
      const chapterDir = fullPath.split('/').slice(0, -1).join('/')
      const content = this.getFileContent(fullPath)

      if (!content) {
        continue
      }

      // Parse XHTML and extract body content
      const doc = new DOMParser().parseFromString(content, 'application/xhtml+xml')
      const body = doc.getElementsByTagName('body')[0]

      if (!body) {
        continue
      }

      // Get chapter title from the content or use a default
      const title = this.extractChapterTitle(doc) || `Chapter ${spineItem.order + 1}`

      // Count images first for progress tracking
      const images = doc.getElementsByTagName('img')
      this.totalImages += images.length

      // Convert images to base64 data URIs
      this.convertImagesToDataUri(doc, chapterDir)

      // Serialize body content, stripping the body tags
      const serializer = new XMLSerializer()
      let htmlContent = ''
      for (let j = 0; j < body.childNodes.length; j++) {
        htmlContent += serializer.serializeToString(body.childNodes[j])
      }

      // Clean up the HTML content
      htmlContent = this.sanitizeHtml(htmlContent)

      chapters.push({
        id: spineItem.id,
        title,
        htmlContent,
        order: spineItem.order,
        href: spineItem.href,
      })

      // Report progress for chapters stage
      const progress = calculateProgress('CHAPTERS', i + 1, totalSpineItems)
      sendProgress(progress, PROGRESS_STAGES.CHAPTERS)
    }

    return chapters
  }

  private convertImagesToDataUri(doc: Document, chapterDir: string): void {
    const images = doc.getElementsByTagName('img')

    // Report entering images stage if we have images
    if (images.length > 0 && this.processedImages === 0) {
      sendProgress(PROGRESS_RANGES.IMAGES.start, PROGRESS_STAGES.IMAGES)
    }

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const src = img.getAttribute('src')

      if (!src || src.startsWith('data:')) {
        this.processedImages++
        continue
      }

      try {
        const imagePath = this.resolveImagePath(src, chapterDir)
        const base64Data = this.getFileAsBase64(imagePath)

        if (base64Data) {
          const mimeType = this.getImageMimeType(imagePath)
          const dataUri = `data:${mimeType};base64,${base64Data}`
          img.setAttribute('src', dataUri)
        }
      } catch {
        // Silently skip failed images
      }

      this.processedImages++

      // Report progress for images stage
      if (this.totalImages > 0) {
        const progress = calculateProgress('IMAGES', this.processedImages, this.totalImages)
        sendProgress(progress, PROGRESS_STAGES.IMAGES)
      }
    }
  }

  private resolveImagePath(src: string, chapterDir: string): string {
    if (src.startsWith('/')) {
      return src.slice(1)
    }

    const parts = [...chapterDir.split('/').filter(Boolean), ...src.split('/')]
    const resolved: string[] = []

    for (const part of parts) {
      if (part === '..') {
        resolved.pop()
      } else if (part !== '.') {
        resolved.push(part)
      }
    }

    return resolved.join('/')
  }

  private getFileAsBase64(filename: string): string | null {
    if (!this.archive) {
      return null
    }

    try {
      const fileData = this.archive.file(filename)
      if (!fileData) {
        return null
      }
      const binaryString = fileData.asBinary()
      const buffer = Buffer.from(binaryString, 'binary')
      return buffer.toString('base64')
    } catch {
      return null
    }
  }

  private getImageMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || ''

    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
    }

    return mimeTypes[ext] || 'image/jpeg'
  }

  private extractChapterTitle(doc: Document): string | null {
    const titleSources = ['h1', 'h2', 'h3', 'title']

    for (const tag of titleSources) {
      const elements = doc.getElementsByTagName(tag)
      if (elements.length > 0 && elements[0].textContent) {
        return elements[0].textContent.trim()
      }
    }

    return null
  }

  private sanitizeHtml(html: string): string {
    html = html.replace(/<\?xml[^>]*\?>/gi, '')
    html = html.replace(/<!DOCTYPE[^>]*>/gi, '')
    html = html.replace(/<epub:([^>]+)>/gi, '<span class="epub-$1">')
    html = html.replace(/<\/epub:([^>]+)>/gi, '</span>')
    html = html.replace(/\s+xmlns:[^=]+=["'][^"']*["']/gi, '')
    html = html.replace(/\s+epub:[^=]+=["'][^"']*["']/gi, '')

    return html.trim()
  }

  private extractReferences(chapters: BookChapter[]): BookReference[] {
    const references: BookReference[] = []

    for (const chapter of chapters) {
      const doc = new DOMParser().parseFromString(
        `<root>${chapter.htmlContent}</root>`,
        'text/html'
      )

      const allElements = doc.getElementsByTagName('*')

      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i]
        const id = el.getAttribute('id') || ''
        const className = el.getAttribute('class') || ''
        const epubType = el.getAttribute('epub:type') || ''

        const isFootnote =
          epubType.includes('footnote') ||
          epubType.includes('endnote') ||
          epubType.includes('note') ||
          className.includes('footnote') ||
          className.includes('endnote') ||
          id.includes('note') ||
          id.includes('fn')

        if (isFootnote && el.textContent) {
          const marker = this.extractReferenceMarker(el, references.length + 1)

          references.push({
            id: id || `ref-${chapter.id}-${references.length}`,
            marker,
            content: el.textContent.trim(),
            chapterId: chapter.id,
          })
        }
      }
    }

    return references
  }

  private extractReferenceMarker(element: Element, fallbackNumber: number): string {
    const text = element.textContent || ''
    const markerMatch = text.match(/^[\[\(]?(\d+|[*†‡§¶]|[a-z])[\]\)]?\.?\s*/i)

    if (markerMatch) {
      return markerMatch[0].trim()
    }

    return `[${fallbackNumber}]`
  }

  private async extractTableOfContents(): Promise<TocEntry[]> {
    let toc = await this.extractNavToc()

    if (toc.length === 0) {
      toc = await this.extractNcxToc()
    }

    if (toc.length === 0) {
      toc = this.generateTocFromSpine()
    }

    return toc
  }

  private async extractNavToc(): Promise<TocEntry[]> {
    let navHref: string | null = null

    for (const [, item] of this.manifest) {
      if (item.mediaType === 'application/xhtml+xml') {
        const fullPath = this.opfDir ? `${this.opfDir}/${item.href}` : item.href
        const content = this.getFileContent(fullPath)

        if (content && content.includes('epub:type="toc"')) {
          navHref = fullPath
          break
        }
      }
    }

    if (!navHref) {
      return []
    }

    const navContent = this.getFileContent(navHref)
    if (!navContent) {
      return []
    }

    const doc = new DOMParser().parseFromString(navContent, 'application/xhtml+xml')
    const navElements = doc.getElementsByTagName('nav')

    for (let i = 0; i < navElements.length; i++) {
      const nav = navElements[i]
      const epubType = nav.getAttribute('epub:type') || ''

      if (epubType.includes('toc')) {
        const ol = nav.getElementsByTagName('ol')[0]
        if (ol) {
          return this.parseNavList(ol, 0)
        }
      }
    }

    return []
  }

  private parseNavList(ol: Element, level: number): TocEntry[] {
    const entries: TocEntry[] = []
    const items = ol.childNodes

    let order = 0
    for (let i = 0; i < items.length; i++) {
      const li = items[i]
      if (li.nodeName !== 'li') continue

      const link = (li as Element).getElementsByTagName('a')[0]
      if (!link) continue

      const href = link.getAttribute('href') || ''
      const title = link.textContent?.trim() || ''

      const entry: TocEntry = {
        id: `toc-${level}-${order}`,
        title,
        href,
        order: order++,
        level,
      }

      const nestedOl = (li as Element).getElementsByTagName('ol')[0]
      if (nestedOl) {
        entry.children = this.parseNavList(nestedOl, level + 1)
      }

      entries.push(entry)
    }

    return entries
  }

  private async extractNcxToc(): Promise<TocEntry[]> {
    let ncxHref: string | null = null

    for (const [, item] of this.manifest) {
      if (item.mediaType === 'application/x-dtbncx+xml') {
        ncxHref = item.href
        break
      }
    }

    if (!ncxHref) {
      return []
    }

    const fullPath = this.opfDir ? `${this.opfDir}/${ncxHref}` : ncxHref
    const ncxContent = this.getFileContent(fullPath)

    if (!ncxContent) {
      return []
    }

    const ncxData = await this.xmlParser.parseStringPromise(ncxContent)
    const navMap = ncxData?.ncx?.navMap?.[0]?.navPoint || []

    return this.parseNcxNavPoints(navMap, 0)
  }

  private parseNcxNavPoints(navPoints: unknown[], level: number): TocEntry[] {
    const entries: TocEntry[] = []

    let order = 0
    for (const navPoint of navPoints) {
      const np = navPoint as {
        navLabel?: { text?: string[] }[]
        content?: { $?: { src?: string } }[]
        navPoint?: unknown[]
      }

      const title = np.navLabel?.[0]?.text?.[0] || ''
      const href = np.content?.[0]?.$?.src || ''

      const entry: TocEntry = {
        id: `toc-${level}-${order}`,
        title,
        href,
        order: order++,
        level,
      }

      if (np.navPoint && np.navPoint.length > 0) {
        entry.children = this.parseNcxNavPoints(np.navPoint, level + 1)
      }

      entries.push(entry)
    }

    return entries
  }

  private generateTocFromSpine(): TocEntry[] {
    return this.spine.map((item, index) => ({
      id: `toc-spine-${index}`,
      title: `Section ${index + 1}`,
      href: item.href,
      order: index,
      level: 0,
    }))
  }
}

// ============================================================================
// Pagination Service (Worker-compatible version)
// ============================================================================

const DEFAULT_CHARS_PER_PAGE = {
  single: 900,
  'two-column': 600,
}

class WorkerPaginationService {
  private config: PaginationConfig

  constructor(config: PaginationConfig) {
    this.config = {
      mode: config.mode || 'single',
      charsPerPage: config.charsPerPage || DEFAULT_CHARS_PER_PAGE[config.mode || 'single'],
    }
  }

  paginate(content: BookContent): PaginatedContent {
    sendProgress(PROGRESS_RANGES.PAGINATING.start, PROGRESS_STAGES.PAGINATING)

    const pages: BookPage[] = []
    const pageBoundaries: PageBoundary[] = []
    const totalChapters = content.chapters.length

    for (let i = 0; i < content.chapters.length; i++) {
      const chapter = content.chapters[i]
      const chapterPages = this.paginateChapter(chapter, content.references, pages.length)
      pages.push(...chapterPages.pages)
      pageBoundaries.push(...chapterPages.boundaries)

      // Report pagination progress
      const progress = calculateProgress('PAGINATING', i + 1, totalChapters)
      sendProgress(progress, PROGRESS_STAGES.PAGINATING)
    }

    return {
      pages,
      totalPages: pages.length,
      pageBoundaries,
    }
  }

  private paginateChapter(
    chapter: BookChapter,
    allReferences: BookReference[],
    startPageIndex: number
  ): { pages: BookPage[]; boundaries: PageBoundary[] } {
    const pages: BookPage[] = []
    const boundaries: PageBoundary[] = []

    const chapterReferences = allReferences.filter((ref) => ref.chapterId === chapter.id)
    const segments = this.splitIntoSegments(chapter.htmlContent)

    let currentPageContent = ''
    let currentCharCount = 0
    let segmentIndex = 0
    const maxChars = this.config.charsPerPage

    for (const segment of segments) {
      const segmentText = this.getTextContent(segment)
      const segmentCharCount = segmentText.length

      if (currentCharCount > 0 && currentCharCount + segmentCharCount > maxChars) {
        const pageIndex = startPageIndex + pages.length
        const pageReferences = this.getReferencesForContent(currentPageContent, chapterReferences)

        pages.push({
          pageIndex,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          htmlContent: currentPageContent,
          references: pageReferences,
        })

        boundaries.push({
          pageIndex,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          startOffset: segmentIndex - 1,
          endOffset: segmentIndex,
        })

        currentPageContent = ''
        currentCharCount = 0
      }

      currentPageContent += segment
      currentCharCount += segmentCharCount
      segmentIndex++
    }

    if (currentPageContent.trim()) {
      const pageIndex = startPageIndex + pages.length
      const pageReferences = this.getReferencesForContent(currentPageContent, chapterReferences)

      pages.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        htmlContent: currentPageContent,
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

    if (pages.length === 0) {
      const pageIndex = startPageIndex
      pages.push({
        pageIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        htmlContent: '<p></p>',
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

  private splitIntoSegments(html: string): string[] {
    const segments: string[] = []

    const doc = new DOMParser().parseFromString(`<root>${html}</root>`, 'text/html')
    const root = doc.documentElement

    if (!root) {
      return [html]
    }

    this.extractSegments(root, segments)

    if (segments.length === 0) {
      return [html]
    }

    return segments
  }

  private extractSegments(node: Element, segments: string[]): void {
    const blockElements = new Set([
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'ul', 'ol', 'li', 'table', 'tr',
      'figure', 'figcaption', 'section', 'article', 'aside',
      'header', 'footer', 'nav', 'hr', 'br',
    ])

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]

      if (child.nodeType === 3) {
        const text = child.textContent?.trim()
        if (text) {
          segments.push(text)
        }
      } else if (child.nodeType === 1) {
        const element = child as Element
        const tagName = element.tagName.toLowerCase()

        if (blockElements.has(tagName)) {
          const serializer = new XMLSerializer()
          segments.push(serializer.serializeToString(element))
        } else {
          this.extractSegments(element, segments)
        }
      }
    }
  }

  private getTextContent(html: string): string {
    const doc = new DOMParser().parseFromString(`<root>${html}</root>`, 'text/html')
    return doc.documentElement?.textContent || ''
  }

  private getReferencesForContent(
    content: string,
    chapterReferences: BookReference[]
  ): BookReference[] {
    const foundReferences: BookReference[] = []

    for (const ref of chapterReferences) {
      if (content.includes(ref.id) || content.includes(`#${ref.id}`)) {
        foundReferences.push(ref)
      }

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
}

// ============================================================================
// Main Worker Entry Point
// ============================================================================

async function main(): Promise<void> {
  const input = workerData as WorkerInput

  if (!input?.filePath || !input?.bookId) {
    sendError('Invalid worker input: missing filePath or bookId')
    process.exit(1)
    return
  }

  try {
    // Parse EPUB content
    const parser = new WorkerEpubParser(input.filePath, input.bookId)
    const content = await parser.extractContent()

    // Paginate content
    const paginationService = new WorkerPaginationService(input.paginationConfig)
    const paginatedContent = paginationService.paginate(content)

    // Send final progress
    sendProgress(100, PROGRESS_STAGES.PAGINATING)

    // Send result
    sendResult(content, paginatedContent)
    
    // Exit cleanly after sending result
    process.exit(0)
  } catch (error) {
    sendError(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()

