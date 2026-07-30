import { z } from 'zod'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookMatchEntity from '../entities/bookMatch.entity'
import AuthorEntity from '../entities/author.entity'
import CollectionEntity from '../entities/collection.entity'
import { db } from '../services/db'
import { getReadableBookFormats } from '../../../types/reader-engines'
import { authorsQuery } from '../queries/authors'
import { removeManagedBookFile } from '../utils/managedFiles'

const readableFormats = new Set<string>(getReadableBookFormats())

export const setPreferredBookFileInputSchema = z.object({
  bookId: z.number().int().positive(),
  bookFileId: z.number().int().positive(),
})

export const removeBookFileInputSchema = z.object({
  bookFileId: z.number().int().positive(),
})

export const mergeBooksInputSchema = z.object({
  bookId: z.number().int().positive(),
  candidateBookId: z.number().int().positive(),
})

export const dismissBookMatchInputSchema = z.object({
  matchId: z.number().int().positive(),
})

export async function setPreferredBookFileController({
  input,
}: {
  input: z.infer<typeof setPreferredBookFileInputSchema>
}): Promise<boolean> {
  const file = await db.manager.findOneBy(BookFileEntity, {
    id: input.bookFileId,
    bookId: input.bookId,
  })
  if (!file || file.removedAt || !readableFormats.has(file.fileFormat.toLowerCase())) return false

  await db.manager.update(BookEntity, input.bookId, { preferredBookFileId: file.id })
  return true
}

export async function removeBookFileController({
  input,
}: {
  input: z.infer<typeof removeBookFileInputSchema>
}): Promise<{ success: boolean; isFileless: boolean }> {
  const file = await db.manager.findOneBy(BookFileEntity, { id: input.bookFileId })
  if (!file || file.removedAt) return { success: false, isFileless: false }

  file.removedAt = new Date()
  await db.manager.save(file)

  const activeFiles = await db
    .getRepository(BookFileEntity)
    .createQueryBuilder('file')
    .where('file.bookId = :bookId', { bookId: file.bookId })
    .andWhere('file.removedAt IS NULL')
    .orderBy('file.lastOpenedAt', 'DESC')
    .addOrderBy('file.id', 'ASC')
    .getMany()

  const book = await db.manager.findOneBy(BookEntity, { id: file.bookId })
  if (book?.preferredBookFileId === file.id) {
    book.preferredBookFileId =
      activeFiles.find((candidate) => readableFormats.has(candidate.fileFormat.toLowerCase()))?.id ||
      null
    await db.manager.save(book)
  }

  await removeManagedBookFile(file.storedPath)
  return { success: true, isFileless: activeFiles.length === 0 }
}

export async function dismissBookMatchController({
  input,
}: {
  input: z.infer<typeof dismissBookMatchInputSchema>
}): Promise<boolean> {
  const match = await db.manager.findOneBy(BookMatchEntity, { id: input.matchId })
  if (!match) return false
  match.dismissedAt = new Date()
  await db.manager.save(match)
  return true
}

async function refreshCounters(): Promise<void> {
  const authors = await db.manager.find(AuthorEntity, { relations: { books: true } })
  await db.manager.save(
    authors.map((author) => {
      author.booksCount = author.books.length
      return author
    })
  )
  const collections = await db.manager.find(CollectionEntity, { relations: { books: true } })
  await db.manager.save(
    collections.map((collection) => {
      collection.booksCount = collection.books.length
      return collection
    })
  )
}

export async function mergeBooksController({
  input,
}: {
  input: z.infer<typeof mergeBooksInputSchema>
}): Promise<{ survivingBookId: number } | null> {
  if (input.bookId === input.candidateBookId) return null
  const books = await db.manager.find(BookEntity, {
    where: [{ id: input.bookId }, { id: input.candidateBookId }],
    relations: { authors: true, collections: true, files: true },
  })
  if (books.length !== 2) return null

  const [target, source] = books.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id
  )

  await db.transaction(async (manager) => {
    target.lang ||= source.lang
    target.publisher ||= source.publisher
    target.description ||= source.description
    target.score ??= source.score
    target.isFavorite = target.isFavorite || source.isFavorite
    target.readingProgression =
      target.readingProgression === null && source.readingProgression === null
        ? null
        : Math.max(target.readingProgression || 0, source.readingProgression || 0)
    if (!target.authors.length) target.authors = source.authors
    target.collections = [
      ...new Map([...target.collections, ...source.collections].map((item) => [item.id, item])).values(),
    ]

    await manager.update(BookFileEntity, { bookId: source.id }, { bookId: target.id })
    await manager.query('UPDATE "bookmarks" SET "bookId" = ? WHERE "bookId" = ?', [
      target.id,
      source.id,
    ])

    const transferredPreferred = source.files.find(
      (file) => file.id === source.preferredBookFileId && !file.removedAt
    )
    if (!target.preferredBookFileId && transferredPreferred) {
      target.preferredBookFileId = transferredPreferred.id
    }
    const transferredCover = source.files.find((file) => file.id === source.coverBookFileId)
    if (!target.coverBookFileId && transferredCover?.coverPath) {
      target.coverBookFileId = transferredCover.id
    }

    await manager.save(target)
    await manager.delete(BookMatchEntity, [
      { bookId: source.id },
      { candidateBookId: source.id },
    ])
    source.authors = []
    source.collections = []
    source.files = []
    await manager.save(source)
    await manager.remove(source)
  })

  await refreshCounters()
  await authorsQuery.removeOrphans()
  return { survivingBookId: target.id }
}
