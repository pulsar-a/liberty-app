export type Collection = {
  id: number
  name: string
  booksCount: number
  createdAt: Date
  updatedAt: Date
}

export type CollectionWithBooks = Collection & {
  books: {
    id: number
    name: string
    cover: string | null
  }[]
}

