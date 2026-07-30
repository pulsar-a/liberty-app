import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { ReaderPosition } from '../../../types/reader.types'
import BookEntity from './book.entity'
import BookFileEntity from './bookFile.entity'

@Entity('bookmarks')
export default class BookmarkEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => BookEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookEntity

  @Column('integer')
  bookId: number

  @ManyToOne(() => BookFileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookFileId' })
  bookFile: BookFileEntity

  @Column('integer')
  bookFileId: number

  @Column('text', { nullable: true })
  chapterId: string | null

  @Column('integer', { nullable: true })
  pageIndex: number | null

  @Column('simple-json', { nullable: true })
  position: ReaderPosition | null

  @Column('real', { nullable: true })
  progression: number | null

  @Column('text', { nullable: true })
  label: string | null

  @Column('text', { nullable: true })
  selectedText: string | null

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
