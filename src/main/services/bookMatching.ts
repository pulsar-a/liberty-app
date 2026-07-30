import { In } from 'typeorm'
import type { BookMetadata } from '../../../types/parsed.types'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookIdEntity from '../entities/bookId.entity'
import { db } from './db'
import {
  metadataHasLanguageConflict,
  normalizedIdentifiers,
  isTrustedIdentifier,
  normalizeText,
} from './bookIdentity'

export type MatchCandidate = {
  bookId: number
  reason: 'title' | 'title_author' | 'ambiguous_hash' | 'ambiguous_identifier'
  confidence: number
  evidence: Record<string, unknown>
}

export type BookMatchResult = {
  attachToBookId: number | null
  candidates: MatchCandidate[]
}

const distinct = (values: number[]): number[] => [...new Set(values)]

export async function matchIncomingBook(
  sha256: string,
  metadata: BookMetadata
): Promise<BookMatchResult> {
  const hashFiles = await db.manager.find(BookFileEntity, {
    where: { sha256 },
  })
  const hashBookIds = distinct(hashFiles.map((file) => file.bookId))
  if (hashBookIds.length === 1) {
    return { attachToBookId: hashBookIds[0], candidates: [] }
  }

  const identifiers = normalizedIdentifiers(metadata.identifiers || []).filter((identifier) =>
    isTrustedIdentifier(identifier.type, identifier.value)
  )
  let identifierBookIds: number[] = []
  if (identifiers.length) {
    const matches = await db.manager.find(BookIdEntity, {
      where: { normalizedVal: In(identifiers.map((identifier) => identifier.normalizedValue)) },
      relations: { bookFile: { book: true } },
    })
    identifierBookIds = distinct(
      matches
        .filter(
          (identifier) =>
            identifier.bookFile?.book &&
            !metadataHasLanguageConflict(metadata, identifier.bookFile.book.lang)
        )
        .map((identifier) => identifier.bookFile.bookId)
    )
    if (identifierBookIds.length === 1) {
      return { attachToBookId: identifierBookIds[0], candidates: [] }
    }
  }

  const books = await db.manager.find(BookEntity, {
    relations: { authors: true },
  })
  const normalizedTitle = normalizeText(metadata.title || '')
  const incomingAuthors = new Set((metadata.authors || []).map(normalizeText).filter(Boolean))
  const titleCandidates = books
    .filter(
      (book) =>
        normalizedTitle &&
        normalizeText(book.name) === normalizedTitle &&
        !metadataHasLanguageConflict(metadata, book.lang)
    )
    .map((book): MatchCandidate => {
      const hasAuthor = book.authors.some((author) => incomingAuthors.has(normalizeText(author.name)))
      return {
        bookId: book.id,
        reason: hasAuthor ? 'title_author' : 'title',
        confidence: hasAuthor ? 0.78 : 0.55,
        evidence: {
          title: metadata.title,
          authors: metadata.authors,
        },
      }
    })

  const ambiguous: MatchCandidate[] =
    hashBookIds.length > 1
      ? hashBookIds.map((bookId) => ({
          bookId,
          reason: 'ambiguous_hash',
          confidence: 1,
          evidence: { sha256 },
        }))
      : identifierBookIds.length > 1
        ? identifierBookIds.map((bookId) => ({
            bookId,
            reason: 'ambiguous_identifier',
            confidence: 0.95,
            evidence: {
              identifiers: identifiers.map(({ type, value }) => ({ type, value })),
            },
          }))
        : []

  const byBook = new Map<number, MatchCandidate>()
  for (const candidate of [...ambiguous, ...titleCandidates]) {
    const current = byBook.get(candidate.bookId)
    if (!current || candidate.confidence > current.confidence) {
      byBook.set(candidate.bookId, candidate)
    }
  }
  return { attachToBookId: null, candidates: [...byBook.values()] }
}
