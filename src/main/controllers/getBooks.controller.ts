import type { BookSummary } from '../../../types/books.types'
import { booksQuery } from '../queries/books'
import { toBookSummary } from '../services/bookDtos'

export const getBooksController = async (): Promise<{ items: BookSummary[] }> => {
  const books = await booksQuery.books()
  return {
    items: await Promise.all(books.map(toBookSummary)),
  }
}
