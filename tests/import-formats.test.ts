import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BOOK_FORMATS } from '../types/reader-engines'
import { getParser, getSupportedFormats } from '../src/main/parsers/ParserRegistry'

vi.mock('electron', () => ({ app: { isPackaged: false } }))

describe('readable import formats', () => {
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => fs.rm(directory, { recursive: true, force: true }))
    )
  })

  it('derives the file filter from registered reader capabilities', () => {
    expect(getSupportedFormats()).toEqual([...BOOK_FORMATS])
    expect(getParser('pdf')).toBeNull()
    expect(getParser('docx')).toBeNull()
  })

  it.each(BOOK_FORMATS)('rejects a corrupt %s publication', async (format) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'liberty-corrupt-import-'))
    temporaryDirectories.push(directory)
    const filePath = path.join(directory, `corrupt.${format}`)
    await fs.writeFile(filePath, 'not a valid publication')

    const Parser = getParser(format)
    expect(Parser).not.toBeNull()
    if (!Parser) throw new Error(`Missing parser for ${format}`)

    let rejected = false
    try {
      const parser = new Parser({
        filePath,
        destinationFile: filePath,
        fileName: `corrupt.${format}`,
        destinationDir: directory,
        encodedFilename: `corrupt.${format}`,
        subfolder: directory,
        originalFilename: `corrupt.${format}`,
        fileExtension: format,
        encodedName: 'corrupt',
        imageDir: directory,
        imageAbsoluteDir: directory,
      })
      rejected = (await parser.parse()) === null
    } catch {
      rejected = true
    }

    expect(rejected).toBe(true)
  })
})
