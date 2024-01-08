import { app, dialog } from 'electron'
import fs from 'fs'
import path from 'node:path'
import slugify from 'slugify'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
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

    console.log('destinationDir', destinationDir)
    console.log('destinationFile', destinationFile)
    console.log('filePath', filePath)
    console.log('fileName', fileName)
    console.log('originalFilename', originalFilename)
    console.log('sluggifiedFilename', sluggifiedFilename)
    console.log('subfolder', subfolder)

    if (!fs.existsSync(destinationDir)) {
      console.log('creating dir', destinationDir)
      fs.mkdirSync(destinationDir, { recursive: true })
    }

    fs.copyFileSync(filePath, destinationFile)

    const author =
      (await authorsQuery.findByName('Борис Акунин')) ||
      (await authorsQuery.createAuthor(new AuthorEntity({ name: 'Борис Акунин' })))

    const book = new BookEntity()
    book.name = originalFilename
    book.fileName = fileName
    book.originalFileName = originalFilename
    book.fileFormat = path.extname(filePath).slice(1)
    book.description = 'test'
    book.cover = null
    book.readingProgress = null
    book.score = null
    book.authors = author ? [author] : []

    return booksQuery.createBook(book)
  })

  return await Promise.all(result)
}
