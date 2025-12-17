import fs from 'fs'
import NodeZip from 'node-zip'
import xml2js from 'xml2js'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import {
  BookChapter,
  BookContent,
  BookReference,
  TocEntry,
} from '../../../../types/reader.types'
import { logger } from '../../utils/logger'
import { AbstractContentParser, ContentParserOptions } from './AbstractContentParser'

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

/**
 * Content parser for EPUB format e-books
 * Extracts chapters, table of contents, and references from EPUB files
 */
export class EpubContentParser extends AbstractContentParser {
  private xmlParser: xml2js.Parser
  private archive: NodeZip | null = null
  private opfPath: string = ''
  private opfDir: string = ''
  private manifest: Map<string, ManifestItem> = new Map()
  private spine: SpineItem[] = []

  constructor(options: ContentParserOptions) {
    super(options)
    this.xmlParser = new xml2js.Parser()
    this.loadArchive()
  }

  private loadArchive(): void {
    try {
      const buffer: Buffer = fs.readFileSync(this.filePath, 'binary') as unknown as Buffer
      this.archive = new NodeZip(buffer, { binary: true, base64: false, checkCRC32: true })
    } catch (error) {
      logger.error('Failed to load EPUB archive:', error)
      throw new Error('Failed to load EPUB file')
    }
  }

  async extractContent(): Promise<BookContent> {
    // Get container.xml to find OPF location
    const containerXml = await this.getFileContent('META-INF/container.xml')
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
    const opfXml = await this.getFileContent(this.opfPath)
    if (!opfXml) {
      throw new Error('Invalid EPUB: cannot read OPF file')
    }

    await this.parseOpf(opfXml)

    // Extract chapters from spine
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

  private async getFileContent(filename: string): Promise<string | null> {
    if (!this.archive) {
      return null
    }

    try {
      const fileData = this.archive.file(filename)
      return fileData?.asText() || null
    } catch (error) {
      logger.error(`Failed to read file from archive: ${filename}`, error)
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

    for (const spineItem of this.spine) {
      const fullPath = this.opfDir ? `${this.opfDir}/${spineItem.href}` : spineItem.href
      // Get the directory of the current chapter file for resolving relative paths
      const chapterDir = fullPath.split('/').slice(0, -1).join('/')
      const content = await this.getFileContent(fullPath)

      if (!content) {
        logger.warn(`Could not read spine item: ${fullPath}`)
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

      // Convert images to base64 data URIs
      await this.convertImagesToDataUri(doc, chapterDir)

      // Serialize body content, stripping the body tags
      const serializer = new XMLSerializer()
      let htmlContent = ''
      for (let i = 0; i < body.childNodes.length; i++) {
        htmlContent += serializer.serializeToString(body.childNodes[i])
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
    }

    return chapters
  }

  /**
   * Convert all img elements in the document to use base64 data URIs
   * This allows images to be rendered without needing to serve them from a file path
   */
  private async convertImagesToDataUri(doc: Document, chapterDir: string): Promise<void> {
    const images = doc.getElementsByTagName('img')

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const src = img.getAttribute('src')

      if (!src || src.startsWith('data:')) {
        continue // Skip if no src or already a data URI
      }

      try {
        // Resolve the image path relative to the chapter directory
        const imagePath = this.resolveImagePath(src, chapterDir)

        // Get the image data from the archive as base64
        const base64Data = this.getFileAsBase64(imagePath)

        if (base64Data) {
          // Determine MIME type from extension or manifest
          const mimeType = this.getImageMimeType(imagePath)
          const dataUri = `data:${mimeType};base64,${base64Data}`

          img.setAttribute('src', dataUri)
        } else {
          logger.warn(`Image not found in EPUB archive: ${imagePath}`)
        }
      } catch (error) {
        logger.error(`Failed to convert image to data URI: ${src}`, error)
      }
    }
  }

  /**
   * Resolve a relative image path to an absolute path within the EPUB archive
   */
  private resolveImagePath(src: string, chapterDir: string): string {
    // Handle absolute paths (starting with /)
    if (src.startsWith('/')) {
      return src.slice(1)
    }

    // Handle relative paths
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

  /**
   * Get binary file content from the archive as base64 string
   */
  private getFileAsBase64(filename: string): string | null {
    if (!this.archive) {
      return null
    }

    try {
      const fileData = this.archive.file(filename)
      if (!fileData) {
        return null
      }
      // node-zip's asBinary() returns a binary string
      // We need to convert it to base64 properly using Buffer
      const binaryString = fileData.asBinary()
      // Convert binary string to Buffer, then to base64
      const buffer = Buffer.from(binaryString, 'binary')
      return buffer.toString('base64')
    } catch (error) {
      logger.error(`Failed to read binary file from archive: ${filename}`, error)
      return null
    }
  }

  /**
   * Get the MIME type for an image file based on its extension
   */
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
    // Try to find title in order of preference
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
    // Remove XML declarations and doctype
    html = html.replace(/<\?xml[^>]*\?>/gi, '')
    html = html.replace(/<!DOCTYPE[^>]*>/gi, '')

    // Convert EPUB-specific elements to standard HTML
    html = html.replace(/<epub:([^>]+)>/gi, '<span class="epub-$1">')
    html = html.replace(/<\/epub:([^>]+)>/gi, '</span>')

    // Remove namespaced attributes but keep the content
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

      // Look for footnotes/endnotes - common patterns in EPUBs
      // 1. EPUB3 style: <aside epub:type="footnote">
      // 2. Links with href="#footnote-X"
      // 3. Elements with class="footnote" or id containing "note"

      // Find all elements that might be footnotes
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
          // Extract marker from the content or generate one
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
    // Try to find a number or marker at the start of the content
    const text = element.textContent || ''
    const markerMatch = text.match(/^[\[\(]?(\d+|[*†‡§¶]|[a-z])[\]\)]?\.?\s*/i)

    if (markerMatch) {
      return markerMatch[0].trim()
    }

    return `[${fallbackNumber}]`
  }

  private async extractTableOfContents(): Promise<TocEntry[]> {
    // Try EPUB3 NAV document first
    let toc = await this.extractNavToc()

    // Fall back to NCX if NAV not found
    if (toc.length === 0) {
      toc = await this.extractNcxToc()
    }

    // If still no TOC, generate from chapters
    if (toc.length === 0) {
      toc = this.generateTocFromSpine()
    }

    return toc
  }

  private async extractNavToc(): Promise<TocEntry[]> {
    // Find NAV document in manifest
    let navHref: string | null = null

    for (const [, item] of this.manifest) {
      if (item.mediaType === 'application/xhtml+xml') {
        const fullPath = this.opfDir ? `${this.opfDir}/${item.href}` : item.href
        const content = await this.getFileContent(fullPath)

        if (content && content.includes('epub:type="toc"')) {
          navHref = fullPath
          break
        }
      }
    }

    if (!navHref) {
      return []
    }

    const navContent = await this.getFileContent(navHref)
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

      // Check for nested ol
      const nestedOl = (li as Element).getElementsByTagName('ol')[0]
      if (nestedOl) {
        entry.children = this.parseNavList(nestedOl, level + 1)
      }

      entries.push(entry)
    }

    return entries
  }

  private async extractNcxToc(): Promise<TocEntry[]> {
    // Find NCX file in manifest
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
    const ncxContent = await this.getFileContent(fullPath)

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

      // Check for nested navPoints
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

  static getSupportedExtensions(): string[] {
    return ['epub']
  }
}

