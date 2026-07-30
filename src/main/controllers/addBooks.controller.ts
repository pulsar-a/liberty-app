import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { app, BrowserWindow, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import type { ParsedBook } from '../../../types/parsed.types'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookIdEntity from '../entities/bookId.entity'
import BookMatchEntity from '../entities/bookMatch.entity'
import { getParser, getSupportedFormats } from '../parsers/ParserRegistry'
import { booksQuery } from '../queries/books'
import { db } from '../services/db'
import { normalizedIdentifiers } from '../services/bookIdentity'
import { matchIncomingBook, MatchCandidate } from '../services/bookMatching'
import { logger } from '../utils/logger'
import { getReadableBookFormats } from '../../../types/reader-engines'

const readableFormats = new Set<string>(getReadableBookFormats())

export type AddBookOutcome = {
  originalFileName: string
  status: 'new_book' | 'attached_file' | 'suggestion_created' | 'error'
  bookId?: number
  bookFileId?: number
  error?: string
}

const hashFile = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })

const mimeForFormat = (format: string): string | null =>
  (
    {
      epub: 'application/epub+zip',
      pdf: 'application/pdf',
      txt: 'text/plain',
      mobi: 'application/x-mobipocket-ebook',
    } as Record<string, string>
  )[format] || null

async function authorsForNewLogicalBook(names: string[]): Promise<AuthorEntity[]> {
  const repository = db.getRepository(AuthorEntity)
  return Promise.all(
    [...new Set(names.map((name) => name.trim()).filter(Boolean))].map(async (name) => {
      let author = await repository.findOneBy({ name })
      if (!author) {
        author = await repository.save(repository.create({ name, booksCount: 0 }))
      }
      await repository.increment({ id: author.id }, 'booksCount', 1)
      author.booksCount += 1
      return author
    })
  )
}

async function createSuggestions(bookId: number, candidates: MatchCandidate[]): Promise<void> {
  const repository = db.getRepository(BookMatchEntity)
  for (const candidate of candidates) {
    if (candidate.bookId === bookId) continue
    const [left, right] = [bookId, candidate.bookId].sort((a, b) => a - b)
    const existing = await repository.findOneBy({ bookId: left, candidateBookId: right })
    if (existing) {
      if (candidate.confidence > existing.confidence) {
        existing.reason = candidate.reason
        existing.confidence = candidate.confidence
        existing.evidence = candidate.evidence
        existing.dismissedAt = null
        await repository.save(existing)
      }
      continue
    }
    await repository.save(
      repository.create({
        bookId: left,
        candidateBookId: right,
        reason: candidate.reason,
        confidence: candidate.confidence,
        evidence: candidate.evidence,
        dismissedAt: null,
      })
    )
  }
}

export const addBooksController = async (): Promise<AddBookOutcome[]> => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Supported Books', extensions: getSupportedFormats() },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (canceled) return []

  const mainWindow = BrowserWindow.getAllWindows()[0] || null
  const prepared = filePaths.map((originalPath) => {
    const encodedName = uuidv4()
    const originalFileName = path.basename(originalPath)
    const fileFormat = path.extname(originalPath).slice(1).toLowerCase()
    const encodedFilename = `${encodedName}.${fileFormat}`
    const destinationDir = path.join(app.getPath('userData'), 'books')
    const imageAbsoluteDir = path.join(destinationDir, 'images')
    return {
      filePath: originalPath,
      originalPath,
      originalFilename: originalFileName,
      originalFileName,
      fileExtension: fileFormat,
      fileFormat,
      encodedName,
      encodedFilename,
      destinationDir,
      destinationFile: path.join(destinationDir, encodedFilename),
      fileName: path.join('books', encodedFilename),
      subfolder: destinationDir,
      imageDir: path.join('books', 'images'),
      imageAbsoluteDir,
    }
  })

  mainWindow?.webContents.send(
    'loader:add-items',
    prepared.map(({ encodedFilename, originalFileName }) => ({
      id: encodedFilename,
      label: originalFileName,
      status: 'loading',
    }))
  )

  const outcomes: AddBookOutcome[] = []
  for (const file of prepared) {
    let coverPath: string | null = null
    let createdBookFileId: number | null = null
    let createdLogicalBookId: number | null = null
    try {
      await fs.mkdir(file.destinationDir, { recursive: true })
      await fs.mkdir(file.imageAbsoluteDir, { recursive: true })
      await fs.copyFile(file.originalPath, file.destinationFile)

      const [sourceStats, copiedStats, sha256] = await Promise.all([
        fs.stat(file.originalPath),
        fs.stat(file.destinationFile),
        hashFile(file.destinationFile),
      ])
      const ParserClass = getParser(file.fileFormat)
      if (!ParserClass) throw new Error(`File type not supported: ${file.fileFormat}`)
      const parsed: ParsedBook | null = await new ParserClass(file).parse()
      if (!parsed) throw new Error('Book metadata could not be parsed')

      if (parsed.cover?.imageBuffer) {
        const extension = parsed.cover.archivePath.split('.').pop() || 'jpg'
        coverPath = path.join(file.imageAbsoluteDir, `${file.encodedName}.${extension}`)
        await fs.writeFile(coverPath, parsed.cover.imageBuffer)
      }

      const match = await matchIncomingBook(sha256, parsed.metadata)
      let book = match.attachToBookId
        ? await db.getRepository(BookEntity).findOne({
            where: { id: match.attachToBookId },
            relations: { authors: true },
          })
        : null
      let createdLogicalBook = false

      if (!book) {
        const authors = await authorsForNewLogicalBook(parsed.metadata.authors || [])
        book = await db.getRepository(BookEntity).save(
          db.getRepository(BookEntity).create({
            name: parsed.metadata.title || file.originalFileName,
            lang: parsed.metadata.language || null,
            publisher: parsed.metadata.publisher || null,
            description: parsed.metadata.description || null,
            readingProgression: null,
            score: null,
            isFavorite: false,
            preferredBookFileId: null,
            coverBookFileId: null,
            authors,
          })
        )
        createdLogicalBook = true
        createdLogicalBookId = book.id
      } else {
        let changed = false
        if (!book.lang && parsed.metadata.language) {
          book.lang = parsed.metadata.language
          changed = true
        }
        if (!book.publisher && parsed.metadata.publisher) {
          book.publisher = parsed.metadata.publisher
          changed = true
        }
        if (!book.description && parsed.metadata.description) {
          book.description = parsed.metadata.description
          changed = true
        }
        if (!book.authors.length && parsed.metadata.authors.length) {
          book.authors = await authorsForNewLogicalBook(parsed.metadata.authors)
          changed = true
        }
        if (changed) await db.getRepository(BookEntity).save(book)
      }

      const bookFile = await db.getRepository(BookFileEntity).save(
        db.getRepository(BookFileEntity).create({
          bookId: book.id,
          storedPath: file.destinationFile,
          originalPath: file.originalPath,
          originalFileName: file.originalFileName,
          fileFormat: file.fileFormat,
          mimeType: mimeForFormat(file.fileFormat),
          fileSize: copiedStats.size,
          sha256,
          sourceType: 'import',
          sourceLabel: null,
          sourceModifiedAt: sourceStats.mtime,
          rawMetadata: parsed.metadata,
          coverPath,
          readingPosition: null,
          lastOpenedAt: null,
          removedAt: null,
          derivedFromBookFileId: null,
        })
      )
      createdBookFileId = bookFile.id

      const identifierRepository = db.getRepository(BookIdEntity)
      await identifierRepository.save(
        normalizedIdentifiers(parsed.metadata.identifiers || []).map((identifier) =>
          identifierRepository.create({
            bookFileId: bookFile.id,
            idType: identifier.type,
            idVal: identifier.value,
            normalizedVal: identifier.normalizedValue,
          })
        )
      )

      if (!book.preferredBookFileId && readableFormats.has(file.fileFormat)) {
        book.preferredBookFileId = bookFile.id
      }
      if (!book.coverBookFileId && coverPath) book.coverBookFileId = bookFile.id
      await db.getRepository(BookEntity).save(book)

      if (createdLogicalBook && match.candidates.length) {
        await createSuggestions(book.id, match.candidates)
      }

      const status: AddBookOutcome['status'] = createdLogicalBook
        ? match.candidates.length
          ? 'suggestion_created'
          : 'new_book'
        : 'attached_file'
      outcomes.push({
        originalFileName: file.originalFileName,
        status,
        bookId: book.id,
        bookFileId: bookFile.id,
      })
      mainWindow?.webContents.send('loader:update-item', {
        id: file.encodedFilename,
        label: 'loadingStatusesToast_bookAdded_label',
        labelParams: { filename: file.originalFileName },
        status: 'success',
      })
    } catch (error) {
      logger.error('Error processing book:', file.originalFileName, error)
      if (createdLogicalBookId) {
        try {
          await booksQuery.removeBook({ id: createdLogicalBookId })
        } catch (cleanupError) {
          logger.error('Failed to roll back logical book import:', cleanupError)
        }
      } else if (createdBookFileId) {
        await db.getRepository(BookFileEntity).delete(createdBookFileId)
      }
      await Promise.allSettled([
        fs.unlink(file.destinationFile),
        ...(coverPath ? [fs.unlink(coverPath)] : []),
      ])
      const message = error instanceof Error ? error.message : String(error)
      outcomes.push({ originalFileName: file.originalFileName, status: 'error', error: message })
      mainWindow?.webContents.send('loader:update-item', {
        id: file.encodedFilename,
        label: 'loadingStatusesToast_bookAddError_label',
        subLabel: 'loadingStatusesToast_bookAddError_fileFormatNotSupported_subLabel',
        labelParams: { filename: file.originalFileName },
        status: 'error',
      })
    }
  }
  return outcomes
}
