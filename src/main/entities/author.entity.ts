import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'
import BookEntity from './book.entity'

@Entity('authors')
export default class AuthorEntity {
  constructor(obj) {
    this.name = obj?.name
  }

  @PrimaryGeneratedColumn()
  id: number

  @Column('text')
  name: string

  @ManyToMany(() => BookEntity)
  @JoinTable({ name: 'author_book' })
  books: BookEntity[]
}
