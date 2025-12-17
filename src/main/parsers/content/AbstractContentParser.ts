import { BookContent } from '../../../../types/reader.types'

export interface ContentParserOptions {
  filePath: string
  bookId: number
}

/**
 * Abstract base class for book content parsers
 * All format-specific content parsers (EPUB, FB2, PDF, etc.) should extend this class
 */
export abstract class AbstractContentParser {
  protected readonly filePath: string
  protected readonly bookId: number

  constructor(options: ContentParserOptions) {
    this.filePath = options.filePath
    this.bookId = options.bookId
  }

  /**
   * Extract the full content of the book including chapters, references, and TOC
   */
  abstract extractContent(): Promise<BookContent>

  /**
   * Get the list of supported file extensions for this parser
   */
  static getSupportedExtensions(): string[] {
    return []
  }
}

