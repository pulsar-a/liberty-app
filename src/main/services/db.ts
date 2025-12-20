import { app } from 'electron'
import path from 'node:path'
import { DataSource } from 'typeorm'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
import BookmarkEntity from '../entities/bookmark.entity'
import CollectionEntity from '../entities/collection.entity'
import { logger } from '../utils/logger'

const productionPath = app.getPath('userData')

export const db = new DataSource({
  type: 'sqlite',
  database: path.join(isDev ? 'database' : productionPath, 'liberty-database.sqlite'),
  synchronize: isDev, // Only auto-sync in development
  migrationsRun: true,
  logging: false,
  logger: 'advanced-console',
  entities: [BookEntity, AuthorEntity, BookIdEntity, BookmarkEntity, CollectionEntity],
  subscribers: [],
  migrations: ['database/migrations/*.js'],
})

db.initialize()
  .then(() => {
    logger.info('Database initialized successfully')
  })
  .catch((err) => {
    logger.error('Database initialization failed:', err)
  })
