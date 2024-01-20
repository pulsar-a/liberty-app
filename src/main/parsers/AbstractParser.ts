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
}

export abstract class AbstractParser {
  protected constructor(file: FileData) {
    if (!file) {
      throw new Error('File data not provided')
    }
  }

  parse(): Promise<ParsedBook | null> {
    throw new Error('Method not implemented.')
  }
}
