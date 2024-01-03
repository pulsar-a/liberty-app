/*
  name: string
  bookIdentifier: string
  identifierType: string
  cover?: string
  score?: number
  fileName: string
  fileFormat: string
  description?: string
  readingProgress?: number
  createdAt?: Date
  updatedAt?: Date
 */

import { PrismaClient } from '@prisma/client'
import { BookEntity } from '../../types/books.types'

const prisma = new PrismaClient()

export const booksSeed = async () => {
  const books: Omit<BookEntity, 'id'>[] = [
    {
      name: 'The Lord of the Rings',
      bookIdentifier: '9780261103252',
      identifierType: 'ISBN',
      cover: '',
      score: 5,
      fileName: 'The Lord of the Rings - J.R.R. Tolkien.epub',
      fileFormat: 'epub',
      description:
        'The Lord of the Rings is an epic high-fantasy novel written by English author and scholar J. R. R. Tolkien.',
      readingProgress: 0,
    },
    {
      name: 'The Hobbit',
      bookIdentifier: '9780261103306',
      identifierType: 'ISBN',
      cover: '',
      score: 3,
      fileName: 'The Hobbit - J.R.R. Tolkien.epub',
      fileFormat: 'epub',
      description:
        'The Hobbit, or There and Back Again is a childrens fantasy novel by English author J. R. R. Tolkien.',
      readingProgress: 0,
    },

    {
      name: 'The Silmarillion',
      bookIdentifier: '9780261102736',
      identifierType: 'ISBN',
      cover: '',
      score: 2,
      fileName: 'The Silmarillion - J.R.R. Tolkien.epub',
      fileFormat: 'mobi',
      description:
        'The Silmarillion is a collection of mythopoeic works by English writer J. R. R. Tolkien, edited and published posthumously by his son, Christopher Tolkien, in 1977, with assistance from Guy Gavriel Kay.',
      readingProgress: 0,
    },

    {
      name: 'Reliquary',
      bookIdentifier: '9780261102236',
      identifierType: 'ISBN',
      cover: '',
      score: 5,
      fileName: 'reliquary.epub',
      fileFormat: 'epub',
      description:
        'Reliquary is a 1997 techno-thriller novel by American authors Douglas Preston and Lincoln Child, and the sequel to Relic.',
      readingProgress: 0,
    },
  ]

  try {
    console.log('Seeding books...')
    await Promise.all(
      books.map((book) => {
        return prisma.book.upsert({
          where: {
            uniqueBookId: {
              bookIdentifier: book.bookIdentifier,
              identifierType: book.identifierType,
            },
          },
          // @ts-ignore this is seed data with prisma structure
          create: book,
          // @ts-ignore this is seed data with prisma structure
          update: book,
        })
      })
    )
    console.log('Books seeded.')
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }

  const connections = [
    {
      authorId: 4,
      bookId: 1,
    },
    {
      authorId: 5,
      bookId: 1,
    },
    {
      authorId: 3,
      bookId: 2,
    },
    {
      authorId: 3,
      bookId: 3,
    },
    {
      authorId: 3,
      bookId: 4,
    },
  ]

  try {
    console.log('Seeding connections...')
    await Promise.all(
      connections.map((connection) => {
        return prisma.authorBook.upsert({
          where: {
            bookId_authorId: {
              authorId: connection.authorId,
              bookId: connection.bookId,
            },
          },
          // @ts-ignore this is seed data with prisma structure
          create: connection,
          // @ts-ignore this is seed data with prisma structure
          update: connection,
        })
      })
    )
    console.log('Connections seeded.')
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}
