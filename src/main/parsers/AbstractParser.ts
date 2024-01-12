import { ParsedBook } from '../../../types/parsed.types'

export abstract class AbstractParser {
  parse(): Promise<ParsedBook | null> {
    throw new Error('Method not implemented.')
  }
}
