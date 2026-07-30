import { BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  BookContent,
  GetBookContentResponse,
  PaginatedContent,
  PaginationConfig,
  ReaderPosition,
} from '../../../types/reader.types'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import { bookmarksQuery } from '../queries/bookmarks'
import { booksQuery } from '../queries/books'
import { db } from '../services/db'
import { parseBookInWorker, parseBookSync } from '../services/bookParserWorker'
import { logger } from '../utils/logger'

// Input schemas for validation
export const getBookContentInputSchema = z.object({
  bookId: z.number(),
  bookFileId: z.number().int().positive().optional(),
  paginationConfig: z
    .object({
      mode: z.enum(['single', 'two-column']).optional(),
      charsPerPage: z.number().optional(),
    })
    .optional(),
  /** If true, skip server-side pagination - client will handle it */
  clientSidePagination: z.boolean().optional(),
})

const readerEngineSchema = z.enum(['html', 'wasm', 'foliate'])
const readerPositionSchema = z.object({
  engine: readerEngineSchema,
  progression: z.number().min(0).max(1),
  locator: z.union([
    z.object({ kind: z.literal('cfi'), value: z.string().min(1) }),
    z.object({
      kind: z.literal('page'),
      index: z.number().int().min(0),
      total: z.number().int().positive(),
    }),
  ]),
})

export const updateReadingPositionInputSchema = z.object({
  bookId: z.number(),
  bookFileId: z.number().int().positive(),
  position: readerPositionSchema,
})

export const getBookmarksInputSchema = z.object({
  bookId: z.number(),
})

export const createBookmarkInputSchema = z.object({
  bookId: z.number(),
  bookFileId: z.number().int().positive(),
  position: readerPositionSchema,
  chapterId: z.string().optional(),
  pageIndex: z.number().int().min(0).optional(),
  label: z.string().optional(),
  selectedText: z.string().optional(),
})

export const deleteBookmarkInputSchema = z.object({
  bookmarkId: z.number(),
})

export const updateBookmarkPositionInputSchema = z.object({
  bookmarkId: z.number(),
  position: readerPositionSchema,
})

// Cache for parsed book content to avoid re-parsing
// Now stores raw content separately from paginated content
const rawContentCache = new Map<number, BookContent>()
const paginatedContentCache = new Map<
  number,
  { content: BookContent; paginatedContent: PaginatedContent }
>()

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
  const { bookId, bookFileId, paginationConfig, clientSidePagination } = input

  // Get book from database
  const book = await booksQuery.book({ id: bookId })
  const selectedFile = await booksQuery.resolveReadableFile(bookId, bookFileId)
  if (!book || !selectedFile) {
    logger.error(`Book or readable file not found: ${bookId}/${bookFileId || 'preferred'}`)
    return null
  }
  selectedFile.lastOpenedAt = new Date()
  await db.manager.save(selectedFile)
  if (book.preferredBookFileId !== selectedFile.id) {
    book.preferredBookFileId = selectedFile.id
    await db.manager.save(book)
  }

  const lastReadPage =
    selectedFile.readingPosition?.locator.kind === 'page'
      ? selectedFile.readingPosition.locator.index
      : 0
  const lastReadTotalPages =
    selectedFile.readingPosition?.locator.kind === 'page'
      ? selectedFile.readingPosition.locator.total
      : 0

  const config: PaginationConfig = {
    mode: paginationConfig?.mode || 'single',
    charsPerPage: paginationConfig?.charsPerPage || 3000,
  }

  // Client-side pagination path: return raw content only
  if (clientSidePagination) {
    // Check raw content cache first
    const cachedRaw = rawContentCache.get(selectedFile.id)
    if (cachedRaw) {
      logger.debug(`Using cached raw content for book ${bookId}`)
      sendProgressToRenderer(bookId, 100, 'reader_loading_complete')

      return {
        bookFileId: selectedFile.id,
        content: cachedRaw,
        paginatedContent: null,
        lastReadPage,
        lastReadTotalPages,
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
        result = await parseBookInWorker(selectedFile.storedPath, bookId, config, onProgress)
      } catch (workerError) {
        logger.warn(`Worker parsing failed, falling back to sync: ${workerError}`)
        result = await parseBookSync(selectedFile.storedPath, bookId, config, onProgress)
      }

      // Cache the raw content
      rawContentCache.set(selectedFile.id, result.content)

      sendProgressToRenderer(bookId, 90, 'reader_loading_complete')

      return {
        bookFileId: selectedFile.id,
        content: result.content,
        paginatedContent: null,
        lastReadPage,
        lastReadTotalPages,
        clientSidePagination: true,
      }
    } catch (error) {
      logger.error(`Failed to parse book content: ${error}`)
      sendProgressToRenderer(bookId, -1, 'reader_loading_error')
      return null
    }
  }

  // Legacy server-side pagination path (for backward compatibility)
  const cacheKey = selectedFile.id
  const cached = paginatedContentCache.get(cacheKey)

  if (cached) {
    logger.debug(`Using cached paginated content for book ${bookId}`)
    sendProgressToRenderer(bookId, 100, 'reader_loading_paginating')

    return {
      bookFileId: selectedFile.id,
      content: cached.content,
      paginatedContent: cached.paginatedContent,
      lastReadPage,
      lastReadTotalPages,
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
      result = await parseBookInWorker(selectedFile.storedPath, bookId, config, onProgress)
    } catch (workerError) {
      // Fall back to synchronous parsing if worker fails
      logger.warn(`Worker parsing failed, falling back to sync: ${workerError}`)
      result = await parseBookSync(selectedFile.storedPath, bookId, config, onProgress)
    }

    // Cache the results
    paginatedContentCache.set(cacheKey, result)
    rawContentCache.set(selectedFile.id, result.content)

    return {
      bookFileId: selectedFile.id,
      content: result.content,
      paginatedContent: result.paginatedContent,
      lastReadPage,
      lastReadTotalPages,
    }
  } catch (error) {
    logger.error(`Failed to parse book content: ${error}`)
    sendProgressToRenderer(bookId, -1, 'reader_loading_error')
    return null
  }
}

/**
 * Update the engine-neutral reading position for a book.
 */
export const updateReadingPositionController = async ({
  input,
}: {
  input: z.infer<typeof updateReadingPositionInputSchema>
}): Promise<boolean> => {
  const { bookId, bookFileId, position } = input

  try {
    const file = await db.manager.findOneBy(BookFileEntity, { id: bookFileId, bookId })
    if (!file || file.removedAt) return false
    file.readingPosition = position as ReaderPosition
    file.lastOpenedAt = new Date()
    await db.manager.save(file)
    await db.manager.update(BookEntity, { id: bookId }, { readingProgression: position.progression })
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

export const updateBookmarkPositionController = async ({
  input,
}: {
  input: z.infer<typeof updateBookmarkPositionInputSchema>
}) => {
  return await bookmarksQuery.updateBookmarkPosition(
    input.bookmarkId,
    input.position as ReaderPosition
  )
}

/**
 * Clear content cache for a book (useful when book is deleted)
 */
export const clearContentCache = (bookFileId: number): void => {
  rawContentCache.delete(bookFileId)
  paginatedContentCache.delete(bookFileId)
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
export const isBookCached = (bookFileId: number): boolean => {
  return rawContentCache.has(bookFileId) || paginatedContentCache.has(bookFileId)
}
