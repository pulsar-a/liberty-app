import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import BookEntity from './book.entity'

@Entity('collections')
export default class CollectionEntity {
  constructor(obj?: { name?: string }) {
    this.name = obj?.name || ''
  }

  @PrimaryGeneratedColumn()
  id: number

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

  @ManyToMany(() => BookEntity, (book) => book.collections, {
    onDelete: 'CASCADE',
  })
  @JoinTable({ name: 'book_collection' })
  books: BookEntity[]
}

