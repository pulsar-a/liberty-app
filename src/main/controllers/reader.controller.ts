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
  /** If true, skip server-side pagination - client will handle it */
  clientSidePagination: z.boolean().optional(),
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
// Now stores raw content separately from paginated content
const rawContentCache = new Map<number, BookContent>()
const paginatedContentCache = new Map<number, { content: BookContent; paginatedContent: PaginatedContent }>()

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
 * Get book content with optional pagination
 * Uses a worker thread to parse the book content without blocking the main process.
 * 
 * When clientSidePagination is true, returns raw content without pagination.
 * The client will handle pagination using the ContentFitter service.
 */
export const getBookContentController = async ({
  input,
}: {
  input: z.infer<typeof getBookContentInputSchema>
}): Promise<GetBookContentResponse | null> => {
  const { bookId, paginationConfig, clientSidePagination } = input

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

  // Client-side pagination path: return raw content only
  if (clientSidePagination) {
    // Check raw content cache first
    const cachedRaw = rawContentCache.get(bookId)
    if (cachedRaw) {
      logger.debug(`Using cached raw content for book ${bookId}`)
      sendProgressToRenderer(bookId, 100, 'reader_loading_complete')
      
      return {
        content: cachedRaw,
        paginatedContent: null,
        lastReadPage: book.readingProgress || 0,
        clientSidePagination: true,
      }
    }

    // Send initial progress
    sendProgressToRenderer(bookId, 0, 'reader_loading_opening')

    try {
      const onProgress = (percent: number, stage: string) => {
        // Cap progress at 90% since client will do pagination
        sendProgressToRenderer(bookId, Math.min(percent, 90), stage)
      }

      // Parse without pagination (still uses worker for content extraction)
      let result: { content: BookContent; paginatedContent: PaginatedContent }

      try {
        result = await parseBookInWorker(book.fileName, bookId, config, onProgress)
      } catch (workerError) {
        logger.warn(`Worker parsing failed, falling back to sync: ${workerError}`)
        result = await parseBookSync(book.fileName, bookId, config, onProgress)
      }

      // Cache the raw content
      rawContentCache.set(bookId, result.content)

      sendProgressToRenderer(bookId, 90, 'reader_loading_complete')

      return {
        content: result.content,
        paginatedContent: null,
        lastReadPage: book.readingProgress || 0,
        clientSidePagination: true,
      }
    } catch (error) {
      logger.error(`Failed to parse book content: ${error}`)
      sendProgressToRenderer(bookId, -1, 'reader_loading_error')
      return null
    }
  }

  // Legacy server-side pagination path (for backward compatibility)
  const cacheKey = bookId
  const cached = paginatedContentCache.get(cacheKey)
  
  if (cached) {
    logger.debug(`Using cached paginated content for book ${bookId}`)
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

    // Cache the results
    paginatedContentCache.set(cacheKey, result)
    rawContentCache.set(bookId, result.content)

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
  rawContentCache.delete(bookId)
  paginatedContentCache.delete(bookId)
}

/**
 * Clear all content cache
 */
export const clearAllContentCache = (): void => {
  rawContentCache.clear()
  paginatedContentCache.clear()
}

/**
 * Check if a book is in the content cache
 */
export const isBookCached = (bookId: number): boolean => {
  return rawContentCache.has(bookId) || paginatedContentCache.has(bookId)
}

