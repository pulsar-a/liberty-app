import BookEntity from '../entities/book.entity'

export const booksMock: BookEntity[] = [
  {
    id: 1,
    name: 'Шүрәле',
    bookIdentifier: '1234567890',
    identifierType: 'ISBN',
    // @ts-ignore incorrect relation structure
    authors: [{ id: 3, name: 'Габдулла Тукай' }],
  },
  {
    id: 2,
    name: 'Langoliers',
    bookIdentifier: 'B000FC0SIM',
    identifierType: 'ASIN',
    // @ts-ignore incorrect relation structure
    authors: [{ id: 1, name: 'Stephen King' }],
  },
  {
    id: 3,
    name: 'Reliquary',
    bookIdentifier: '3234122343',
    identifierType: 'ISBN',
    authors: [
      // @ts-ignore incorrect relation structure
      { id: 5, name: 'Douglas Preston' },
      // @ts-ignore incorrect relation structure
      { id: 6, name: 'Lincoln Child' },
    ],
  },
  {
    id: 4,
    name: 'Кобзар',
    bookIdentifier: '1234567390',
    identifierType: 'ISBN',
    // @ts-ignore incorrect relation structure
    authors: [{ id: 4, name: 'Тарас Шевченко' }],
  },
  {
    id: 5,
    name: 'Faust, Part One',
    bookIdentifier: '3234122343',
    identifierType: 'ISBN',
    // @ts-ignore incorrect relation structure
    authors: [{ id: 7, name: 'Johann Wolfgang von Goethe' }],
  },
  {
    id: 6,
    name: 'Cosmos',
    bookIdentifier: '1234122343',
    identifierType: 'ISBN',
    // @ts-ignore incorrect relation structure
    authors: [{ id: 2, name: 'Carl Sagan' }],
  },
]
