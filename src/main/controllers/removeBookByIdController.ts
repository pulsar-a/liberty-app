import fs from 'node:fs/promises'
import { authorsQuery } from '../queries/authors'
import { booksQuery } from '../queries/books'
import { logger } from '../utils/logger'

export const removeBookByIdController = async ({ input }): Promise<boolean> => {
  const book = await booksQuery.book({ id: input.id })

  if (!book) {
    return false
  }

  // Remove files
  try {
    await fs.unlink(book.fileName)
  } catch {
    logger.debug('Book file cleanup skipped - file does not exist')
  }

  try {
    if (book.cover) {
      await fs.unlink(book.cover)
    }
  } catch {
    logger.debug('Cover file cleanup skipped - file does not exist')
  }

  await booksQuery.removeBook({ id: input.id })
  await authorsQuery.removeOrphans()

  return true
}
