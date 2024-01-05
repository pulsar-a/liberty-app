import { initTRPC } from '@trpc/server'
import { addBooksController } from '../controllers/addBooks.controller'
import { getBooksController } from '../controllers/getBooks.controller'
import AuthorEntity from '../entities/author.entity'
import { authorsQuery } from '../queries/authors'

const trpc = initTRPC.create({ isServer: true })

export const router = trpc.router({
  addBooks: trpc.procedure.mutation(addBooksController()),
  getBooks: trpc.procedure.query(getBooksController()),
  getAuthors: trpc.procedure.query(async (): Promise<{ items: AuthorEntity[] }> => {
    const authors = await authorsQuery.authors()
    return {
      items: authors,
    }
  }),
})

export type AppRouter = typeof router
