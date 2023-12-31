import { Book } from '#app-types/books.types'

export const booksMock: Book[] = [
  {
    id: 1,
    name: 'Шүрәле',
    bookIdentifier: '1234567890',
    identifierType: 'ISBN',
    authors: [{ id: 3, name: 'Габдулла Тукай' }],
  },
  {
    id: 2,
    name: 'Langoliers',
    bookIdentifier: 'B000FC0SIM',
    identifierType: 'ASIN',
    authors: [{ id: 1, name: 'Stephen King' }],
  },
  {
    id: 3,
    name: 'Reliquary',
    bookIdentifier: '3234122343',
    identifierType: 'ISBN',
    authors: [
      { id: 5, name: 'Douglas Preston' },
      { id: 6, name: 'Lincoln Child' },
    ],
  },
  {
    id: 4,
    name: 'Кобзар',
    bookIdentifier: '1234567390',
    identifierType: 'ISBN',
    authors: [{ id: 4, name: 'Тарас Шевченко' }],
  },
  {
    id: 5,
    name: 'Faust, Part One',
    bookIdentifier: '3234122343',
    identifierType: 'ISBN',
    authors: [{ id: 7, name: 'Johann Wolfgang von Goethe' }],
  },
  {
    id: 6,
    name: 'Cosmos',
    bookIdentifier: '1234122343',
    identifierType: 'ISBN',
    authors: [{ id: 2, name: 'Carl Sagan' }],
  },
]
