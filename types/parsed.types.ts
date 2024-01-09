export type ParsedBook = {
  metadata: BookMetadata
}

export type BookMetadata = {
  title: string
  authors: string[]
  publisher: string
  identifiers: {
    type: string
    value: string
  }[]
  language: string
  description: string
  subjects: string[]
  coverImage?: string
}
