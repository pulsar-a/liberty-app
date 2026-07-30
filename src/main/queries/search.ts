import type {
  BookSearchResult,
  CollectionSearchResult,
  SearchParams,
  SearchResults,
} from '../../../types/search.types'
import BookEntity from '../entities/book.entity'
import CollectionEntity from '../entities/collection.entity'
import { db } from '../services/db'
import { getReadableBookFormats } from '../../../types/reader-engines'

const readableFormats = new Set<string>(getReadableBookFormats())

const contains = (text: string, search: string): boolean =>
  text.toLocaleLowerCase().includes(search.toLocaleLowerCase())

const baseResult = (book: BookEntity): Omit<BookSearchResult, 'matchedField'> => {
  const activeFiles = book.files.filter((file) => !file.removedAt)
  const cover =
    book.files.find((file) => file.id === book.coverBookFileId)?.coverPath ||
    book.files.find((file) => file.coverPath)?.coverPath ||
    null
  return {
    id: book.id,
    name: book.name,
    cover,
    authors: book.authors.map(({ id, name }) => ({ id, name })),
    formats: [...new Set(activeFiles.map((file) => file.fileFormat.toLowerCase()))].sort(),
    activeFileCount: activeFiles.length,
    hasReadableFile: activeFiles.some((file) => readableFormats.has(file.fileFormat.toLowerCase())),
  }
}

export const searchQuery = {
  async search(params: SearchParams): Promise<SearchResults> {
    const { query, filters = ['books', 'collections'], formats, limit } = params
    const term = query.trim()
    if (!term) return { books: [], collections: [], totalBooks: 0, totalCollections: 0 }

    const bookFilters = filters.filter((filter) => filter !== 'collections')
    let matchingBooks: BookEntity[] = []
    let totalBooks = 0
    if (bookFilters.length > 0) {
      const conditions: string[] = []
      if (filters.includes('books')) conditions.push('LOWER(book.name) LIKE :term')
      if (filters.includes('book_ids')) conditions.push('LOWER(identifier.idVal) LIKE :term')
      if (filters.includes('file_names')) conditions.push('LOWER(file.originalFileName) LIKE :term')
      if (filters.includes('internal_file_names')) conditions.push('LOWER(file.storedPath) LIKE :term')

      const queryBuilder = db
        .getRepository(BookEntity)
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.authors', 'author')
        .leftJoinAndSelect('book.files', 'file')
        .leftJoinAndSelect('file.identifiers', 'identifier')
        .where(`(${conditions.join(' OR ')})`, { term: `%${term.toLocaleLowerCase()}%` })
        .distinct(true)
        .orderBy('book.name', 'ASC')
        .take(limit ?? 200)

      if (formats?.length) {
        queryBuilder.andWhere('LOWER(file.fileFormat) IN (:...formats)', {
          formats: formats.map((format) => format.toLocaleLowerCase()),
        })
      }
      ;[matchingBooks, totalBooks] = await queryBuilder.getManyAndCount()
    }

    const results: BookSearchResult[] = []

    for (const book of matchingBooks) {
      const activeFiles = book.files.filter((file) => !file.removedAt)
      if (
        formats?.length &&
        !activeFiles.some((file) =>
          (formats as readonly string[]).includes(file.fileFormat.toLowerCase())
        )
      ) {
        continue
      }

      let result: BookSearchResult | null = null
      if (filters.includes('books') && contains(book.name, term)) {
        result = { ...baseResult(book), matchedField: 'title' }
      }

      if (!result && filters.includes('book_ids')) {
        const identifier = book.files
          .flatMap((file) => file.identifiers)
          .find((item) => contains(item.idVal, term))
        if (identifier) {
          result = {
            ...baseResult(book),
            matchedField: 'book_id',
            matchedBookId: { idType: identifier.idType, idVal: identifier.idVal },
          }
        }
      }

      if (!result && filters.includes('file_names')) {
        const file = book.files.find((item) => contains(item.originalFileName, term))
        if (file) {
          result = {
            ...baseResult(book),
            matchedField: 'file_name',
            matchedFile: {
              id: file.id,
              fileFormat: file.fileFormat,
              storedPath: file.storedPath,
              originalFileName: file.originalFileName,
              isAvailable: !file.removedAt,
            },
          }
        }
      }

      if (!result && filters.includes('internal_file_names')) {
        const file = book.files.find((item) => contains(item.storedPath, term))
        if (file) {
          result = {
            ...baseResult(book),
            matchedField: 'internal_file_name',
            matchedFile: {
              id: file.id,
              fileFormat: file.fileFormat,
              storedPath: file.storedPath,
              originalFileName: file.originalFileName,
              isAvailable: !file.removedAt,
            },
          }
        }
      }
      if (result) results.push(result)
    }

    let collectionResults: CollectionSearchResult[] = []
    let totalCollections = 0
    if (filters.includes('collections')) {
      const [collections, count] = await db
        .getRepository(CollectionEntity)
        .createQueryBuilder('collection')
        .where('LOWER(collection.name) LIKE :term', {
          term: `%${term.toLocaleLowerCase()}%`,
        })
        .orderBy('collection.name', 'ASC')
        .take(limit ?? 200)
        .getManyAndCount()
      totalCollections = count
      collectionResults = collections.map(({ id, name, booksCount }) => ({
        id,
        name,
        booksCount,
      }))
    }

    return {
      books: results,
      collections: collectionResults,
      totalBooks,
      totalCollections,
    }
  },

  async quickSearch(query: string) {
    const results = await searchQuery.search({
      query,
      filters: ['books', 'collections'],
      limit: 6,
    })
    const limit = 5
    return {
      books: results.books.slice(0, limit),
      collections: results.collections.slice(0, limit),
      hasMoreBooks: results.totalBooks > limit,
      hasMoreCollections: results.totalCollections > limit,
    }
  },
}
