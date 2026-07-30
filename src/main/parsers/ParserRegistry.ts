import { AbstractParser, FileData } from './AbstractParser'
import { getReadableBookFormats } from '../../../types/reader-engines'
import { EpubParser } from './epub/EpubParser'
import { FoliateMetadataParser } from './foliate/FoliateMetadataParser'

type ParserConstructor = new (file: FileData) => AbstractParser

/**
 * Registry of file format parsers
 * Maps file extensions to their corresponding parser classes
 */
const parserMap: Record<string, ParserConstructor> = {
  epub: EpubParser,
  fb2: FoliateMetadataParser,
  mobi: FoliateMetadataParser,
  azw3: FoliateMetadataParser,
  cbz: FoliateMetadataParser,
}

/**
 * Get the appropriate parser for a file extension
 */
export function getParser(fileExtension: string): ParserConstructor | null {
  return parserMap[fileExtension.toLowerCase()] || null
}

/**
 * Check if a file extension is supported
 */
export function isFormatSupported(fileExtension: string): boolean {
  return fileExtension.toLowerCase() in parserMap
}

/**
 * Get list of all supported file extensions
 */
export function getSupportedFormats(): string[] {
  return getReadableBookFormats().filter((format) => format in parserMap)
}

/**
 * Register a new parser for a file extension
 */
export function registerParser(extension: string, parser: ParserConstructor): void {
  parserMap[extension.toLowerCase()] = parser
}
