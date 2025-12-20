import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import BookEntity from './book.entity'

@Entity('book_ids')
export default class BookIdEntity {
  @PrimaryGeneratedColumn()
  id: number | null

  @ManyToOne(() => BookEntity, (book) => book.bookIds)
  book: BookEntity | null

  @Index('idx_book_ids_idType')
  @Column('text')
  idType: string

  @Index('idx_book_ids_idVal')
  @Column('text')
  idVal: string
}
