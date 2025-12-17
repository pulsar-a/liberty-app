/**
 * Book Parser Worker Service
 * Manages the worker thread for parsing book content.
 * Provides a promise-based API with progress callbacks.
 */

import { Worker } from 'worker_threads'
import path from 'path'
import { app } from 'electron'
import {
  BookContent,
  PaginatedContent,
  PaginationConfig,
} from '../../../types/reader.types'
import { logger } from '../utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface ParseBookResult {
  content: BookContent
  paginatedContent: PaginatedContent
}

export type ProgressCallback = (percent: number, stage: string) => void

interface WorkerProgressMessage {
  type: 'progress'
  percent: number
  stage: string
}

interface WorkerResultMessage {
  type: 'result'
  content: BookContent
  paginatedContent: PaginatedContent
}

interface WorkerErrorMessage {
  type: 'error'
  message: string
}

type WorkerMessage = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage

// ============================================================================
// Worker Path Resolution
// ============================================================================

/**
 * Get the path to the worker script.
 * In development, the worker is in the src directory.
 * In production, the worker is bundled with the main process.
 */
function getWorkerPath(): string {
  const isDev = !app.isPackaged

  if (isDev) {
    // In development, use the compiled worker from out/main
    return path.join(__dirname, 'workers', 'epub-parser.worker.js')
  } else {
    // In production, the worker is in the same directory as the main process
    return path.join(__dirname, 'workers', 'epub-parser.worker.js')
  }
}

// ============================================================================
// Parse Book in Worker
// ============================================================================

/**
 * Parse a book file in a worker thread.
 * This keeps the main thread responsive during heavy parsing operations.
 * 
 * @param filePath - Path to the book file
 * @param bookId - Database ID of the book
 * @param paginationConfig - Pagination configuration
 * @param onProgress - Callback for progress updates
 * @returns Promise resolving to parsed content
 */
export function parseBookInWorker(
  filePath: string,
  bookId: number,
  paginationConfig: PaginationConfig,
  onProgress?: ProgressCallback
): Promise<ParseBookResult> {
  return new Promise((resolve, reject) => {
    const workerPath = getWorkerPath()
    
    logger.debug(`Starting book parser worker: ${workerPath}`)
    logger.debug(`Parsing book: ${filePath} (ID: ${bookId})`)

    let worker: Worker

    try {
      worker = new Worker(workerPath, {
        workerData: {
          filePath,
          bookId,
          paginationConfig,
        },
      })
    } catch (error) {
      logger.error('Failed to create worker:', error)
      reject(new Error(`Failed to create parser worker: ${error}`))
      return
    }

    // Handle messages from the worker
    worker.on('message', (message: WorkerMessage) => {
      switch (message.type) {
        case 'progress':
          logger.debug(`Parser progress: ${message.percent}% - ${message.stage}`)
          onProgress?.(message.percent, message.stage)
          break

        case 'result':
          logger.debug('Parser completed successfully')
          resolve({
            content: message.content,
            paginatedContent: message.paginatedContent,
          })
          worker.terminate()
          break

        case 'error':
          logger.error('Parser worker error:', message.message)
          reject(new Error(message.message))
          worker.terminate()
          break
      }
    })

    // Handle worker errors
    worker.on('error', (error) => {
      logger.error('Worker thread error:', error)
      reject(new Error(`Worker error: ${error.message}`))
    })

    // Handle worker exit
    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`Worker exited with code ${code}`)
        reject(new Error(`Worker exited with code ${code}`))
      }
    })
  })
}

/**
 * Parse a book file synchronously (fallback for when workers aren't available).
 * This should only be used as a fallback since it will block the main thread.
 */
export async function parseBookSync(
  filePath: string,
  bookId: number,
  paginationConfig: PaginationConfig,
  onProgress?: ProgressCallback
): Promise<ParseBookResult> {
  // Import the content parser dynamically to avoid circular dependencies
  const { getContentParser } = await import('../parsers/content/ContentParserRegistry')
  const { PaginationService } = await import('./pagination')

  const fileExtension = path.extname(filePath).slice(1).toLowerCase()
  
  onProgress?.(5, 'reader_loading_opening')

  const parser = getContentParser(fileExtension, {
    filePath,
    bookId,
  })

  if (!parser) {
    throw new Error(`No content parser available for format: ${fileExtension}`)
  }

  onProgress?.(10, 'reader_loading_chapters')

  const content = await parser.extractContent()

  onProgress?.(80, 'reader_loading_paginating')

  const paginationService = new PaginationService({
    mode: paginationConfig.mode,
    charsPerPage: paginationConfig.charsPerPage,
  })

  const paginatedContent = paginationService.paginate(content)

  onProgress?.(100, 'reader_loading_paginating')

  return {
    content,
    paginatedContent,
  }
}

