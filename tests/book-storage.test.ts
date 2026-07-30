import 'reflect-metadata'
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { DataSource } from 'typeorm'
import { test } from 'vitest'
import { AddLogicalBookFiles1770000000000 } from '../database/migrations/1770000000000-AddLogicalBookFiles'
import AuthorEntity from '../src/main/entities/author.entity'
import BookEntity from '../src/main/entities/book.entity'
import BookFileEntity from '../src/main/entities/bookFile.entity'
import BookIdEntity from '../src/main/entities/bookId.entity'
import BookmarkEntity from '../src/main/entities/bookmark.entity'
import BookMatchEntity from '../src/main/entities/bookMatch.entity'
import CollectionEntity from '../src/main/entities/collection.entity'
import {
  metadataHasLanguageConflict,
  isTrustedIdentifier,
  normalizedIdentifiers,
  normalizeIdentifier,
  normalizeText,
} from '../src/main/services/bookIdentity'

test('identifier and title normalization is stable across common store metadata', () => {
  assert.equal(normalizeIdentifier('ISBN', '978-1-4028-9462-6'), '9781402894626')
  assert.equal(normalizeIdentifier('DOI', 'https://doi.org/10.1000/ABC'), '10.1000/abc')
  assert.equal(
    normalizeIdentifier('urn:uuid', 'URN:UUID:{550E8400-E29B-41D4-A716-446655440000}'),
    '550e8400-e29b-41d4-a716-446655440000'
  )
  assert.equal(normalizeIdentifier('id', 'unknown'), null)
  assert.equal(isTrustedIdentifier('BookId', 'store-local-42'), false)
  assert.equal(isTrustedIdentifier('BookId', '550e8400-e29b-41d4-a716-446655440000'), true)
  assert.equal(normalizeText('  The—Book! '), 'the book')
  assert.equal(
    normalizedIdentifiers([
      { type: 'ISBN', value: '978-1-4028-9462-6' },
      { type: 'id', value: 'unknown' },
    ]).length,
    1
  )
  assert.equal(
    metadataHasLanguageConflict(
      {
        title: 'Book',
        authors: [],
        publisher: '',
        identifiers: [],
        language: 'de-DE',
        description: '',
        subjects: [],
      },
      'en'
    ),
    true
  )
})

test('migration creates one file per legacy book without consolidating duplicate titles', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'liberty-book-files-'))
  const databasePath = path.join(tempDir, 'legacy.sqlite')
  const firstPath = path.join(tempDir, 'first.epub')
  const secondPath = path.join(tempDir, 'second.epub')
  await fs.writeFile(firstPath, 'same logical title, first representation')
  await fs.writeFile(secondPath, 'same logical title, second representation')

  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [],
    synchronize: false,
  })
  await dataSource.initialize()
  const runner = dataSource.createQueryRunner()

  try {
    await runner.query(`
      CREATE TABLE "books" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL, "fileName" text NOT NULL, "originalFileName" text NOT NULL,
        "cover" text, "lang" text, "publisher" text, "description" text,
        "fileFormat" text NOT NULL, "readingProgress" integer, "totalPages" integer,
        "readingPosition" text, "readingProgression" real, "score" integer,
        "bookHash" text NOT NULL, "fileSize" integer, "isFavorite" boolean NOT NULL DEFAULT (0),
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `)
    await runner.query(`
      CREATE TABLE "book_ids" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL, "idType" text NOT NULL, "idVal" text NOT NULL
      )
    `)
    await runner.query(`
      CREATE TABLE "bookmarks" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL, "chapterId" text, "pageIndex" integer,
        "position" text, "progression" real, "label" text, "selectedText" text,
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `)
    await runner.query(
      `INSERT INTO "books"
        ("id", "name", "fileName", "originalFileName", "fileFormat", "readingProgress",
         "totalPages", "readingPosition", "readingProgression", "bookHash", "fileSize",
         "isFavorite", "createdAt", "updatedAt")
       VALUES
        (1, 'Shared Title', ?, 'first.epub', 'epub', 5, 10, NULL, NULL, 'legacy-one', 40, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (2, 'Shared Title', ?, 'second.epub', 'epub', NULL, NULL, NULL, NULL, 'legacy-two', 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [firstPath, secondPath]
    )
    await runner.query(
      `INSERT INTO "book_ids" ("bookId", "idType", "idVal")
       VALUES (1, 'ISBN', '978-1-4028-9462-6')`
    )
    await runner.query(
      `INSERT INTO "bookmarks" ("bookId", "chapterId", "pageIndex")
       VALUES (1, 'chapter-1', 5)`
    )

    await new AddLogicalBookFiles1770000000000().up(runner)

    const books: Array<{ id: number; preferredBookFileId: number; readingProgression: number }> =
      await runner.query('SELECT * FROM "books" ORDER BY "id"')
    const files: Array<{ id: number; bookId: number; sha256: string; sourceType: string }> =
      await runner.query('SELECT * FROM "book_files" ORDER BY "bookId"')
    const identifiers: Array<{ bookFileId: number; normalizedVal: string }> = await runner.query(
      'SELECT * FROM "book_ids"'
    )
    const bookmarks: Array<{ bookId: number; bookFileId: number }> = await runner.query(
      'SELECT * FROM "bookmarks"'
    )
    const matches: Array<unknown> = await runner.query('SELECT * FROM "book_match_candidates"')

    assert.equal(books.length, 2)
    assert.equal(files.length, 2)
    assert.deepEqual(
      files.map((file) => file.bookId),
      [1, 2]
    )
    assert.notEqual(files[0].sha256, files[1].sha256)
    assert.equal(files[0].sourceType, 'legacy')
    assert.equal(books[0].preferredBookFileId, files[0].id)
    assert.equal(books[0].readingProgression, 0.6)
    assert.equal(identifiers[0].bookFileId, files[0].id)
    assert.equal(identifiers[0].normalizedVal, '9781402894626')
    assert.equal(bookmarks[0].bookFileId, files[0].id)
    assert.equal(matches.length, 0)
  } finally {
    await runner.release()
    await dataSource.destroy()
    await fs.rm(tempDir, { recursive: true, force: true })
  }
})

test('logical-book entities persist multiple identical representations', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'liberty-entities-'))
  const databasePath = path.join(tempDir, 'entities.sqlite')
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [
      BookEntity,
      BookFileEntity,
      BookIdEntity,
      BookMatchEntity,
      AuthorEntity,
      BookmarkEntity,
      CollectionEntity,
    ],
    synchronize: true,
  })
  await dataSource.initialize()

  try {
    const book = await dataSource.getRepository(BookEntity).save({
      name: 'Logical edition',
      lang: 'en',
      publisher: null,
      description: null,
      readingProgression: null,
      score: null,
      isFavorite: false,
      preferredBookFileId: null,
      coverBookFileId: null,
      authors: [],
      collections: [],
      files: [],
    })
    const files = await dataSource.getRepository(BookFileEntity).save([
      {
        bookId: book.id,
        storedPath: 'managed/one.epub',
        originalPath: 'store-a/one.epub',
        originalFileName: 'one.epub',
        fileFormat: 'epub',
        mimeType: 'application/epub+zip',
        fileSize: 10,
        sha256: 'same-checksum',
        sourceType: 'import',
        sourceLabel: null,
        sourceModifiedAt: null,
        rawMetadata: null,
        coverPath: null,
        readingPosition: null,
        lastOpenedAt: null,
        removedAt: null,
        derivedFromBookFileId: null,
      },
      {
        bookId: book.id,
        storedPath: 'managed/two.epub',
        originalPath: 'store-b/two.epub',
        originalFileName: 'two.epub',
        fileFormat: 'epub',
        mimeType: 'application/epub+zip',
        fileSize: 10,
        sha256: 'same-checksum',
        sourceType: 'import',
        sourceLabel: null,
        sourceModifiedAt: null,
        rawMetadata: null,
        coverPath: null,
        readingPosition: null,
        lastOpenedAt: null,
        removedAt: null,
        derivedFromBookFileId: null,
      },
    ])

    assert.equal(files.length, 2)
    assert.equal(files[0].bookId, files[1].bookId)
    assert.equal(files[0].sha256, files[1].sha256)
  } finally {
    await dataSource.destroy()
    await fs.rm(tempDir, { recursive: true, force: true })
  }
})
