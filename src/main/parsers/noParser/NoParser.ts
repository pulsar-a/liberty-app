import { ParsedBook } from '../../../../types/parsed.types'
import { AbstractParser, FileData } from '../AbstractParser'

export class NoParser extends AbstractParser {
  private readonly file: FileData

  constructor(file: FileData) {
    super(file)
    this.file = file
  }

  async parse(): Promise<ParsedBook | null> {
    return {
      metadata: {
        authors: [],
        title: this.file.originalFilename,
        description: '',
        publisher: '',
        subjects: [],
        identifiers: [],
        language: '',
      },
    }
  }
}
