import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import BookEntity from './book.entity'

@Entity('book_ids')
export default class BookIdEntity {
  @PrimaryGeneratedColumn()
  id: number | null

  @ManyToOne(() => BookEntity, (book) => book.bookIds)
  book: BookEntity | null

  @Column('text')
  idType: string

  @Column('text')
  idVal: string
}
