import { faker } from '@faker-js/faker'
import { define } from 'typeorm-seeding'
import AuthorEntity from '../../src/main/entities/author.entity'

define(AuthorEntity, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return new AuthorEntity({ name: `${firstName} ${lastName}` })
})
