import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import AuthorEntity from './author.entity'
import BookFileEntity from './bookFile.entity'
import CollectionEntity from './collection.entity'

@Entity('books')
export default class BookEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Index('idx_books_name')
  @Column('text')
  name: string

  @Column('text', { nullable: true })
  lang: string | null

  @Column('text', { nullable: true })
  publisher: string | null

  @Column('text', { nullable: true })
  description: string | null

  @Column('real', { nullable: true })
  readingProgression: number | null

  @Column('integer', { nullable: true })
  score: number | null

  @Column('boolean', { default: false })
  isFavorite: boolean

  @Column('integer', { nullable: true })
  preferredBookFileId: number | null

  @Column('integer', { nullable: true })
  coverBookFileId: number | null

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @OneToMany(() => BookFileEntity, (file) => file.book, {
    cascade: true,
  })
  files: BookFileEntity[]

  @ManyToMany(() => AuthorEntity, undefined, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable({ name: 'author_book' })
  authors: AuthorEntity[]

  @ManyToMany(() => CollectionEntity, (collection) => collection.books)
  collections: CollectionEntity[]
}
