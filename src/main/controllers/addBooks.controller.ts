import { parseEpub } from '@gxl/epub-parser'
import { app, dialog } from 'electron'
import fs from 'fs'
import path from 'node:path'
import slugify from 'slugify'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
import { EpubParser } from '../parsers/epub/EpubParser'
import { authorsQuery } from '../queries/authors'
import { booksQuery } from '../queries/books'

export const addBooksController = () => async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Books',
        extensions: ['pdf', 'epub'], //, 'mobi', 'fb2', 'fb3', 'djvu', 'txt'],
      },
      {
        name: 'PDF',
        extensions: ['pdf'],
      },
      {
        name: 'EPUB',
        extensions: ['epub'],
      },
      // {
      //   name: 'MOBI',
      //   extensions: ['mobi'],
      // },
      // {
      //   name: 'FB2',
      //   extensions: ['fb2'],
      // },
      // {
      //   name: 'FB3',
      //   extensions: ['fb3'],
      // },
      // {
      //   name: 'DJVU',
      //   extensions: ['djvu'],
      // },
      // {
      //   name: 'TXT',
      //   extensions: ['txt'],
      // },
      {
        name: 'All Files',
        extensions: ['*'],
      },
    ],
  })

  if (canceled) {
    return
  }

  const result: Promise<BookEntity>[] = filePaths.map(async (filePath) => {
    const appDataPath = isDev ? __dirname : app.getPath('userData')
    const originalFilename = path.basename(filePath)
    const sluggifiedFilename = slugify(originalFilename, { replacement: '-' })
    const subfolder = path.join(appDataPath, 'books/test')
    const fileName = path.join('books/test', sluggifiedFilename)

    const destinationDir = subfolder
    const destinationFile = path.join(destinationDir, sluggifiedFilename)

    console.log('=================================')
    console.log('destinationDir', destinationDir)
    console.log('destinationFile', destinationFile)
    console.log('filePath', filePath)
    console.log('fileName', fileName)
    console.log('originalFilename', originalFilename)
    console.log('sluggifiedFilename', sluggifiedFilename)
    console.log('subfolder', subfolder)
    console.log('=================================')

    if (!fs.existsSync(destinationDir)) {
      console.log('creating dir', destinationDir)
      fs.mkdirSync(destinationDir, { recursive: true })
    }

    fs.copyFileSync(filePath, destinationFile)

    const parsed = await parseEpub(destinationFile, {
      type: 'path',
    })

    const parsedTest = await new EpubParser(destinationFile).parse()

    console.log('PARSED TESTTESTTSETSTSTETST:', parsedTest?.metadata)

    const authors = parsed?.info?.authors || []

    const authorsList = await Promise.all(
      authors.map(async (name: string) => {
        return (
          (await authorsQuery.findByName(name)) ||
          (await authorsQuery.createAuthor(new AuthorEntity({ name })))
        )
      })
    )

    const book = new BookEntity()
    book.name = parsed?.info?.title || originalFilename
    book.fileName = fileName
    book.originalFileName = originalFilename
    book.fileFormat = path.extname(filePath).slice(1)
    book.description = parsed?.info?.description || null
    book.lang = 'test'
    book.publisher = 'test'
    book.cover = null
    book.readingProgress = null
    book.score = null
    book.authors = authorsList

    const createdBook = await booksQuery.createBook(book)

    return Promise.all(
      parsed.info.identifiers.map(async (identifier: { type: string; value: string }) => {
        const bookId = new BookIdEntity()
        bookId.book = createdBook
        bookId.idType = identifier.type
        bookId.idVal = identifier.value
        await booksQuery.createBookId(bookId)
      })
    )
  })

  return await Promise.all(result)
}
