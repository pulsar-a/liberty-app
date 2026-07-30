import 'reflect-metadata'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { DataSource } from 'typeorm'
import { afterEach, describe, expect, it } from 'vitest'
import { BootstrapLegacySchema1700000000000 } from '../database/migrations/1700000000000-BootstrapLegacySchema'
import { AddSearchIndexes1734710400000 } from '../database/migrations/1734710400000-AddSearchIndexes'
import { AddReaderPositions1760000000000 } from '../database/migrations/1760000000000-AddReaderPositions'
import { AddLogicalBookFiles1770000000000 } from '../database/migrations/1770000000000-AddLogicalBookFiles'

const migrations = [
  BootstrapLegacySchema1700000000000,
  AddSearchIndexes1734710400000,
  AddReaderPositions1760000000000,
  AddLogicalBookFiles1770000000000,
]

describe('database initialization migrations', () => {
  const tempDirectories: string[] = []
  const dataSources: DataSource[] = []

  afterEach(async () => {
    for (const dataSource of dataSources) {
      if (dataSource.isInitialized) await dataSource.destroy()
    }
    await Promise.all(
      tempDirectories
        .splice(0)
        .map((directory) => fs.rm(directory, { recursive: true, force: true }))
    )
    dataSources.length = 0
  })

  const databasePath = async (): Promise<string> => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'liberty-db-init-'))
    tempDirectories.push(directory)
    return path.join(directory, 'library.sqlite')
  }

  const connect = (database: string, runMigrations = false): DataSource => {
    const dataSource = new DataSource({
      type: 'sqlite',
      database,
      synchronize: false,
      migrationsRun: runMigrations,
      migrations,
    })
    dataSources.push(dataSource)
    return dataSource
  }

  it('creates the current schema for a fresh library using migrations only', async () => {
    const dataSource = connect(await databasePath(), true)
    await dataSource.initialize()

    const tables: Array<{ name: string }> = await dataSource.query(
      `SELECT "name" FROM "sqlite_master" WHERE "type" = 'table'`
    )
    expect(tables.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'books',
        'book_files',
        'book_ids',
        'bookmarks',
        'book_match_candidates',
      ])
    )
    expect(await dataSource.query(`SELECT COUNT(*) AS "count" FROM "migrations"`)).toEqual([
      { count: 4 },
    ])
  })

  it('upgrades a legacy library without losing file-linked relationships', async () => {
    const database = await databasePath()
    const legacy = connect(database)
    await legacy.initialize()
    await new BootstrapLegacySchema1700000000000().up(legacy.createQueryRunner())

    await legacy.query(`
      INSERT INTO "books"
        ("id", "name", "fileName", "originalFileName", "fileFormat", "bookHash")
      VALUES (1, 'Migration Book', 'missing.epub', 'original.epub', 'epub', 'legacy-hash')
    `)
    await legacy.query(`INSERT INTO "authors" ("id", "name") VALUES (1, 'Author')`)
    await legacy.query(`INSERT INTO "collections" ("id", "name") VALUES (1, 'Collection')`)
    await legacy.query(`INSERT INTO "author_book" ("booksId", "authorsId") VALUES (1, 1)`)
    await legacy.query(`INSERT INTO "book_collection" ("collectionsId", "booksId") VALUES (1, 1)`)
    await legacy.query(
      `INSERT INTO "book_ids" ("id", "bookId", "idType", "idVal")
       VALUES (1, 1, 'ISBN', '978-1-4028-9462-6')`
    )
    await legacy.query(
      `INSERT INTO "bookmarks" ("id", "bookId", "chapterId", "pageIndex")
       VALUES (1, 1, 'chapter-1', 3)`
    )
    await legacy.destroy()

    const migrated = connect(database, true)
    await migrated.initialize()

    expect(await migrated.query(`SELECT "bookId", "sha256" FROM "book_files"`)).toEqual([
      { bookId: 1, sha256: null },
    ])
    expect(await migrated.query(`SELECT "bookFileId", "normalizedVal" FROM "book_ids"`)).toEqual([
      { bookFileId: 1, normalizedVal: '9781402894626' },
    ])
    expect(await migrated.query(`SELECT "bookId", "bookFileId" FROM "bookmarks"`)).toEqual([
      { bookId: 1, bookFileId: 1 },
    ])
    expect(await migrated.query(`SELECT * FROM "author_book"`)).toEqual([
      { booksId: 1, authorsId: 1 },
    ])
    expect(await migrated.query(`SELECT * FROM "book_collection"`)).toEqual([
      { collectionsId: 1, booksId: 1 },
    ])
  })
})
