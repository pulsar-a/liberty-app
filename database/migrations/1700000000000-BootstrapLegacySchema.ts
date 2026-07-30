import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Establishes the schema that predates the migration history.
 *
 * Existing libraries already have these tables, so every statement is deliberately
 * non-destructive. New databases need this baseline now that schema synchronization
 * is disabled and migrations are the sole owner of the database shape.
 */
export class BootstrapLegacySchema1700000000000 implements MigrationInterface {
  name = 'BootstrapLegacySchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "fileName" text NOT NULL,
        "originalFileName" text NOT NULL,
        "cover" text,
        "lang" text,
        "publisher" text,
        "description" text,
        "fileFormat" text NOT NULL,
        "readingProgress" integer,
        "score" integer,
        "bookHash" text NOT NULL,
        "fileSize" integer,
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "totalPages" integer,
        "isFavorite" boolean NOT NULL DEFAULT (0)
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "authors" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "booksCount" integer NOT NULL DEFAULT (0),
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collections" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "booksCount" integer NOT NULL DEFAULT (0),
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "book_ids" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "idType" text NOT NULL,
        "idVal" text NOT NULL,
        "bookId" integer,
        CONSTRAINT "FK_a62dd495452eed2f620f385db94"
          FOREIGN KEY ("bookId") REFERENCES "books" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookmarks" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "bookId" integer NOT NULL,
        "chapterId" text NOT NULL,
        "pageIndex" integer NOT NULL,
        "label" text,
        "selectedText" text,
        "createdAt" date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_2c733d2b9f99ec2b765e3799f3d"
          FOREIGN KEY ("bookId") REFERENCES "books" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "author_book" (
        "booksId" integer NOT NULL,
        "authorsId" integer NOT NULL,
        CONSTRAINT "FK_8fb6277426c4ab32ac62e027ba5"
          FOREIGN KEY ("booksId") REFERENCES "books" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_c34b060458168383a2b398c2f7a"
          FOREIGN KEY ("authorsId") REFERENCES "authors" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY ("booksId", "authorsId")
      )
    `)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "book_collection" (
        "collectionsId" integer NOT NULL,
        "booksId" integer NOT NULL,
        CONSTRAINT "FK_8733d5a7f25c79e19e94e1e9b5a"
          FOREIGN KEY ("collectionsId") REFERENCES "collections" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_4725ae2c7e458765513e5abf8f7"
          FOREIGN KEY ("booksId") REFERENCES "books" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        PRIMARY KEY ("collectionsId", "booksId")
      )
    `)
  }

  // This migration may only have adopted an existing database, so reverting it
  // must not drop user data.
  public down(): Promise<void> {
    return Promise.resolve()
  }
}
