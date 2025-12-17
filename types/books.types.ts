export type Author = {
  id: number
  name: string
}

export type Book = {
  id: number
  name: string
  bookIdentifier: string
  identifierType: string
  cover?: string
  coverAlt?: string
  authors: Author[]
  readingProgress?: number
  totalPages?: number
  score?: number
  fileFormat: string
}
//
// export type BookEntity = {
//   id: number | never
//   name: string
//   bookIdentifier: string
//   identifierType: string
//   cover?: string
//   score?: number
//   fileName: string
//   fileFormat: string
//   description?: string
//   readingProgress?: number
//   authors?: AuthorEntity[]
//   createdAt?: Date
//   updatedAt?: Date
// }

export type AuthorEntity = {
  id: number | never
  name: string
  createdAt?: Date
  updatedAt?: Date
}

/*
id: number
      name: string
      bookIdentifier: string
      identifierType: string
      fileName: string
      cover: string | null
      description: string | null
      fileFormat: string | null
      readingProgress: number | null
      score: number | null
      createdAt: Date
      updatedAt: Date
 */
