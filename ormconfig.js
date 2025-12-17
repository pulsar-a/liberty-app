const path = require('node:path')

/**
 * TypeORM configuration for CLI migrations
 * Used by: npm run typeorm migration:generate/run/revert
 */
module.exports = {
  type: 'sqlite',
  database: 'database/liberty-database.sqlite',
  migrations: [path.join(__dirname, './database/migrations/*.ts')],
  entities: [path.join(__dirname, './src/main/entities/*.entity.ts')],
  migrationsRun: false,
  synchronize: false,
  cli: {
    migrationsDir: './database/migrations/',
  },
  logging: ['error', 'migration'],
}
