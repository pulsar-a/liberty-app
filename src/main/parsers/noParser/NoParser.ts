import { ParsedBook } from '../../../../types/parsed.types'
import { AbstractParser, FileData } from '../AbstractParser'

/**
 * Fallback parser for unsupported formats
 * Returns minimal metadata using the filename
 */
export class NoParser extends AbstractParser {
  static readonly supportedExtensions = ['fb2', 'fb3', 'mobi', 'pdf', 'djvu', 'txt', 'doc', 'docx']

  constructor(file: FileData) {
    super(file)
  }

  async parse(): Promise<ParsedBook | null> {
    return {
      metadata: {
        authors: [],
        title: this.file.originalFilename.replace(/\.[^/.]+$/, ''), // Remove file extension
        description: '',
        publisher: '',
        subjects: [],
        identifiers: [],
        language: '',
      },
    }
  }
}
