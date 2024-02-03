import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
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
        bookIds: true,
      },
    })
  },
  async createBook(book: Omit<BookEntity, 'id'>) {
    const bookRepository = db.getRepository(BookEntity)
    const newBook = bookRepository.create(book)
    return await bookRepository.save(newBook)
  },
  async createBookId(bookId: Omit<BookIdEntity, 'id'>) {
    const repository = db.getRepository(BookIdEntity)
    const newItem = repository.create(bookId)
    return await repository.save(newItem)
  },
}
