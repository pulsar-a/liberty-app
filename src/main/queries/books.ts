import BookEntity from '../entities/book.entity'
import { db } from '../services/db'

export const booksQuery = {
  async books(): Promise<BookEntity[]> {
    return db.manager.find(BookEntity, {
      relations: {
        authors: true,
      },
    })
  },
  async book({ id }: { id: number }): Promise<BookEntity | null> {
    return db.manager.findOne(BookEntity, {
      where: { id },
      relations: {
        authors: true,
      },
    })
  },
  // async createBook(book: Omit<BookEntity, 'id'>) {
  //   const book = new BookEntity()
  // },
}
