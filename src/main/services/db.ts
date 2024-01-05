import { DataSource } from 'typeorm'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'

export const db = new DataSource({
  type: 'sqlite',
  database: 'database/liberty-database.sqlite',
  synchronize: true,
  logging: true,
  logger: 'advanced-console',
  entities: [BookEntity, AuthorEntity, BookIdEntity],
  subscribers: [],
  migrations: [],
})

db.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })
