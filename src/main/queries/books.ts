import { PrismaClient } from '@prisma/client'
import { BookEntity } from '../../../types/books.types'

const prisma = new PrismaClient()

export const booksQuery = {
  async books(): Promise<BookEntity[]> {
    return prisma.book.findMany({
      include: {
        authors: true,
      },
    })
  },
  async book({ id }: { id: number }): Promise<BookEntity> {
    return prisma.book.findUnique({
      where: { id },
      include: {
        authors: true,
      },
    })
  },
  async createBook(book: Omit<BookEntity, 'id'>) {
    return prisma.book.create({
      data: book,
    })
  },
}
