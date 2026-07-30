import { app } from 'electron'
import path from 'node:path'
import { DataSource } from 'typeorm'
import { BootstrapLegacySchema1700000000000 } from '../../../database/migrations/1700000000000-BootstrapLegacySchema'
import { AddSearchIndexes1734710400000 } from '../../../database/migrations/1734710400000-AddSearchIndexes'
import { AddReaderPositions1760000000000 } from '../../../database/migrations/1760000000000-AddReaderPositions'
import { AddLogicalBookFiles1770000000000 } from '../../../database/migrations/1770000000000-AddLogicalBookFiles'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookFileEntity from '../entities/bookFile.entity'
import BookIdEntity from '../entities/bookId.entity'
import BookMatchEntity from '../entities/bookMatch.entity'
import BookmarkEntity from '../entities/bookmark.entity'
import CollectionEntity from '../entities/collection.entity'
import { logger } from '../utils/logger'

const productionPath = app.getPath('userData')

export const db = new DataSource({
  type: 'sqlite',
  database: path.join(isDev ? 'database' : productionPath, 'liberty-database.sqlite'),
  synchronize: false,
  migrationsRun: true,
  logging: false,
  logger: 'advanced-console',
  entities: [
    BookEntity,
    BookFileEntity,
    BookIdEntity,
    BookMatchEntity,
    AuthorEntity,
    BookmarkEntity,
    CollectionEntity,
  ],
  subscribers: [],
  migrations: [
    BootstrapLegacySchema1700000000000,
    AddSearchIndexes1734710400000,
    AddReaderPositions1760000000000,
    AddLogicalBookFiles1770000000000,
  ],
})

let initialization: Promise<DataSource> | null = null

export const initializeDatabase = async (): Promise<DataSource> => {
  if (db.isInitialized) return db
  initialization ??= db.initialize()

  try {
    const dataSource = await initialization
    logger.info('Database initialized successfully')
    return dataSource
  } catch (error) {
    initialization = null
    logger.error('Database initialization failed:', error)
    throw error
  }
}
