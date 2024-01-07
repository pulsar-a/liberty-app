import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { addBooksController } from '../controllers/addBooks.controller'
import { changeColorSchemeController } from '../controllers/changeColorScheme.controller'
import { getBooksController } from '../controllers/getBooks.controller'
import { getPlatformDataController } from '../controllers/getPlatformData.controller'
import AuthorEntity from '../entities/author.entity'
import { authorsQuery } from '../queries/authors'

const trpc = initTRPC.create({ isServer: true })

export const router = trpc.router({
  changeColorScheme: trpc.procedure
    .input(z.object({ colorScheme: z.union([z.literal('light'), z.literal('dark')]) }))
    .mutation(changeColorSchemeController()),
  addBooks: trpc.procedure.mutation(addBooksController()),
  getPlatformData: trpc.procedure.query(getPlatformDataController()),
  getBooks: trpc.procedure.query(getBooksController()),
  getAuthors: trpc.procedure.query(async (): Promise<{ items: AuthorEntity[] }> => {
    const authors = await authorsQuery.authors()
    return {
      items: authors,
    }
  }),
})

export type AppRouter = typeof router
