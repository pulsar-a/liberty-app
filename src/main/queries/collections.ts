import CollectionEntity from '../entities/collection.entity'
import { db } from '../services/db'
import { booksQuery } from './books'

export const collectionsQuery = {
  async getAll(): Promise<CollectionEntity[]> {
    return db.manager.find(CollectionEntity, {
      order: { name: 'ASC' },
    })
  },

  async getById(id: number): Promise<CollectionEntity | null> {
    return db.manager.findOne(CollectionEntity, {
      where: { id },
      relations: {
        books: {
          authors: true,
        },
      },
    })
  },

  async create(name: string): Promise<CollectionEntity> {
    const repository = db.getRepository(CollectionEntity)
    const collection = repository.create({ name, booksCount: 0 })
    return await repository.save(collection)
  },

  async update(id: number, name: string): Promise<CollectionEntity | null> {
    const collection = await collectionsQuery.getById(id)
    if (!collection) return null

    collection.name = name
    return await db.manager.save(collection)
  },

  async delete(id: number): Promise<boolean> {
    const collection = await collectionsQuery.getById(id)
    if (!collection) return false

    // Clear the books relation first
    collection.books = []
    await db.manager.save(collection)

    await db.manager.remove(collection)
    return true
  },

  async getCollectionsForBook(bookId: number): Promise<CollectionEntity[]> {
    const book = await booksQuery.book({ id: bookId })
    if (!book) return []

    // Get book with collections relation
    const bookWithCollections = await db.manager.findOne(
      (await import('../entities/book.entity')).default,
      {
        where: { id: bookId },
        relations: { collections: true },
      }
    )

    return bookWithCollections?.collections || []
  },

  async addBookToCollection(
    bookId: number,
    collectionId: number
  ): Promise<{ success: boolean; collection?: CollectionEntity }> {
    const collection = await collectionsQuery.getById(collectionId)
    if (!collection) return { success: false }

    const book = await booksQuery.book({ id: bookId })
    if (!book) return { success: false }

    // Check if book is already in collection
    const isAlreadyInCollection = collection.books.some((b) => b.id === bookId)
    if (isAlreadyInCollection) return { success: true, collection }

    // Add book to collection
    collection.books.push(book)
    collection.booksCount = collection.books.length
    await db.manager.save(collection)

    return { success: true, collection }
  },

  async removeBookFromCollection(
    bookId: number,
    collectionId: number
  ): Promise<{ success: boolean; collection?: CollectionEntity }> {
    const collection = await collectionsQuery.getById(collectionId)
    if (!collection) return { success: false }

    // Remove book from collection
    collection.books = collection.books.filter((b) => b.id !== bookId)
    collection.booksCount = collection.books.length
    await db.manager.save(collection)

    return { success: true, collection }
  },

  async getAllWithBookMembership(
    bookId: number
  ): Promise<{ collection: CollectionEntity; hasBook: boolean }[]> {
    const allCollections = await collectionsQuery.getAll()
    const bookCollections = await collectionsQuery.getCollectionsForBook(bookId)
    const bookCollectionIds = new Set(bookCollections.map((c) => c.id))

    return allCollections.map((collection) => ({
      collection,
      hasBook: bookCollectionIds.has(collection.id),
    }))
  },
}

