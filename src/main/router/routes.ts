import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import { addBooksController } from '../controllers/addBooks.controller'
import { changeColorSchemeController } from '../controllers/changeColorScheme.controller'
import { getAuthorsController } from '../controllers/getAuthors.controller'
import { getBookByIdController } from '../controllers/getBookById.controller'
import { getBooksController } from '../controllers/getBooks.controller'
import { getPlatformDataController } from '../controllers/getPlatformData.controller'
import { removeBookByIdController } from '../controllers/removeBookByIdController'

const trpc = initTRPC.create({
  isServer: true,
  transformer: superjson,
})

export const router = trpc.router({
  changeColorScheme: trpc.procedure
    .input(z.object({ colorScheme: z.union([z.literal('light'), z.literal('dark')]) }))
    .mutation(changeColorSchemeController),
  addBooks: trpc.procedure.mutation(addBooksController),
  getPlatformData: trpc.procedure.query(getPlatformDataController),
  getBooks: trpc.procedure.query(getBooksController),
  getBookById: trpc.procedure
    .input(z.object({ id: z.union([z.number(), z.string()]) }))
    .query(getBookByIdController),
  removeBookById: trpc.procedure
    .input(z.object({ id: z.union([z.number(), z.string()]) }))
    .mutation(removeBookByIdController),
  getAuthors: trpc.procedure.query(getAuthorsController),
})

export type AppRouter = typeof router
