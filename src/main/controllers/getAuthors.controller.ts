import AuthorEntity from '../entities/author.entity'
import { authorsQuery } from '../queries/authors'

export const getAuthorsController = async (): Promise<{ items: AuthorEntity[] }> => {
  return {
    items: await authorsQuery.authors(),
  }
}
