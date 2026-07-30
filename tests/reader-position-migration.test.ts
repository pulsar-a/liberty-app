import { DataSource } from 'typeorm'
import { afterEach, describe, expect, it } from 'vitest'
import { AddReaderPositions1760000000000 } from '../database/migrations/1760000000000-AddReaderPositions'

describe('reader position migration', () => {
  let dataSource: DataSource | null = null

  afterEach(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy()
  })

  it('preserves legacy positions while adding engine-neutral columns', async () => {
    dataSource = new DataSource({ type: 'sqlite', database: ':memory:' })
    await dataSource.initialize()
    await dataSource.query(`
      CREATE TABLE "books" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "readingProgress" integer,
        "totalPages" integer
      )
    `)
    await dataSource.query(`
      CREATE TABLE "bookmarks" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL,
        "chapterId" text NOT NULL,
        "pageIndex" integer NOT NULL
      )
    `)
    await dataSource.query(`INSERT INTO "books" ("readingProgress", "totalPages") VALUES (12, 100)`)
    await dataSource.query(
      `INSERT INTO "bookmarks" ("bookId", "chapterId", "pageIndex") VALUES (1, 'chapter', 12)`
    )

    const runner = dataSource.createQueryRunner()
    await new AddReaderPositions1760000000000().up(runner)

    const books = await runner.getTable('books')
    const bookmarks = await runner.getTable('bookmarks')
    expect(books?.findColumnByName('readingPosition')?.isNullable).toBe(true)
    expect(books?.findColumnByName('readingProgression')?.isNullable).toBe(true)
    expect(bookmarks?.findColumnByName('position')?.isNullable).toBe(true)
    expect(bookmarks?.findColumnByName('progression')?.isNullable).toBe(true)
    expect(bookmarks?.findColumnByName('chapterId')?.isNullable).toBe(true)
    expect(bookmarks?.findColumnByName('pageIndex')?.isNullable).toBe(true)

    expect(await dataSource.query(`SELECT "readingProgress", "totalPages" FROM "books"`)).toEqual([
      { readingProgress: 12, totalPages: 100 },
    ])
    expect(await dataSource.query(`SELECT "chapterId", "pageIndex" FROM "bookmarks"`)).toEqual([
      { chapterId: 'chapter', pageIndex: 12 },
    ])

    await runner.release()
  })
})
