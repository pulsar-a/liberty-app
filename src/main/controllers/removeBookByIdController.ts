import fs from 'node:fs/promises'
import { booksQuery } from '../queries/books'

export const removeBookByIdController = async ({ input }): Promise<boolean> => {
  const book = await booksQuery.book({ id: input.id })

  if (!book) {
    return false
  }

  // Remove files
  try {
    await fs.unlink(book.fileName)
  } catch (error) {
    console.warn('Book file doesnt exist. Ignoring.')
  }

  try {
    if (book.cover) {
      await fs.unlink(book.cover)
    }
  } catch (error) {
    console.warn('Book cover file doesnt exist. Ignoring.')
  }

  await booksQuery.removeBook({ id: input.id })

  return true
}
