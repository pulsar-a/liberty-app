import { authorSeed } from './authorSeed'
import { booksSeed } from './booksSeed'

export const seed = async () => {
  authorSeed()
  booksSeed()
}
