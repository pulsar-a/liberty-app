import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import BookFileEntity from './bookFile.entity'

@Entity('book_ids')
export default class BookIdEntity {
  @PrimaryGeneratedColumn()
  id: number | null

  @Column('integer')
  bookFileId: number

  @ManyToOne(() => BookFileEntity, (bookFile) => bookFile.identifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookFileId' })
  bookFile: BookFileEntity

  @Index('idx_book_ids_idType')
  @Column('text')
  idType: string

  @Index('idx_book_ids_idVal')
  @Column('text')
  idVal: string

  @Index('idx_book_ids_normalizedVal')
  @Column('text')
  normalizedVal: string
}
