const path = require('node:path')

module.exports = {
  type: 'sqlite',
  database: 'database/liberty-database.sqlite',
  seeds: [path.join(__dirname, './database/seeds/*.ts')],
  factories: [path.join(__dirname, './database/factories/*.factory.ts')],
  migrations: [path.join(__dirname, './database/migrations/*.ts')],
  entities: [path.join(__dirname, './src/main/entities/*.entity.ts')],
  cli: {
    migrationsDir: './database/migrations/',
  },
  logging: ['error'],
}
