import type { Book } from '../../../types/books.types'
import { booksQuery } from '../queries/books'
import { toBookDto } from '../services/bookDtos'

export const getBookByIdController = async ({ input }): Promise<Book | null> => {
  const id = Number(input.id)
  const book = await booksQuery.book({ id })
  if (!book) return null
  return toBookDto(book, await booksQuery.matchesForBook(id))
}
