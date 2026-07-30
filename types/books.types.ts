import type { ReaderPosition } from './reader.types'

export type Author = {
  id: number
  name: string
}

export type BookIdentifier = {
  id: number
  bookFileId: number
  idType: string
  idVal: string
  normalizedVal: string
}

export type BookFile = {
  id: number
  bookId: number
  storedPath: string
  originalPath: string | null
  originalFileName: string
  fileFormat: string
  mimeType: string | null
  fileSize: number | null
  sha256: string | null
  sourceType: 'import' | 'conversion' | 'legacy'
  sourceLabel: string | null
  sourceModifiedAt: Date | null
  coverPath: string | null
  readingPosition: ReaderPosition | null
  lastOpenedAt: Date | null
  removedAt: Date | null
  derivedFromBookFileId: number | null
  identifiers: BookIdentifier[]
  createdAt: Date
  updatedAt: Date
  isAvailable: boolean
  isReadable: boolean
  isPreferred: boolean
}

export type BookSummary = {
  id: number
  name: string
  cover: string | null
  lang: string | null
  publisher: string | null
  description: string | null
  authors: Author[]
  readingProgression: number | null
  score: number | null
  isFavorite: boolean
  formats: string[]
  activeFileCount: number
  isFileless: boolean
  hasReadableFile: boolean
  preferredBookFileId: number | null
  createdAt: Date
  updatedAt: Date
}

export type BookMatchSuggestion = {
  id: number
  reason: 'title' | 'title_author' | 'ambiguous_hash' | 'ambiguous_identifier'
  confidence: number
  evidence: Record<string, unknown> | null
  candidate: BookSummary
}

export type Book = BookSummary & {
  files: BookFile[]
  bookIds: BookIdentifier[]
  collections: Array<{ id: number; name: string }>
  matchSuggestions: BookMatchSuggestion[]
  preferredFile: BookFile | null
}

export type AuthorEntity = {
  id: number | never
  name: string
  createdAt?: Date
  updatedAt?: Date
}
