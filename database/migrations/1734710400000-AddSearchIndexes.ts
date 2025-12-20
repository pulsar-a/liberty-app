import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Migration to add indexes for fast search queries
 * 
 * Indexes added:
 * - books.name: For searching by book title
 * - books.fileName: For searching by internal (UUID) file name
 * - books.originalFileName: For searching by original file name
 * - books.fileFormat: For filtering by book format
 * - collections.name: For searching by collection name
 * - book_ids.idType: For filtering by ID type
 * - book_ids.idVal: For searching by book ID value
 * - authors.name: For searching by author name
 */
export class AddSearchIndexes1734710400000 implements MigrationInterface {
  name = 'AddSearchIndexes1734710400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Books table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_books_name" ON "books" ("name")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_books_fileName" ON "books" ("fileName")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_books_originalFileName" ON "books" ("originalFileName")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_books_fileFormat" ON "books" ("fileFormat")`)

    // Collections table index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_collections_name" ON "collections" ("name")`)

    // Book IDs table indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_book_ids_idType" ON "book_ids" ("idType")`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_book_ids_idVal" ON "book_ids" ("idVal")`)

    // Authors table index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_authors_name" ON "authors" ("name")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_authors_name"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_book_ids_idVal"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_book_ids_idType"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_collections_name"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_books_fileFormat"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_books_originalFileName"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_books_fileName"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_books_name"`)
  }
}

