import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
import CollectionEntity from '../entities/collection.entity'
import { db } from '../services/db'

export type SearchFilter = 'books' | 'collections' | 'book_ids' | 'file_names' | 'internal_file_names'
export type BookFormat = 'epub' | 'pdf' | 'fb2' | 'fb3' | 'txt'

export interface SearchParams {
  query: string
  filters?: SearchFilter[]
  formats?: BookFormat[]
  limit?: number
}

export interface BookSearchResult {
  id: number
  name: string
  cover: string | null
  authors: { id: number; name: string }[]
  fileFormat: string
  fileName: string
  originalFileName: string
  matchedField?: 'title' | 'book_id' | 'file_name' | 'internal_file_name'
  matchedBookId?: {
    idType: string
    idVal: string
  }
}

export interface CollectionSearchResult {
  id: number
  name: string
  booksCount: number
}

export interface SearchResults {
  books: BookSearchResult[]
  collections: CollectionSearchResult[]
  totalBooks: number
  totalCollections: number
}

/**
 * Case-insensitive string matching with full Unicode support.
 * SQLite's LIKE/LOWER only work with ASCII, so we use JavaScript's
 * toLowerCase() which properly handles Unicode (Cyrillic, etc.)
 * 
 * Reference: https://shallowdepth.online/posts/2022/01/5-ways-to-implement-case-insensitive-search-in-sqlite-with-full-unicode-support/
 */
function unicodeCaseInsensitiveContains(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.toLowerCase())
}

export const searchQuery = {
  async search(params: SearchParams): Promise<SearchResults> {
    const { query, filters = ['books', 'collections'], formats, limit } = params
    
    if (!query || query.trim().length === 0) {
      return { books: [], collections: [], totalBooks: 0, totalCollections: 0 }
    }

    const searchTermLower = query.trim().toLowerCase()
    const bookResults: BookSearchResult[] = []
    const bookIds = new Set<number>()

    // Search in books by title
    if (filters.includes('books')) {
      // Fetch all books (or with format filter) and filter in JavaScript
      // This ensures proper Unicode case-insensitive matching
      let qb = db.manager
        .createQueryBuilder(BookEntity, 'book')
        .leftJoinAndSelect('book.authors', 'author')

      if (formats && formats.length > 0) {
        qb = qb.where('book.fileFormat IN (:...formats)', { formats })
      }

      const allBooks = await qb.getMany()

      // Filter with Unicode-aware case-insensitive comparison
      const matchingBooks = allBooks.filter(book => 
        unicodeCaseInsensitiveContains(book.name, searchTermLower)
      )

      for (const book of matchingBooks) {
        if (!bookIds.has(book.id)) {
          bookIds.add(book.id)
          bookResults.push({
            id: book.id,
            name: book.name,
            cover: book.cover,
            authors: book.authors.map(a => ({ id: a.id, name: a.name })),
            fileFormat: book.fileFormat,
            fileName: book.fileName,
            originalFileName: book.originalFileName,
            matchedField: 'title',
          })
        }
      }
    }

    // Search in book IDs
    if (filters.includes('book_ids')) {
      const allBookIds = await db.manager.find(BookIdEntity, {
        relations: { book: { authors: true } },
      })

      const matchingBookIds = allBookIds.filter(bookId => 
        unicodeCaseInsensitiveContains(bookId.idVal, searchTermLower)
      )

      for (const bookIdEntity of matchingBookIds) {
        if (bookIdEntity.book && !bookIds.has(bookIdEntity.book.id)) {
          const book = bookIdEntity.book
          // Check format filter
          if (formats && formats.length > 0 && !formats.includes(book.fileFormat as BookFormat)) {
            continue
          }
          bookIds.add(book.id)
          bookResults.push({
            id: book.id,
            name: book.name,
            cover: book.cover,
            authors: book.authors.map(a => ({ id: a.id, name: a.name })),
            fileFormat: book.fileFormat,
            fileName: book.fileName,
            originalFileName: book.originalFileName,
            matchedField: 'book_id',
            matchedBookId: {
              idType: bookIdEntity.idType,
              idVal: bookIdEntity.idVal,
            },
          })
        }
      }
    }

    // Search by original file name
    if (filters.includes('file_names')) {
      let qb = db.manager
        .createQueryBuilder(BookEntity, 'book')
        .leftJoinAndSelect('book.authors', 'author')

      if (formats && formats.length > 0) {
        qb = qb.where('book.fileFormat IN (:...formats)', { formats })
      }

      const allBooks = await qb.getMany()

      const matchingBooks = allBooks.filter(book => 
        unicodeCaseInsensitiveContains(book.originalFileName, searchTermLower)
      )

      for (const book of matchingBooks) {
        if (!bookIds.has(book.id)) {
          bookIds.add(book.id)
          bookResults.push({
            id: book.id,
            name: book.name,
            cover: book.cover,
            authors: book.authors.map(a => ({ id: a.id, name: a.name })),
            fileFormat: book.fileFormat,
            fileName: book.fileName,
            originalFileName: book.originalFileName,
            matchedField: 'file_name',
          })
        }
      }
    }

    // Search by internal file name (UUID)
    if (filters.includes('internal_file_names')) {
      let qb = db.manager
        .createQueryBuilder(BookEntity, 'book')
        .leftJoinAndSelect('book.authors', 'author')

      if (formats && formats.length > 0) {
        qb = qb.where('book.fileFormat IN (:...formats)', { formats })
      }

      const allBooks = await qb.getMany()

      const matchingBooks = allBooks.filter(book => 
        unicodeCaseInsensitiveContains(book.fileName, searchTermLower)
      )

      for (const book of matchingBooks) {
        if (!bookIds.has(book.id)) {
          bookIds.add(book.id)
          bookResults.push({
            id: book.id,
            name: book.name,
            cover: book.cover,
            authors: book.authors.map(a => ({ id: a.id, name: a.name })),
            fileFormat: book.fileFormat,
            fileName: book.fileName,
            originalFileName: book.originalFileName,
            matchedField: 'internal_file_name',
          })
        }
      }
    }

    // Search collections
    let collectionResults: CollectionSearchResult[] = []
    let totalCollections = 0

    if (filters.includes('collections')) {
      const allCollections = await db.manager.find(CollectionEntity, {
        order: { name: 'ASC' },
      })

      const matchingCollections = allCollections.filter(collection =>
        unicodeCaseInsensitiveContains(collection.name, searchTermLower)
      )

      totalCollections = matchingCollections.length
      collectionResults = matchingCollections.map(c => ({
        id: c.id,
        name: c.name,
        booksCount: c.booksCount,
      }))
    }

    // Apply limit after all filtering
    const finalBooks = limit ? bookResults.slice(0, limit) : bookResults
    const finalCollections = limit ? collectionResults.slice(0, limit) : collectionResults

    return {
      books: finalBooks,
      collections: finalCollections,
      totalBooks: bookResults.length,
      totalCollections,
    }
  },

  // Quick search for dropdown (limited results)
  async quickSearch(query: string): Promise<{
    books: BookSearchResult[]
    collections: CollectionSearchResult[]
    hasMoreBooks: boolean
    hasMoreCollections: boolean
  }> {
    const DROPDOWN_LIMIT = 5

    if (!query || query.trim().length === 0) {
      return { books: [], collections: [], hasMoreBooks: false, hasMoreCollections: false }
    }

    const searchTermLower = query.trim().toLowerCase()

    // Fetch all books and filter in JavaScript for proper Unicode support
    const allBooks = await db.manager.find(BookEntity, {
      relations: { authors: true },
    })

    const matchingBooks = allBooks.filter(book =>
      unicodeCaseInsensitiveContains(book.name, searchTermLower)
    )

    // Fetch all collections and filter
    const allCollections = await db.manager.find(CollectionEntity, {
      order: { name: 'ASC' },
    })

    const matchingCollections = allCollections.filter(collection =>
      unicodeCaseInsensitiveContains(collection.name, searchTermLower)
    )

    return {
      books: matchingBooks.slice(0, DROPDOWN_LIMIT).map(book => ({
        id: book.id,
        name: book.name,
        cover: book.cover,
        authors: book.authors.map(a => ({ id: a.id, name: a.name })),
        fileFormat: book.fileFormat,
        fileName: book.fileName,
        originalFileName: book.originalFileName,
        matchedField: 'title' as const,
      })),
      collections: matchingCollections.slice(0, DROPDOWN_LIMIT).map(c => ({
        id: c.id,
        name: c.name,
        booksCount: c.booksCount,
      })),
      hasMoreBooks: matchingBooks.length > DROPDOWN_LIMIT,
      hasMoreCollections: matchingCollections.length > DROPDOWN_LIMIT,
    }
  },
}
