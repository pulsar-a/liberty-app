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
import { AuthorEntity } from '../../types/books.types'

const prisma = new PrismaClient()
export const authorSeed = async () => {
  const authors: Omit<AuthorEntity, 'id'>[] = [
    {
      name: 'J.R.R. Tolkien',
    },
    {
      name: 'Douglas Preston',
    },
    {
      name: 'Lincoln Child',
    },
    {
      name: 'Габдулла Тукай',
    },
    {
      name: 'Тарас Шевченко',
    },
    {
      name: 'Stephen King',
    },
  ]

  try {
    console.log('Seeding authors...')
    await Promise.all(
      authors.map((author) => {
        return prisma.author.upsert({
          where: author,
          update: author,
          create: author,
        })
      })
    )
    console.log('Authors seeded.')
  } catch (error) {
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}
