import { Author, Book } from './books.types'
import { Collection } from './collections.types'

// Search filter options
export type SearchFilter = 'books' | 'collections' | 'book_ids' | 'file_names' | 'internal_file_names'

// Supported book formats for filtering
export type BookFormat = 'epub' | 'pdf' | 'fb2' | 'fb3' | 'txt'

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
  fileFormat: string
  fileName: string // internal UUID filename
  originalFileName: string
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

