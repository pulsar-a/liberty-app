import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import BookEntity from './book.entity'

@Entity('authors')
export default class AuthorEntity {
  constructor(obj) {
    this.name = obj?.name
  }

  @PrimaryGeneratedColumn()
  id: number

  @Index('idx_authors_name')
  @Column('text')
  name: string

  @Column('integer', { default: 0 })
  booksCount: number

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @ManyToMany(() => BookEntity, undefined, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable({ name: 'author_book' })
  books: BookEntity[]
}
