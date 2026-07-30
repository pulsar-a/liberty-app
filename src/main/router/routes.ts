import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'
import { BOOK_FORMATS } from '../../../types/reader-engines'
import { addBooksController } from '../controllers/addBooks.controller'
import { changeColorSchemeController } from '../controllers/changeColorScheme.controller'
import {
  dismissBookMatchController,
  dismissBookMatchInputSchema,
  mergeBooksController,
  mergeBooksInputSchema,
  removeBookFileController,
  removeBookFileInputSchema,
  setPreferredBookFileController,
  setPreferredBookFileInputSchema,
} from '../controllers/bookFiles.controller'
import { getAuthorsController } from '../controllers/getAuthors.controller'
import { getBookByIdController } from '../controllers/getBookById.controller'
import { getBooksController } from '../controllers/getBooks.controller'
import { getPlatformDataController } from '../controllers/getPlatformData.controller'
import {
  createBookmarkController,
  createBookmarkInputSchema,
  deleteBookmarkController,
  deleteBookmarkInputSchema,
  getBookContentController,
  getBookContentInputSchema,
  getBookmarksController,
  getBookmarksInputSchema,
  updateReadingPositionController,
  updateReadingPositionInputSchema,
  updateBookmarkPositionController,
  updateBookmarkPositionInputSchema,
} from '../controllers/reader.controller'
import { removeBookByIdController } from '../controllers/removeBookByIdController'
import { booksQuery } from '../queries/books'
import { collectionsQuery } from '../queries/collections'
import { searchQuery } from '../queries/search'
import { toBookSummary } from '../services/bookDtos'

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
  removeBookFile: trpc.procedure
    .input(removeBookFileInputSchema)
    .mutation(removeBookFileController),
  setPreferredBookFile: trpc.procedure
    .input(setPreferredBookFileInputSchema)
    .mutation(setPreferredBookFileController),
  mergeBooks: trpc.procedure.input(mergeBooksInputSchema).mutation(mergeBooksController),
  dismissBookMatch: trpc.procedure
    .input(dismissBookMatchInputSchema)
    .mutation(dismissBookMatchController),
  getAuthors: trpc.procedure.query(getAuthorsController),

  // Favorites routes
  toggleFavorite: trpc.procedure
    .input(z.object({ bookId: z.number() }))
    .mutation(async ({ input }) => {
      return await booksQuery.toggleFavorite(input.bookId)
    }),
  getFavoriteBooks: trpc.procedure.query(async () => {
    const books = await booksQuery.getFavoriteBooks()
    return Promise.all(books.map(toBookSummary))
  }),
  getFavoriteBooksCount: trpc.procedure.query(async () => {
    return await booksQuery.getFavoriteBooksCount()
  }),

  // Reader routes
  getBookContent: trpc.procedure.input(getBookContentInputSchema).query(getBookContentController),
  updateReadingPosition: trpc.procedure
    .input(updateReadingPositionInputSchema)
    .mutation(updateReadingPositionController),
  getBookmarks: trpc.procedure.input(getBookmarksInputSchema).query(getBookmarksController),
  createBookmark: trpc.procedure
    .input(createBookmarkInputSchema)
    .mutation(createBookmarkController),
  deleteBookmark: trpc.procedure
    .input(deleteBookmarkInputSchema)
    .mutation(deleteBookmarkController),
  updateBookmarkPosition: trpc.procedure
    .input(updateBookmarkPositionInputSchema)
    .mutation(updateBookmarkPositionController),

  // Collection routes
  getCollections: trpc.procedure.query(async () => {
    return await collectionsQuery.getAll()
  }),
  getCollectionById: trpc.procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const collection = await collectionsQuery.getById(input.id)
    if (!collection) return null
    return {
      id: collection.id,
      name: collection.name,
      booksCount: collection.booksCount,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      books: await Promise.all(collection.books.map(toBookSummary)),
    }
  }),
  createCollection: trpc.procedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await collectionsQuery.create(input.name)
    }),
  updateCollection: trpc.procedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await collectionsQuery.update(input.id, input.name)
    }),
  deleteCollection: trpc.procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await collectionsQuery.delete(input.id)
    }),
  getBookCollections: trpc.procedure
    .input(z.object({ bookId: z.number() }))
    .query(async ({ input }) => {
      return await collectionsQuery.getCollectionsForBook(input.bookId)
    }),
  getCollectionsWithBookMembership: trpc.procedure
    .input(z.object({ bookId: z.number() }))
    .query(async ({ input }) => {
      return await collectionsQuery.getAllWithBookMembership(input.bookId)
    }),
  addBookToCollection: trpc.procedure
    .input(z.object({ bookId: z.number(), collectionId: z.number() }))
    .mutation(async ({ input }) => {
      return await collectionsQuery.addBookToCollection(input.bookId, input.collectionId)
    }),
  removeBookFromCollection: trpc.procedure
    .input(z.object({ bookId: z.number(), collectionId: z.number() }))
    .mutation(async ({ input }) => {
      return await collectionsQuery.removeBookFromCollection(input.bookId, input.collectionId)
    }),

  // Search routes
  search: trpc.procedure
    .input(
      z.object({
        query: z.string(),
        filters: z
          .array(z.enum(['books', 'collections', 'book_ids', 'file_names', 'internal_file_names']))
          .optional(),
        formats: z.array(z.enum(BOOK_FORMATS)).optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await searchQuery.search(input)
    }),
  quickSearch: trpc.procedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    return await searchQuery.quickSearch(input.query)
  }),
})

export type AppRouter = typeof router
