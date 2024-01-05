import AuthorEntity from '../entities/author.entity'
import { db } from '../services/db'

export const authorsQuery = {
  async authors(): Promise<AuthorEntity[]> {
    return db.manager.find(AuthorEntity, {
      relations: {
        books: true,
      },
    })
  },
  async author({ id }: { id: number }): Promise<AuthorEntity | null> {
    return db.manager.findOne(AuthorEntity, {
      where: { id },
      relations: {
        books: true,
      },
    })
  },
  // async createBook(book: Omit<BookEntity, 'id'>) {
  //   const book = new BookEntity()
  // },
}
