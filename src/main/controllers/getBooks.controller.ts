import BookEntity from '../entities/book.entity'
import { booksQuery } from '../queries/books'

export const getBooksController = () => async (): Promise<{ items: BookEntity[] }> => {
  const books = await booksQuery.books()
  return {
    items: books,
  }
}
