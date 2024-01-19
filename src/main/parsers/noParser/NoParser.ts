import path from 'node:path'
import { ParsedBook } from '../../../../types/parsed.types'
import { AbstractParser } from '../AbstractParser'

export class NoParser extends AbstractParser {
  private readonly filePath: string

  constructor(filePath: string) {
    super()
    this.filePath = filePath
  }

  async parse(): Promise<ParsedBook | null> {
    return {
      metadata: {
        authors: [],
        title: path.basename(this.filePath),
        description: '',
        coverImage: '',
        publisher: '',
        subjects: [],
        identifiers: [],
        language: '',
      },
    }
  }
}
