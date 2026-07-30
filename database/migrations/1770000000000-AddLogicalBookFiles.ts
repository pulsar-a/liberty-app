import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { MigrationInterface, QueryRunner } from 'typeorm'

type LegacyBookRow = {
  id: number
  name: string
  fileName: string
  originalFileName: string
  cover: string | null
  lang: string | null
  publisher: string | null
  description: string | null
  fileFormat: string
  readingProgress: number | null
  totalPages: number | null
  readingPosition: string | null
  readingProgression: number | null
  score: number | null
  bookHash: string
  fileSize: number | null
  isFavorite: number
  createdAt: string
  updatedAt: string
}

const checksum = (filePath: string): Promise<string | null> =>
  new Promise((resolve) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', () => resolve(null))
    stream.on('end', () => resolve(hash.digest('hex')))
  })

const normalizeIdentifier = (type: string, value: string): string => {
  const normalizedType = type.trim().toLowerCase().replace(/^urn:/, '')
  let normalizedValue = value.trim().normalize('NFKC')

  if (normalizedType.includes('isbn') || /^97[89][\d -]{10,}$/.test(normalizedValue)) {
    normalizedValue = normalizedValue.replace(/[^0-9Xx]/g, '').toUpperCase()
  } else if (normalizedType.includes('doi')) {
    normalizedValue = normalizedValue.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').toLowerCase()
  } else if (normalizedType.includes('uuid') || /^urn:uuid:/i.test(normalizedValue)) {
    normalizedValue = normalizedValue.replace(/^urn:uuid:/i, '').replace(/[{}]/g, '').toLowerCase()
  } else {
    normalizedValue = normalizedValue.replace(/\s+/g, '').toLowerCase()
  }

  return normalizedValue
}

export class AddLogicalBookFiles1770000000000 implements MigrationInterface {
  name = 'AddLogicalBookFiles1770000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('PRAGMA foreign_keys = OFF')

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "book_files" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL,
        "storedPath" text NOT NULL,
        "originalPath" text,
        "originalFileName" text NOT NULL,
        "fileFormat" text NOT NULL,
        "mimeType" text,
        "fileSize" integer,
        "sha256" text,
        "sourceType" text NOT NULL,
        "sourceLabel" text,
        "sourceModifiedAt" datetime,
        "rawMetadata" text,
        "coverPath" text,
        "readingPosition" text,
        "lastOpenedAt" datetime,
        "removedAt" datetime,
        "derivedFromBookFileId" integer,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_book_files_book" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_book_files_derived" FOREIGN KEY ("derivedFromBookFileId") REFERENCES "book_files" ("id") ON DELETE SET NULL
      )
    `)

    const existingFiles: Array<{ count: number }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM "book_files"'
    )
    const legacyBooks: LegacyBookRow[] = await queryRunner.query('SELECT * FROM "books"')
    const fileByBook = new Map<number, number>()

    if (Number(existingFiles[0]?.count || 0) === 0) {
      for (const book of legacyBooks) {
        const sha256 = await checksum(book.fileName)
        const progression =
          book.readingProgression ??
          (book.readingProgress !== null && book.totalPages
            ? Math.min(1, Math.max(0, (book.readingProgress + 1) / book.totalPages))
            : null)
        const rawMetadata = JSON.stringify({
          title: book.name,
          authors: [],
          publisher: book.publisher || '',
          identifiers: [],
          language: book.lang || '',
          description: book.description || '',
          subjects: [],
          legacyBookHash: book.bookHash,
        })

        await queryRunner.query(
          `INSERT INTO "book_files"
            ("bookId", "storedPath", "originalPath", "originalFileName", "fileFormat",
             "mimeType", "fileSize", "sha256", "sourceType", "sourceLabel",
             "sourceModifiedAt", "rawMetadata", "coverPath", "readingPosition",
             "lastOpenedAt", "removedAt", "derivedFromBookFileId", "createdAt", "updatedAt")
           VALUES (?, ?, NULL, ?, ?, NULL, ?, ?, 'legacy', NULL, NULL, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
          [
            book.id,
            book.fileName,
            book.originalFileName,
            book.fileFormat.toLowerCase(),
            book.fileSize,
            sha256,
            rawMetadata,
            book.cover,
            book.readingPosition,
            book.createdAt,
            book.updatedAt,
          ]
        )
        const [{ id }] = await queryRunner.query('SELECT last_insert_rowid() AS id')
        fileByBook.set(book.id, Number(id))

        if (progression !== book.readingProgression) {
          book.readingProgression = progression
        }
      }
    } else {
      const rows: Array<{ id: number; bookId: number }> = await queryRunner.query(
        'SELECT "id", "bookId" FROM "book_files" ORDER BY "id"'
      )
      rows.forEach((row) => {
        if (!fileByBook.has(row.bookId)) fileByBook.set(row.bookId, row.id)
      })
    }

    const legacyIdentifiers: Array<{
      id: number
      bookId: number
      idType: string
      idVal: string
    }> = await queryRunner.query('SELECT "id", "bookId", "idType", "idVal" FROM "book_ids"')

    await queryRunner.query(`
      CREATE TABLE "temporary_book_ids" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookFileId" integer NOT NULL,
        "idType" text NOT NULL,
        "idVal" text NOT NULL,
        "normalizedVal" text NOT NULL,
        CONSTRAINT "FK_book_ids_file" FOREIGN KEY ("bookFileId") REFERENCES "book_files" ("id") ON DELETE CASCADE
      )
    `)
    for (const identifier of legacyIdentifiers) {
      const bookFileId = fileByBook.get(identifier.bookId)
      if (!bookFileId) continue
      await queryRunner.query(
        `INSERT INTO "temporary_book_ids"
          ("id", "bookFileId", "idType", "idVal", "normalizedVal") VALUES (?, ?, ?, ?, ?)`,
        [
          identifier.id,
          bookFileId,
          identifier.idType,
          identifier.idVal,
          normalizeIdentifier(identifier.idType, identifier.idVal),
        ]
      )
    }
    await queryRunner.query('DROP TABLE "book_ids"')
    await queryRunner.query('ALTER TABLE "temporary_book_ids" RENAME TO "book_ids"')

    await queryRunner.query('ALTER TABLE "bookmarks" ADD COLUMN "bookFileId" integer')
    for (const [bookId, bookFileId] of Array.from(fileByBook.entries())) {
      await queryRunner.query('UPDATE "bookmarks" SET "bookFileId" = ? WHERE "bookId" = ?', [
        bookFileId,
        bookId,
      ])
    }
    await queryRunner.query(`
      CREATE TABLE "temporary_bookmarks" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL,
        "bookFileId" integer NOT NULL,
        "chapterId" text,
        "pageIndex" integer,
        "position" text,
        "progression" real,
        "label" text,
        "selectedText" text,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_bookmarks_book" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookmarks_file" FOREIGN KEY ("bookFileId") REFERENCES "book_files" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(`
      INSERT INTO "temporary_bookmarks"
        ("id", "bookId", "bookFileId", "chapterId", "pageIndex", "position",
         "progression", "label", "selectedText", "createdAt")
      SELECT "id", "bookId", "bookFileId", "chapterId", "pageIndex", "position",
        "progression", "label", "selectedText", "createdAt"
      FROM "bookmarks"
      WHERE "bookFileId" IS NOT NULL
    `)
    await queryRunner.query('DROP TABLE "bookmarks"')
    await queryRunner.query('ALTER TABLE "temporary_bookmarks" RENAME TO "bookmarks"')

    await queryRunner.query(`
      CREATE TABLE "temporary_books" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "lang" text,
        "publisher" text,
        "description" text,
        "readingProgression" real,
        "score" integer,
        "isFavorite" boolean NOT NULL DEFAULT (0),
        "preferredBookFileId" integer,
        "coverBookFileId" integer,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_books_preferred_file" FOREIGN KEY ("preferredBookFileId") REFERENCES "book_files" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_books_cover_file" FOREIGN KEY ("coverBookFileId") REFERENCES "book_files" ("id") ON DELETE SET NULL
      )
    `)
    for (const book of legacyBooks) {
      const fileId = fileByBook.get(book.id) || null
      await queryRunner.query(
        `INSERT INTO "temporary_books"
          ("id", "name", "lang", "publisher", "description", "readingProgression",
           "score", "isFavorite", "preferredBookFileId", "coverBookFileId", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          book.id,
          book.name,
          book.lang,
          book.publisher,
          book.description,
          book.readingProgression,
          book.score,
          book.isFavorite,
          fileId,
          book.cover ? fileId : null,
          book.createdAt,
          book.updatedAt,
        ]
      )
    }
    await queryRunner.query('DROP TABLE "books"')
    await queryRunner.query('ALTER TABLE "temporary_books" RENAME TO "books"')

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "book_match_candidates" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL,
        "candidateBookId" integer NOT NULL,
        "reason" text NOT NULL,
        "confidence" real NOT NULL,
        "evidence" text,
        "dismissedAt" datetime,
        "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_match_book" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_match_candidate" FOREIGN KEY ("candidateBookId") REFERENCES "books" ("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_books_name" ON "books" ("name")')
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_files_bookId" ON "book_files" ("bookId")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_files_storedPath" ON "book_files" ("storedPath")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_files_originalFileName" ON "book_files" ("originalFileName")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_files_fileFormat" ON "book_files" ("fileFormat")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_files_sha256" ON "book_files" ("sha256")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_ids_idType" ON "book_ids" ("idType")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_ids_idVal" ON "book_ids" ("idVal")'
    )
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_book_ids_normalizedVal" ON "book_ids" ("normalizedVal")'
    )
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "idx_book_match_pair" ON "book_match_candidates" ("bookId", "candidateBookId")'
    )

    await queryRunner.query('PRAGMA foreign_keys = ON')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('PRAGMA foreign_keys = OFF')
    await queryRunner.query('DROP TABLE IF EXISTS "book_match_candidates"')

    await queryRunner.query(`
      CREATE TABLE "temporary_books_legacy" (
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
    await queryRunner.query(`
      INSERT INTO "temporary_books_legacy"
        ("id", "name", "fileName", "originalFileName", "cover", "lang", "publisher",
         "description", "fileFormat", "readingPosition", "readingProgression", "score",
         "bookHash", "fileSize", "isFavorite", "createdAt", "updatedAt")
      SELECT b."id", b."name", f."storedPath", f."originalFileName", f."coverPath", b."lang",
        b."publisher", b."description", f."fileFormat", f."readingPosition",
        b."readingProgression", b."score", COALESCE(f."sha256", 'legacy-' || b."id"),
        f."fileSize", b."isFavorite", b."createdAt", b."updatedAt"
      FROM "books" b
      JOIN "book_files" f ON f."id" = COALESCE(
        b."preferredBookFileId",
        (SELECT MIN(f2."id") FROM "book_files" f2 WHERE f2."bookId" = b."id")
      )
    `)
    await queryRunner.query('DROP TABLE "books"')
    await queryRunner.query('ALTER TABLE "temporary_books_legacy" RENAME TO "books"')
    await queryRunner.query('DROP TABLE "book_files"')
    await queryRunner.query('PRAGMA foreign_keys = ON')
  }
}
