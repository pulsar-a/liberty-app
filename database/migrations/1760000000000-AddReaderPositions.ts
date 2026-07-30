import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddReaderPositions1760000000000 implements MigrationInterface {
  name = 'AddReaderPositions1760000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('books', [
      new TableColumn({ name: 'readingPosition', type: 'text', isNullable: true }),
      new TableColumn({ name: 'readingProgression', type: 'real', isNullable: true }),
    ])

    await queryRunner.addColumns('bookmarks', [
      new TableColumn({ name: 'position', type: 'text', isNullable: true }),
      new TableColumn({ name: 'progression', type: 'real', isNullable: true }),
    ])

    const bookmarks = await queryRunner.getTable('bookmarks')
    const chapterId = bookmarks?.findColumnByName('chapterId')
    const pageIndex = bookmarks?.findColumnByName('pageIndex')

    if (chapterId && !chapterId.isNullable) {
      await queryRunner.changeColumn(
        'bookmarks',
        chapterId,
        new TableColumn({ ...chapterId, isNullable: true })
      )
    }
    if (pageIndex && !pageIndex.isNullable) {
      await queryRunner.changeColumn(
        'bookmarks',
        pageIndex,
        new TableColumn({ ...pageIndex, isNullable: true })
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "bookmarks" SET "chapterId" = '' WHERE "chapterId" IS NULL`)
    await queryRunner.query(`UPDATE "bookmarks" SET "pageIndex" = 0 WHERE "pageIndex" IS NULL`)

    const bookmarks = await queryRunner.getTable('bookmarks')
    const chapterId = bookmarks?.findColumnByName('chapterId')
    const pageIndex = bookmarks?.findColumnByName('pageIndex')

    if (chapterId?.isNullable) {
      await queryRunner.changeColumn(
        'bookmarks',
        chapterId,
        new TableColumn({ ...chapterId, isNullable: false })
      )
    }
    if (pageIndex?.isNullable) {
      await queryRunner.changeColumn(
        'bookmarks',
        pageIndex,
        new TableColumn({ ...pageIndex, isNullable: false })
      )
    }

    await queryRunner.dropColumns('bookmarks', ['position', 'progression'])
    await queryRunner.dropColumns('books', ['readingPosition', 'readingProgression'])
  }
}
