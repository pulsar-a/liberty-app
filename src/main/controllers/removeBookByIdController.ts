import { booksQuery } from '../queries/books'
import { authorsQuery } from '../queries/authors'
import { removeManagedBookFile } from '../utils/managedFiles'

export const removeBookByIdController = async ({ input }): Promise<boolean> => {
  const book = await booksQuery.book({ id: Number(input.id) })
  if (!book) return false

  const paths = [
    ...book.files.map((file) => file.storedPath),
    ...book.files.map((file) => file.coverPath).filter((value): value is string => Boolean(value)),
  ]
  await booksQuery.removeBook({ id: book.id })
  await authorsQuery.removeOrphans()
  await Promise.all([...new Set(paths)].map(removeManagedBookFile))
  return true
}
