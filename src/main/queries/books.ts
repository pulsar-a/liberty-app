import { IsNull } from 'typeorm'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookIdEntity from '../entities/bookId.entity'
import BookMatchEntity from '../entities/bookMatch.entity'
import { db } from '../services/db'
import { authorsQuery } from './authors'
import { getReadableBookFormats } from '../../../types/reader-engines'

const readableFormats = new Set<string>(getReadableBookFormats())

export const booksQuery = {
  async books(): Promise<BookEntity[]> {
    return db.manager.find(BookEntity, {
      relations: { authors: true, files: { identifiers: true } },
    })
  },

  async book({ id }: { id: number }): Promise<BookEntity | null> {
    return db.manager.findOne(BookEntity, {
      where: { id },
      relations: {
        authors: true,
        collections: true,
        files: { identifiers: true },
      },
    })
  },

  async matchesForBook(bookId: number): Promise<BookMatchEntity[]> {
    return db
      .getRepository(BookMatchEntity)
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.book', 'book')
      .leftJoinAndSelect('book.authors', 'bookAuthor')
      .leftJoinAndSelect('book.files', 'bookFile')
      .leftJoinAndSelect('bookFile.identifiers', 'bookIdentifier')
      .leftJoinAndSelect('match.candidateBook', 'candidate')
      .leftJoinAndSelect('candidate.authors', 'candidateAuthor')
      .leftJoinAndSelect('candidate.files', 'candidateFile')
      .leftJoinAndSelect('candidateFile.identifiers', 'candidateIdentifier')
      .where('(match.bookId = :bookId OR match.candidateBookId = :bookId)', { bookId })
      .andWhere('match.dismissedAt IS NULL')
      .getMany()
  },

  async removeBook({ id }: { id: number }): Promise<void> {
    const book = await booksQuery.book({ id })
    if (!book) return
    await Promise.all(book.authors.map((author) => authorsQuery.decrementBooks(author.id)))
    await db.manager.remove(book)
  },

  async createBook(book: Partial<BookEntity>): Promise<BookEntity> {
    const repository = db.getRepository(BookEntity)
    return repository.save(repository.create(book))
  },

  async createBookFile(bookFile: Partial<BookFileEntity>): Promise<BookFileEntity> {
    const repository = db.getRepository(BookFileEntity)
    return repository.save(repository.create(bookFile))
  },

  async createBookId(bookId: Partial<BookIdEntity>): Promise<BookIdEntity> {
    const repository = db.getRepository(BookIdEntity)
    return repository.save(repository.create(bookId))
  },

  async resolveReadableFile(bookId: number, requestedFileId?: number): Promise<BookFileEntity | null> {
    const files = await db.manager.find(BookFileEntity, {
      where: { bookId, removedAt: IsNull() },
      relations: { identifiers: true },
    })
    const readable = files.filter((file) => readableFormats.has(file.fileFormat.toLowerCase()))
    if (requestedFileId) return readable.find((file) => file.id === requestedFileId) || null

    const book = await db.manager.findOneBy(BookEntity, { id: bookId })
    return (
      readable.find((file) => file.id === book?.preferredBookFileId) ||
      readable.sort(
        (a, b) =>
          (b.lastOpenedAt?.getTime() || 0) - (a.lastOpenedAt?.getTime() || 0) || a.id - b.id
      )[0] ||
      null
    )
  },

  async toggleFavorite(bookId: number): Promise<{ isFavorite: boolean } | null> {
    const book = await db.manager.findOneBy(BookEntity, { id: bookId })
    if (!book) return null
    book.isFavorite = !book.isFavorite
    await db.manager.save(book)
    return { isFavorite: book.isFavorite }
  },

  async getFavoriteBooks(): Promise<BookEntity[]> {
    return db.manager.find(BookEntity, {
      where: { isFavorite: true },
      relations: { authors: true, files: { identifiers: true } },
    })
  },

  async getFavoriteBooksCount(): Promise<number> {
    return db.manager.count(BookEntity, { where: { isFavorite: true } })
  },
}
