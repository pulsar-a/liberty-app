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
        { id: 1, name: 'Габдулла Тукай' },
        { id: 2, name: 'Тарас Шевченко' },
        { id: 3, name: 'Carl Sagan' },
        { id: 4, name: 'Douglas Preston' },
        { id: 5, name: 'Lincoln Child' },
        { id: 6, name: 'Stephen King' },
        { id: 7, name: 'Johann Wolfgang von Göthe' },
      ])
      .execute()
  }
}
