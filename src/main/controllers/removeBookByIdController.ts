import fs from 'node:fs/promises'
import { booksQuery } from '../queries/books'
import { authorsQuery } from '../queries/authors'
import { logger } from '../utils/logger'

export const removeBookByIdController = async ({ input }): Promise<boolean> => {
  const book = await booksQuery.book({ id: Number(input.id) })
  if (!book) return false

  const paths = [
    ...book.files.map((file) => file.storedPath),
    ...book.files.map((file) => file.coverPath).filter((value): value is string => Boolean(value)),
  ]
  await booksQuery.removeBook({ id: book.id })
  await authorsQuery.removeOrphans()
  await Promise.all(
    [...new Set(paths)].map(async (filePath) => {
      try {
        await fs.unlink(filePath)
      } catch {
        logger.debug('Managed book asset cleanup skipped - file does not exist')
      }
    })
  )
  return true
}
