import { app, dialog } from 'electron'
import { getMainWindow } from 'electron-main-window'
import fs from 'fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { isDev } from '../constants/app'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
import { EpubParser } from '../parsers/epub/EpubParser'
import { NoParser } from '../parsers/noParser/NoParser'
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
      {
        name: 'MOBI',
        extensions: ['mobi'],
      },
      {
        name: 'FB2',
        extensions: ['fb2'],
      },
      {
        name: 'FB3',
        extensions: ['fb3'],
      },
      {
        name: 'DJVU',
        extensions: ['djvu'],
      },
      {
        name: 'TXT',
        extensions: ['txt'],
      },
      {
        name: 'DOC, DOCX',
        extensions: ['doc', 'docx'],
      },
      {
        name: 'All Files',
        extensions: ['*'],
      },
    ],
  })

  if (canceled) {
    return
  }

  const files = filePaths.map((filePath) => {
    const appDataPath = isDev ? __dirname : app.getPath('userData')
    const originalFilename = path.basename(filePath)
    const fileExtension = path.extname(filePath).slice(1).toLowerCase() // Remove dot
    const encodedFilename = `${uuidv4()}.${fileExtension}`
    const subfolder = path.join(appDataPath, 'books')
    const fileName = path.join('books', encodedFilename)

    const destinationDir = subfolder
    const destinationFile = path.join(destinationDir, encodedFilename)

    return {
      filePath,
      originalFilename,
      encodedFilename,
      subfolder,
      fileExtension,
      fileName,
      destinationDir,
      destinationFile,
    }
  })

  const mainWindow = getMainWindow()

  if (mainWindow !== null) {
    await mainWindow.webContents.send(
      'loader:add-items',
      files.map(({ encodedFilename, originalFilename }) => ({
        id: encodedFilename,
        label: originalFilename,
        status: 'loading',
      }))
    )
  }

  for (const file of files) {
    const {
      filePath,
      destinationFile,
      fileName,
      destinationDir,
      encodedFilename,
      subfolder,
      originalFilename,
      fileExtension,
    } = file
    console.log('=================================')
    console.log('destinationDir', destinationDir)
    console.log('destinationFile', destinationFile)
    console.log('filePath', filePath)
    console.log('fileName', fileName)
    console.log('originalFilename', originalFilename)
    console.log('encodedFilename', encodedFilename)
    console.log('fileExtension', fileExtension)
    console.log('subfolder', subfolder)
    console.log('=================================')

    try {
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true })
      }

      fs.copyFileSync(filePath, destinationFile)

      const filetypeParsersMap = {
        epub: EpubParser,
        fb2: NoParser,
        fb3: NoParser,
        mobi: NoParser,
        pdf: NoParser,
        djvu: NoParser,
        txt: NoParser,
        doc: NoParser,
        docx: NoParser,
      }

      if (!filetypeParsersMap[fileExtension]) {
        throw new Error('File type not supported')
      }

      const parsed = await new filetypeParsersMap[fileExtension](destinationFile).parse()

      const authors = parsed?.metadata.authors || []

      const authorsList = await Promise.all(
        authors.map(async (name: string) => {
          return (
            (await authorsQuery.findByName(name)) ||
            (await authorsQuery.createAuthor(new AuthorEntity({ name })))
          )
        })
      )

      const book = new BookEntity()
      book.name = parsed?.metadata.title || originalFilename
      book.fileName = fileName
      book.originalFileName = originalFilename
      book.fileFormat = path.extname(filePath).slice(1)
      book.description = parsed?.metadata.description || null
      book.lang = parsed?.metadata.language || null
      book.publisher = parsed?.metadata.publisher || null
      book.cover = parsed?.metadata.coverImage || null
      book.readingProgress = null
      book.score = null
      book.authors = authorsList

      const createdBook = await booksQuery.createBook(book)

      const addingBookIds =
        parsed?.metadata.identifiers.map(async (identifier): Promise<BookIdEntity> => {
          const bookId = new BookIdEntity()
          bookId.book = createdBook
          bookId.idType = identifier.type
          bookId.idVal = identifier.value
          return await booksQuery.createBookId(bookId)
        }) || []

      await Promise.all(addingBookIds)

      console.log('=================================')
      console.log('UPDATING LOADER', filePath)
      console.log('=================================')
      await mainWindow.webContents.send('loader:update-item', {
        id: encodedFilename,
        label: 'loadingStatusesToast_bookAdded_label',
        labelParams: {
          filename: originalFilename,
        },
        status: 'success',
      })

      // return createdBook
    } catch (error) {
      // TODO: DELETE FILE WITH ERROR
      await mainWindow.webContents.send('loader:update-item', {
        id: encodedFilename,
        label: 'loadingStatusesToast_bookAddError_label',
        subLabel: 'loadingStatusesToast_bookAddError_fileFormatNotSupported_subLabel',
        labelParams: {
          filename: originalFilename,
        },
        status: 'error',
      })
      // return null
    }
  }

  // const result: Promise<BookEntity | null>[] = files.map(
  //   async ({
  //     filePath,
  //     destinationFile,
  //     fileName,
  //     destinationDir,
  //     encodedFilename,
  //     subfolder,
  //     originalFilename,
  //   }) => {}
  // )
  //
  // return await Promise.all(result)
}
