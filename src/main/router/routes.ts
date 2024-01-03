import { PrismaClient } from '@prisma/client'
import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { EventEmitter } from 'events'
import { z } from 'zod'
import { BookEntity } from '../../../types/books.types'

const prisma = new PrismaClient()

const ee = new EventEmitter()

const t = initTRPC.create({ isServer: true })

export const router = t.router({
  greeting: t.procedure.input(z.object({ name: z.string() })).query((req) => {
    const { input } = req

    ee.emit('greeting', `Greeted ${input.name}`)
    return {
      text: `Hello ${input.name}` as const,
    }
  }),
  subscription: t.procedure.subscription(() => {
    return observable((emit) => {
      function onGreet(text: string) {
        emit.next({ text })
      }

      ee.on('greeting', onGreet)

      return () => {
        ee.off('greeting', onGreet)
      }
    })
  }),
  getBooks: t.procedure.query(async () => {
    const books = await prisma.book.findMany()
    return {
      items: books.map((book) => ({
        ...book,
        authors: [],
      })) as BookEntity[],
    }
  }),
  getAuthors: t.procedure.query(async () => {
    const authors = await prisma.author.findMany()
    return {
      items: authors,
    }
  }),
})

export type AppRouter = typeof router
