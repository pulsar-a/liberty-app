import BookmarkEntity from '../entities/bookmark.entity'
import { db } from '../services/db'

export const bookmarksQuery = {
  /**
   * Get all bookmarks for a book
   */
  async getBookmarks(bookId: number): Promise<BookmarkEntity[]> {
    return db.manager.find(BookmarkEntity, {
      where: { bookId },
      order: { pageIndex: 'ASC', createdAt: 'DESC' },
    })
  },

  /**
   * Get a single bookmark by ID
   */
  async getBookmark(id: number): Promise<BookmarkEntity | null> {
    return db.manager.findOne(BookmarkEntity, {
      where: { id },
    })
  },

  /**
   * Create a new bookmark
   */
  async createBookmark(data: {
    bookId: number
    chapterId: string
    pageIndex: number
    label?: string
    selectedText?: string
  }): Promise<BookmarkEntity> {
    const repository = db.getRepository(BookmarkEntity)
    const bookmark = repository.create({
      bookId: data.bookId,
      chapterId: data.chapterId,
      pageIndex: data.pageIndex,
      label: data.label || null,
      selectedText: data.selectedText || null,
    })
    return await repository.save(bookmark)
  },

  /**
   * Update a bookmark
   */
  async updateBookmark(
    id: number,
    data: Partial<{
      label: string
      selectedText: string
    }>
  ): Promise<BookmarkEntity | null> {
    const bookmark = await bookmarksQuery.getBookmark(id)
    if (!bookmark) {
      return null
    }

    if (data.label !== undefined) {
      bookmark.label = data.label
    }
    if (data.selectedText !== undefined) {
      bookmark.selectedText = data.selectedText
    }

    return await db.manager.save(bookmark)
  },

  /**
   * Delete a bookmark
   */
  async deleteBookmark(id: number): Promise<boolean> {
    const result = await db.manager.delete(BookmarkEntity, { id })
    return (result.affected || 0) > 0
  },

  /**
   * Delete all bookmarks for a book
   */
  async deleteAllBookmarks(bookId: number): Promise<number> {
    const result = await db.manager.delete(BookmarkEntity, { bookId })
    return result.affected || 0
  },

  /**
   * Check if a bookmark exists at a specific page
   */
  async bookmarkExists(bookId: number, pageIndex: number): Promise<boolean> {
    const count = await db.manager.count(BookmarkEntity, {
      where: { bookId, pageIndex },
    })
    return count > 0
  },
}

