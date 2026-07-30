import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import BookEntity from './book.entity'

export type BookMatchReason = 'title' | 'title_author' | 'ambiguous_hash' | 'ambiguous_identifier'

@Entity('book_match_candidates')
@Index('idx_book_match_pair', ['bookId', 'candidateBookId'], { unique: true })
export default class BookMatchEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('integer')
  bookId: number

  @ManyToOne(() => BookEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookEntity

  @Column('integer')
  candidateBookId: number

  @ManyToOne(() => BookEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateBookId' })
  candidateBook: BookEntity

  @Column('text')
  reason: BookMatchReason

  @Column('real')
  confidence: number

  @Column('simple-json', { nullable: true })
  evidence: Record<string, unknown> | null

  @Column('datetime', { nullable: true })
  dismissedAt: Date | null

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
