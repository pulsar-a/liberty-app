import fs from 'node:fs/promises'
import type {
  Book,
  BookFile,
  BookMatchSuggestion,
  BookSummary,
} from '../../../types/books.types'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookMatchEntity from '../entities/bookMatch.entity'
import { getReadableBookFormats } from '../../../types/reader-engines'

const readableFormats = new Set<string>(getReadableBookFormats())

async function fileExists(file: BookFileEntity): Promise<boolean> {
  if (file.removedAt) return false
  try {
    await fs.access(file.storedPath)
    return true
  } catch {
    return false
  }
}

export async function toBookFileDto(
  file: BookFileEntity,
  preferredBookFileId: number | null
): Promise<BookFile> {
  const isAvailable = await fileExists(file)
  return {
    id: file.id,
    bookId: file.bookId,
    storedPath: file.storedPath,
    originalPath: file.originalPath,
    originalFileName: file.originalFileName,
    fileFormat: file.fileFormat,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    sha256: file.sha256,
    sourceType: file.sourceType,
    sourceLabel: file.sourceLabel,
    sourceModifiedAt: file.sourceModifiedAt,
    coverPath: file.coverPath,
    readingPosition: file.readingPosition,
    lastOpenedAt: file.lastOpenedAt,
    removedAt: file.removedAt,
    derivedFromBookFileId: file.derivedFromBookFileId,
    identifiers: (file.identifiers || []).map((identifier) => ({
      id: Number(identifier.id),
      bookFileId: identifier.bookFileId,
      idType: identifier.idType,
      idVal: identifier.idVal,
      normalizedVal: identifier.normalizedVal,
    })),
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    isAvailable,
    isReadable: isAvailable && readableFormats.has(file.fileFormat.toLowerCase()),
    isPreferred: file.id === preferredBookFileId,
  }
}

export async function toBookSummary(book: BookEntity): Promise<BookSummary> {
  const files = await Promise.all(
    (book.files || []).map((file) => toBookFileDto(file, book.preferredBookFileId))
  )
  const activeFiles = files.filter((file) => file.isAvailable)
  const coverFile =
    files.find((file) => file.id === book.coverBookFileId && file.coverPath) ||
    files.find((file) => file.coverPath)

  return {
    id: book.id,
    name: book.name,
    cover: coverFile?.coverPath || null,
    lang: book.lang,
    publisher: book.publisher,
    description: book.description,
    authors: (book.authors || []).map(({ id, name }) => ({ id, name })),
    readingProgression: book.readingProgression,
    score: book.score,
    isFavorite: book.isFavorite,
    formats: [...new Set(activeFiles.map((file) => file.fileFormat.toLowerCase()))].sort(),
    activeFileCount: activeFiles.length,
    isFileless: activeFiles.length === 0,
    hasReadableFile: activeFiles.some((file) => file.isReadable),
    preferredBookFileId: book.preferredBookFileId,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  }
}

export async function toBookDto(
  book: BookEntity,
  matches: BookMatchEntity[] = []
): Promise<Book> {
  const summary = await toBookSummary(book)
  const files = await Promise.all(
    (book.files || []).map((file) => toBookFileDto(file, book.preferredBookFileId))
  )
  const suggestions: BookMatchSuggestion[] = await Promise.all(
    matches
      .filter((match) => !match.dismissedAt)
      .map(async (match) => {
        const candidate = match.bookId === book.id ? match.candidateBook : match.book
        return {
          id: match.id,
          reason: match.reason,
          confidence: match.confidence,
          evidence: match.evidence,
          candidate: await toBookSummary(candidate),
        }
      })
  )

  return {
    ...summary,
    files,
    bookIds: files.flatMap((file) => file.identifiers),
    collections: (book.collections || []).map(({ id, name }) => ({ id, name })),
    matchSuggestions: suggestions,
    preferredFile:
      files.find((file) => file.id === book.preferredBookFileId && file.isReadable) ||
      files
        .filter((file) => file.isReadable)
        .sort(
          (a, b) =>
            (b.lastOpenedAt?.getTime() || 0) - (a.lastOpenedAt?.getTime() || 0) || a.id - b.id
        )[0] ||
      null,
  }
}
