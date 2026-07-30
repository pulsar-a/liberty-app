import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { BookMetadata } from '../../../types/parsed.types'
import type { ReaderPosition } from '../../../types/reader.types'
import BookEntity from './book.entity'
import BookIdEntity from './bookId.entity'

export type BookFileSourceType = 'import' | 'conversion' | 'legacy'

@Entity('book_files')
export default class BookFileEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Index('idx_book_files_bookId')
  @Column('integer')
  bookId: number

  @ManyToOne(() => BookEntity, (book) => book.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookEntity

  @Index('idx_book_files_storedPath')
  @Column('text')
  storedPath: string

  @Column('text', { nullable: true })
  originalPath: string | null

  @Index('idx_book_files_originalFileName')
  @Column('text')
  originalFileName: string

  @Index('idx_book_files_fileFormat')
  @Column('text')
  fileFormat: string

  @Column('text', { nullable: true })
  mimeType: string | null

  @Column('integer', { nullable: true })
  fileSize: number | null

  @Index('idx_book_files_sha256')
  @Column('text', { nullable: true })
  sha256: string | null

  @Column('text')
  sourceType: BookFileSourceType

  @Column('text', { nullable: true })
  sourceLabel: string | null

  @Column('datetime', { nullable: true })
  sourceModifiedAt: Date | null

  @Column('simple-json', { nullable: true })
  rawMetadata: (BookMetadata & { legacyBookHash?: string }) | null

  @Column('text', { nullable: true })
  coverPath: string | null

  @Column('simple-json', { nullable: true })
  readingPosition: ReaderPosition | null

  @Column('datetime', { nullable: true })
  lastOpenedAt: Date | null

  @Column('datetime', { nullable: true })
  removedAt: Date | null

  @Column('integer', { nullable: true })
  derivedFromBookFileId: number | null

  @ManyToOne(() => BookFileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'derivedFromBookFileId' })
  derivedFrom: BookFileEntity | null

  @OneToMany(() => BookIdEntity, (identifier) => identifier.bookFile, {
    cascade: true,
  })
  identifiers: BookIdEntity[]

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date
}
