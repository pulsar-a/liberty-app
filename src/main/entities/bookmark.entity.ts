import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import BookEntity from './book.entity'

@Entity('bookmarks')
export default class BookmarkEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => BookEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookEntity

  @Column('integer')
  bookId: number

  @Column('text')
  chapterId: string

  @Column('integer')
  pageIndex: number

  @Column('text', { nullable: true })
  label: string | null

  @Column('text', { nullable: true })
  selectedText: string | null

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}

