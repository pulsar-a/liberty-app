import { Author } from './books.types'
import type { BookFormat } from './reader-engines'

export type { BookFormat } from './reader-engines'

// Search filter options
export type SearchFilter =
  | 'books'
  | 'collections'
  | 'book_ids'
  | 'file_names'
  | 'internal_file_names'

// Search request parameters
export interface SearchParams {
  query: string
  filters?: SearchFilter[]
  formats?: BookFormat[]
  limit?: number
}

// Book search result with additional metadata
export interface BookSearchResult {
  id: number
  name: string
  cover: string | null
  authors: Author[]
  formats: string[]
  activeFileCount: number
  hasReadableFile: boolean
  matchedFile?: {
    id: number
    fileFormat: string
    storedPath: string
    originalFileName: string
    isAvailable: boolean
  }
  // Matched fields for highlighting
  matchedField?: 'title' | 'book_id' | 'file_name' | 'internal_file_name'
  matchedBookId?: {
    idType: string
    idVal: string
  }
}

// Collection search result
export interface CollectionSearchResult {
  id: number
  name: string
  booksCount: number
}

// Combined search results
export interface SearchResults {
  books: BookSearchResult[]
  collections: CollectionSearchResult[]
  totalBooks: number
  totalCollections: number
}

// Dropdown search results (limited to 5 per section)
export interface DropdownSearchResults {
  books: BookSearchResult[]
  collections: CollectionSearchResult[]
  hasMoreBooks: boolean
  hasMoreCollections: boolean
}
