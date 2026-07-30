import type { BookSummary } from '../../../types/books.types'
import { booksQuery } from '../queries/books'
import { toBookSummary } from '../services/bookDtos'
import { z } from 'zod'

export const getBooksInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(60),
    cursor: z.number().int().positive().optional(),
    authorId: z.number().int().positive().nullable().optional(),
  })
  .optional()

export const getBooksController = async ({
  input,
}: {
  input?: z.infer<typeof getBooksInputSchema>
}): Promise<{ items: BookSummary[]; total: number; nextCursor?: number }> => {
  const limit = input?.limit ?? 60
  const result = await booksQuery.books({
    limit,
    cursor: input?.cursor,
    authorId: input?.authorId,
  })
  const items = await Promise.all(result.items.map(toBookSummary))
  return {
    items,
    total: result.total,
    nextCursor: items.length === limit ? items.at(-1)?.id : undefined,
  }
}
