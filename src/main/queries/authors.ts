import AuthorEntity from '../entities/author.entity'
import { db } from '../services/db'

const repository = db.getRepository(AuthorEntity)

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
  async findByName(name: string): Promise<AuthorEntity | null> {
    return db.manager.findOne(AuthorEntity, {
      where: { name },
      relations: {
        books: true,
      },
    })
  },
  async incrementBooks(authorId: number): Promise<AuthorEntity | null> {
    await repository.increment({ id: authorId }, 'booksCount', 1)

    return db.manager.findOne(AuthorEntity, {
      where: { id: authorId },
    })
  },
  async decrementBooks(authorId: number): Promise<AuthorEntity | null> {
    await repository.decrement({ id: authorId }, 'booksCount', 1)

    return db.manager.findOne(AuthorEntity, {
      where: { id: authorId },
    })
  },
  async removeOrphans(): Promise<void> {
    repository.createQueryBuilder('authors').delete().where('booksCount = 0').execute()
  },
  async createAuthor(author: Omit<AuthorEntity, 'id'>): Promise<AuthorEntity> {
    const authorRepository = db.getRepository(AuthorEntity)
    const newAuthor = authorRepository.create(author)

    return await authorRepository.save(newAuthor)
  },
}
