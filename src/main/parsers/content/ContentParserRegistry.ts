import { AbstractContentParser, ContentParserOptions } from './AbstractContentParser'
import { EpubContentParser } from './EpubContentParser'

type ContentParserConstructor = new (options: ContentParserOptions) => AbstractContentParser

/**
 * Registry of content parsers for different file formats
 * Maps file extensions to their corresponding content parser classes
 */
const contentParserMap: Record<string, ContentParserConstructor> = {
  epub: EpubContentParser,
  // Future formats can be added here:
  // fb2: Fb2ContentParser,
  // pdf: PdfContentParser,
}

/**
 * Get the appropriate content parser for a file extension
 */
export function getContentParser(
  fileExtension: string,
  options: ContentParserOptions
): AbstractContentParser | null {
  const ParserClass = contentParserMap[fileExtension.toLowerCase()]

  if (!ParserClass) {
    return null
  }

  return new ParserClass(options)
}

/**
 * Check if content parsing is supported for a file extension
 */
export function isContentParsingSupported(fileExtension: string): boolean {
  return fileExtension.toLowerCase() in contentParserMap
}

/**
 * Get list of all file extensions that support content parsing
 */
export function getSupportedContentFormats(): string[] {
  return Object.keys(contentParserMap)
}

/**
 * Register a new content parser for a file extension
 */
export function registerContentParser(
  extension: string,
  parser: ContentParserConstructor
): void {
  contentParserMap[extension.toLowerCase()] = parser
}

