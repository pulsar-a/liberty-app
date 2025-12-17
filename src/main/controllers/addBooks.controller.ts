import { app, BrowserWindow, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { ParsedBook } from '../../../types/parsed.types'
import AuthorEntity from '../entities/author.entity'
import BookEntity from '../entities/book.entity'
import BookIdEntity from '../entities/bookId.entity'
import { getParser, getSupportedFormats } from '../parsers/ParserRegistry'
import { authorsQuery } from '../queries/authors'
import { booksQuery } from '../queries/books'
import { logger } from '../utils/logger'

export const addBooksController = async () => {
  const supportedFormats = getSupportedFormats()

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Supported Books',
        extensions: supportedFormats,
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
    const encodedName = uuidv4()
    const appDataPath = app.getPath('userData')
    const originalFilename = path.basename(filePath)
    const fileExtension = path.extname(filePath).slice(1).toLowerCase() // Remove dot
    const encodedFilename = `${encodedName}.${fileExtension}`
    const subfolder = path.join(appDataPath, 'books')
    const fileName = path.join('books', encodedFilename)
    const imageAbsoluteDir = path.join(subfolder, 'images')
    const imageDir = path.join('books', 'images')

    const destinationDir = subfolder
    const destinationFile = path.join(destinationDir, encodedFilename)

    return {
      filePath,
      originalFilename,
      encodedFilename,
      encodedName,
      subfolder,
      fileExtension,
      fileName,
      destinationDir,
      destinationFile,
      imageDir,
      imageAbsoluteDir,
    }
  })

  const mainWindow = BrowserWindow.getAllWindows()[0] || null

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
      encodedName,
      imageDir,
      imageAbsoluteDir,
    } = file
    logger.debug('Processing book:', { originalFilename, fileExtension, destinationFile })

    try {
      await fs.mkdir(destinationDir, { recursive: true })
      await fs.mkdir(imageAbsoluteDir, { recursive: true })
    } catch (error) {
      logger.debug('Book directory already exists')
    }

    try {
      await fs.copyFile(filePath, destinationFile)
      const fileStats = await fs.stat(destinationFile)

      const ParserClass = getParser(fileExtension)

      if (!ParserClass) {
        throw new Error(`File type not supported: ${fileExtension}`)
      }

      const parsed: ParsedBook = await new ParserClass(file).parse()

      let imageFile: string | null = null

      if (parsed?.cover?.imageBuffer) {
        const imageExtension = parsed.cover.archivePath.split('.').pop()
        const imageFilename = `${encodedName}.${imageExtension}`
        imageFile = path.join(imageAbsoluteDir, imageFilename)

        logger.debug('Saving cover image:', imageFile)

        try {
          await fs.writeFile(
            path.join(imageAbsoluteDir, imageFilename),
            parsed.cover.imageBuffer,
            'binary'
          )
        } catch (writeError) {
          logger.error('Failed to write cover image:', writeError)
          imageFile = null // Don't save cover path if write failed
        }
      }

      const authors = parsed?.metadata.authors || []

      const authorsList = await Promise.all(
        authors.map(async (name: string) => {
          const authorEntity =
            (await authorsQuery.findByName(name)) ||
            (await authorsQuery.createAuthor(new AuthorEntity({ name, booksCount: 0 })))

          return (await authorsQuery.incrementBooks(authorEntity.id)) as AuthorEntity
        })
      )

      const book = new BookEntity()
      book.name = parsed?.metadata.title || originalFilename
      book.fileName = destinationFile
      book.originalFileName = originalFilename
      book.fileFormat = path.extname(filePath).slice(1)
      book.description = parsed?.metadata.description || null
      book.lang = parsed?.metadata.language || null
      book.publisher = parsed?.metadata.publisher || null
      book.cover = imageFile
      book.readingProgress = null
      book.score = null
      book.fileSize = fileStats.size
      book.bookHash = uuidv4()
      book.authors = authorsList

      const createdBook = await booksQuery.createBook(book)
      let bookSavedSuccessfully = false

      try {
        const addingBookIds =
          parsed?.metadata.identifiers.map(async (identifier): Promise<BookIdEntity> => {
            const bookId = new BookIdEntity()
            bookId.book = createdBook
            bookId.idType = identifier.type
            bookId.idVal = identifier.value
            return await booksQuery.createBookId(bookId)
          }) || []

        await Promise.all(addingBookIds)
        bookSavedSuccessfully = true
      } catch (identifierError) {
        await cleanupFailedBook(createdBook.id)
        throw identifierError
      }

      if (!bookSavedSuccessfully) {
        await cleanupFailedBook(createdBook.id)
        throw new Error('Book creation failed')
      }

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
      logger.error('Error processing book:', originalFilename, error)
      try {
        await fs.unlink(destinationFile)
      } catch {
        logger.debug('Book file cleanup skipped - file does not exist')
      }

      try {
        await fs.unlink(imageAbsoluteDir)
      } catch {
        logger.debug('Cover file cleanup skipped - file does not exist')
      }

      await mainWindow.webContents.send('loader:update-item', {
        id: encodedFilename,
        label: 'loadingStatusesToast_bookAddError_label',
        subLabel: 'loadingStatusesToast_bookAddError_fileFormatNotSupported_subLabel',
        labelParams: {
          filename: originalFilename,
        },
        status: 'error',
      })
    }
  }
}

// Helper to clean up a created book if subsequent operations fail
async function cleanupFailedBook(bookId: number | undefined): Promise<void> {
  if (bookId) {
    try {
      await booksQuery.removeBook({ id: bookId })
    } catch {
      // Ignore cleanup errors
    }
  }
}
