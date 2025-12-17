import { ParsedBook } from '../../../types/parsed.types'

export type FileData = {
  filePath: string
  destinationFile: string
  fileName: string
  destinationDir: string
  encodedFilename: string
  subfolder: string
  originalFilename: string
  fileExtension: string
  encodedName: string
  imageDir: string
  imageAbsoluteDir: string
}

export interface ParserResult {
  success: boolean
  data: ParsedBook | null
  error?: string
}

export abstract class AbstractParser {
  protected readonly file: FileData

  constructor(file: FileData) {
    if (!file) {
      throw new Error('File data not provided')
    }
    this.file = file
  }

  /**
   * Parse the book file and extract metadata
   */
  abstract parse(): Promise<ParsedBook | null>

  /**
   * Supported file extensions for this parser
   */
  static readonly supportedExtensions: string[] = []
}
