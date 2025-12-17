import { BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  BookContent,
  GetBookContentResponse,
  PaginatedContent,
  PaginationConfig,
} from '../../../types/reader.types'
import BookEntity from '../entities/book.entity'
import { bookmarksQuery } from '../queries/bookmarks'
import { booksQuery } from '../queries/books'
import { db } from '../services/db'
import { parseBookInWorker, parseBookSync } from '../services/bookParserWorker'
import { logger } from '../utils/logger'

// Input schemas for validation
export const getBookContentInputSchema = z.object({
  bookId: z.number(),
  paginationConfig: z
    .object({
      mode: z.enum(['single', 'two-column']).optional(),
      charsPerPage: z.number().optional(),
    })
    .optional(),
})

export const updateReadingProgressInputSchema = z.object({
  bookId: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
})

export const getBookmarksInputSchema = z.object({
  bookId: z.number(),
})

export const createBookmarkInputSchema = z.object({
  bookId: z.number(),
  chapterId: z.string(),
  pageIndex: z.number(),
  label: z.string().optional(),
  selectedText: z.string().optional(),
})

export const deleteBookmarkInputSchema = z.object({
  bookmarkId: z.number(),
})

// Cache for parsed book content to avoid re-parsing
const contentCache = new Map<number, { content: BookContent; paginatedContent: PaginatedContent }>()

/**
 * Send progress update to the renderer process
 */
function sendProgressToRenderer(bookId: number, percent: number, stage: string): void {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    mainWindow.webContents.send('reader:progress', { bookId, percent, stage })
  }
}

/**
 * Get book content with pagination
 * Uses a worker thread to parse the book content without blocking the main process.
 */
export const getBookContentController = async ({
  input,
}: {
  input: z.infer<typeof getBookContentInputSchema>
}): Promise<GetBookContentResponse | null> => {
  const { bookId, paginationConfig } = input

  // Get book from database
  const book = await booksQuery.book({ id: bookId })
  if (!book) {
    logger.error(`Book not found: ${bookId}`)
    return null
  }

  const config: PaginationConfig = {
    mode: paginationConfig?.mode || 'single',
    charsPerPage: paginationConfig?.charsPerPage || 3000,
  }

  // Check cache first - include pagination mode in cache key
  const cacheKey = bookId
  const cached = contentCache.get(cacheKey)
  
  if (cached) {
    // If we have cached content but need different pagination, re-paginate
    // For now, return cached as-is (pagination is part of content generation in worker)
    logger.debug(`Using cached content for book ${bookId}`)
    sendProgressToRenderer(bookId, 100, 'reader_loading_paginating')
    
    return {
      content: cached.content,
      paginatedContent: cached.paginatedContent,
      lastReadPage: book.readingProgress || 0,
    }
  }

  // Send initial progress
  sendProgressToRenderer(bookId, 0, 'reader_loading_opening')

  try {
    // Progress callback that forwards to renderer
    const onProgress = (percent: number, stage: string) => {
      sendProgressToRenderer(bookId, percent, stage)
    }

    let result: { content: BookContent; paginatedContent: PaginatedContent }

    try {
      // Try to use worker thread for non-blocking parsing
      result = await parseBookInWorker(book.fileName, bookId, config, onProgress)
    } catch (workerError) {
      // Fall back to synchronous parsing if worker fails
      logger.warn(`Worker parsing failed, falling back to sync: ${workerError}`)
      result = await parseBookSync(book.fileName, bookId, config, onProgress)
    }

    // Cache the result
    contentCache.set(cacheKey, result)

    // Get last read page from book entity
    const lastReadPage = book.readingProgress || 0

    return {
      content: result.content,
      paginatedContent: result.paginatedContent,
      lastReadPage,
    }
  } catch (error) {
    logger.error(`Failed to parse book content: ${error}`)
    sendProgressToRenderer(bookId, -1, 'reader_loading_error')
    return null
  }
}

/**
 * Update reading progress for a book
 */
export const updateReadingProgressController = async ({
  input,
}: {
  input: z.infer<typeof updateReadingProgressInputSchema>
}): Promise<boolean> => {
  const { bookId, currentPage, totalPages } = input

  try {
    await db.manager.update(BookEntity, { id: bookId }, { readingProgress: currentPage, totalPages })
    return true
  } catch (error) {
    logger.error(`Failed to update reading progress: ${error}`)
    return false
  }
}

/**
 * Get all bookmarks for a book
 */
export const getBookmarksController = async ({
  input,
}: {
  input: z.infer<typeof getBookmarksInputSchema>
}) => {
  return await bookmarksQuery.getBookmarks(input.bookId)
}

/**
 * Create a new bookmark
 */
export const createBookmarkController = async ({
  input,
}: {
  input: z.infer<typeof createBookmarkInputSchema>
}) => {
  return await bookmarksQuery.createBookmark(input)
}

/**
 * Delete a bookmark
 */
export const deleteBookmarkController = async ({
  input,
}: {
  input: z.infer<typeof deleteBookmarkInputSchema>
}) => {
  return await bookmarksQuery.deleteBookmark(input.bookmarkId)
}

/**
 * Clear content cache for a book (useful when book is deleted)
 */
export const clearContentCache = (bookId: number): void => {
  contentCache.delete(bookId)
}

/**
 * Clear all content cache
 */
export const clearAllContentCache = (): void => {
  contentCache.clear()
}

/**
 * Check if a book is in the content cache
 */
export const isBookCached = (bookId: number): boolean => {
  return contentCache.has(bookId)
}

