import BookEntity from '../entities/book.entity'
import { booksQuery } from '../queries/books'

export const getBookByIdController = async ({ input }): Promise<BookEntity | null> => {
  return await booksQuery.book({ id: input.id })
}
