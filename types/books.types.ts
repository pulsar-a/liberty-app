export type Author = {
  id: number
  name: string
}

export type Book = {
  id: number
  name: string
  bookIdentifier: string
  identifierType: 'ISBN' | 'ASIN'
  image: string
  imageAlt?: string
  authors: Author[]
}
