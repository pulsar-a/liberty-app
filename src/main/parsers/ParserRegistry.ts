import { AbstractParser, FileData } from './AbstractParser'
import { EpubParser } from './epub/EpubParser'
import { NoParser } from './noParser/NoParser'

type ParserConstructor = new (file: FileData) => AbstractParser

/**
 * Registry of file format parsers
 * Maps file extensions to their corresponding parser classes
 */
const parserMap: Record<string, ParserConstructor> = {
  epub: EpubParser,
  fb2: NoParser,
  fb3: NoParser,
  mobi: NoParser,
  pdf: NoParser,
  djvu: NoParser,
  txt: NoParser,
  doc: NoParser,
  docx: NoParser,
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
  return Object.keys(parserMap)
}

/**
 * Register a new parser for a file extension
 */
export function registerParser(extension: string, parser: ParserConstructor): void {
  parserMap[extension.toLowerCase()] = parser
}

