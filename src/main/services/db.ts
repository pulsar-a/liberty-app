import { app } from 'electron'
import path from 'node:path'
import { DataSource } from 'typeorm'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'

const productionPath = app.getPath('userData')

export const db = new DataSource({
  type: 'sqlite',
  database: path.join(isDev ? 'database' : productionPath, 'liberty-database.sqlite'),
  synchronize: true,
  migrationsRun: true,
  logging: false,
  logger: 'advanced-console',
  entities: [BookEntity, AuthorEntity, BookIdEntity],
  subscribers: [],
  migrations: ['database/migrations/*.js'],
})

db.initialize()
  .then(() => {
    console.log('Data Source has been initialized!')
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err)
  })
