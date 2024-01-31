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

@Entity('books')
export default class BookEntity {
  @PrimaryGeneratedColumn()
  id: number | null

  @Column('text')
  name: string

  @Column('text')
  fileName: string

  @Column('text')
  originalFileName: string

  @OneToMany(() => BookIdEntity, (bookId) => bookId.book)
  bookIds: BookIdEntity[]

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
  score: number | null

  @Column('text')
  bookHash: string

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @ManyToMany(() => AuthorEntity)
  @JoinTable({ name: 'author_book' })
  authors: AuthorEntity[]
}
