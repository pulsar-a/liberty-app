import { Connection } from 'typeorm'
import { Seeder } from 'typeorm-seeding'
import BookEntity from '../../src/main/entities/book.entity'
import BookIdEntity from '../../src/main/entities/bookId.entity'

export default class CreateBooks implements Seeder {
  public async run(_, connection: Connection): Promise<void> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(BookEntity)
      .values([
        {
          id: 1,
          name: 'Шүрәле',
          fileName: 'shurale.epub',
          originalFileName: 'shurale.epub',
          fileFormat: 'epub',
        },
        {
          id: 2,
          name: 'Langoliers',
          fileName: 'langoliers.epub',
          originalFileName: 'langoliers.epub',
          fileFormat: 'epub',
        },
        {
          id: 3,
          name: 'Reliquary',
          fileName: 'reliquary.mobi',
          originalFileName: 'reliquary.mobi',
          fileFormat: 'mobi',
        },
        {
          id: 4,
          name: 'Кобзар',
          fileName: 'kobzar.epub',
          originalFileName: 'kobzar.epub',
          fileFormat: 'epub',
        },
        {
          id: 5,
          name: 'Faust, Part One',
          fileName: 'faust.fb2',
          originalFileName: 'faust.fb2',
          fileFormat: 'fb2',
        },
        {
          id: 6,
          name: 'Cosmos',
          fileName: 'cosmos.pdf',
          originalFileName: 'cosmos.pdf',
          fileFormat: 'pdf',
        },
      ])
      .execute()

    await connection
      .createQueryBuilder()
      .insert()
      .into(BookIdEntity)
      .values([
        {
          id: 1,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 1 }),
          idType: 'ISBN',
          idVal: '1234567890',
        },
        {
          id: 2,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 2 }),
          idType: 'ASIN',
          idVal: 'B000FC0SIM',
        },
        {
          id: 3,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 3 }),
          idType: 'ASIN',
          idVal: 'B000FC0SIM',
        },
        {
          id: 4,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 4 }),
          idType: 'ISBN',
          idVal: '3234122343',
        },
        {
          id: 5,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 5 }),
          idType: 'ASIN',
          idVal: 'B000FC0SIM',
        },
        {
          id: 6,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 6 }),
          idType: 'ISBN',
          idVal: '1234567390',
        },
        {
          id: 7,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 6 }),
          idType: 'ISBN',
          idVal: '3234122343',
        },
        {
          id: 8,
          book: await connection.getRepository(BookEntity).findOneBy({ id: 6 }),
          idType: 'ISBN',
          idVal: '1234122343',
        },
      ])
      .execute()

    await connection
      .createQueryBuilder()
      .insert()
      .into('author_book')
      .values([
        {
          authorsId: 1,
          booksId: 1,
        },
        {
          authorsId: 2,
          booksId: 4,
        },
        {
          authorsId: 3,
          booksId: 6,
        },
        {
          authorsId: 4,
          booksId: 3,
        },
        {
          authorsId: 5,
          booksId: 3,
        },
        {
          authorsId: 6,
          booksId: 2,
        },
        {
          authorsId: 7,
          booksId: 5,
        },
      ])
      .execute()
  }
}
