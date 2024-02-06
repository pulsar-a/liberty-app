import { Connection } from 'typeorm'
import { Factory, Seeder } from 'typeorm-seeding'
import AuthorEntity from '../../src/main/entities/author.entity'

export default class CreateAuthors implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(AuthorEntity)
      .values([
        { id: 1, name: 'Габдулла Тукай', booksCount: 1 },
        { id: 2, name: 'Тарас Шевченко', booksCount: 1 },
        { id: 3, name: 'Carl Sagan', booksCount: 1 },
        { id: 4, name: 'Douglas Preston', booksCount: 1 },
        { id: 5, name: 'Lincoln Child', booksCount: 1 },
        { id: 6, name: 'Stephen King', booksCount: 1 },
        { id: 7, name: 'Johann Wolfgang von Göthe', booksCount: 1 },
      ])
      .execute()
  }
}
