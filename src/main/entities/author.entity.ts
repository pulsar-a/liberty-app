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

@Entity('authors')
export default class AuthorEntity {
  constructor(obj) {
    this.name = obj?.name
  }

  @PrimaryGeneratedColumn()
  id: number

  @Column('text')
  name: string

  @CreateDateColumn({ type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @UpdateDateColumn({
    type: 'date',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @ManyToMany(() => BookEntity)
  @JoinTable({ name: 'author_book' })
  books: BookEntity[]
}
