export type ParsedBook = {
  metadata: BookMetadata
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
  coverImage: string | null
}
