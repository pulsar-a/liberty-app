import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import AuthorEntity from './author.entity'
import BookIdEntity from './bookId.entity'
import CollectionEntity from './collection.entity'

@Entity('books')
export default class BookEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('text')
  name: string

  @Column('text')
  fileName: string

  @Column('text')
  originalFileName: string

  @Column('text', { nullable: true })
  cover: string | null

  @Column('text', { nullable: true })
  lang: string | null

  @Column('text', { nullable: true })
  publisher: string | null

  @Column('text', { nullable: true })
  description: string | null

  @Column('text')
  fileFormat: string

  @Column('integer', { nullable: true })
  readingProgress: number | null

  @Column('integer', { nullable: true })
  totalPages: number | null

  @Column('integer', { nullable: true })
  score: number | null

  @Column('text')
  bookHash: string

  @Column('integer', { nullable: true })
  fileSize: number | null

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @OneToMany(() => BookIdEntity, (bookId) => bookId.book, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  bookIds: BookIdEntity[]

  @ManyToMany(() => AuthorEntity, undefined, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable({ name: 'author_book' })
  authors: AuthorEntity[]

  @ManyToMany(() => CollectionEntity, (collection) => collection.books)
  collections: CollectionEntity[]
}
