export type ParsedBook = {
  metadata: BookMetadata
  cover?: BookCoverData | null
}

export type BookIdentifier = {
  type: string
  value: string
}

export type BookMetadata = {
  title: string
  authors: string[]
  publisher: string
  identifiers: BookIdentifier[]
  language: string
  description: string
  subjects: string[]
}

export type BookCoverData = {
  archivePath: string
  imageBuffer?: Buffer | null
}
