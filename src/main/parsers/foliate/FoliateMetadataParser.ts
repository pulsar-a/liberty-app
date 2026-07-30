import fs from 'node:fs/promises'
import NodeZip from 'node-zip'
import { parseHTML } from 'linkedom'
import { ParsedBook } from '../../../../types/parsed.types'
import { AbstractParser, FileData } from '../AbstractParser'

interface FoliateBookMetadata {
  metadata?: Record<string, unknown>
  getCover?: () => Promise<Blob | null | undefined>
  destroy?: () => void
}

interface NodeZipEntry {
  dir: boolean
  name: string
  asBinary: () => string
  _data?: { length?: number } | Buffer
}

let domGlobalsInstalled = false

const installDomGlobals = (): void => {
  if (domGlobalsInstalled) return

  const { window } = parseHTML('<!doctype html><html><body></body></html>')
  const createDocument = (namespace: string | null, qualifiedName: string) =>
    new window.DOMParser().parseFromString(
      `<${qualifiedName}${namespace ? ` xmlns="${namespace}"` : ''}></${qualifiedName}>`,
      'application/xml'
    )
  Object.defineProperty(window.document, 'implementation', {
    value: { createDocument },
    configurable: true,
  })
  const globals = globalThis as Record<string, unknown>
  globals.document = window.document
  globals.DOMParser = window.DOMParser
  globals.XMLSerializer = window.XMLSerializer
  domGlobalsInstalled = true
}

const stringValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return stringValue(value[0])
  if (value && typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>)
    return stringValue(values[0])
  }
  return ''
}

const stringList = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : value ? [value] : []
  return values.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (item && typeof item === 'object') {
      const name = stringValue((item as Record<string, unknown>).name ?? item)
      return name ? [name] : []
    }
    return []
  })
}

const detectCoverExtension = (buffer: Buffer): string => {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  if (buffer.subarray(0, 6).toString('ascii').startsWith('GIF')) return 'gif'
  if (buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  return 'bin'
}

export const assertDrmFreeKindle = (encryption: number): void => {
  if (encryption !== 0) {
    throw new Error('DRM-protected Kindle books are not supported')
  }
}

export class FoliateMetadataParser extends AbstractParser {
  static readonly supportedExtensions = ['mobi', 'azw3', 'fb2', 'cbz']

  constructor(file: FileData) {
    super(file)
  }

  async parse(): Promise<ParsedBook> {
    const buffer = await fs.readFile(this.file.destinationFile)
    const blob = new Blob([buffer])
    Object.defineProperty(blob, 'name', { value: this.file.originalFilename })

    const book = await this.openBook(blob, buffer)
    try {
      const metadata = book.metadata ?? {}
      const identifier = stringValue(metadata.identifier)
      const coverBlob = await book.getCover?.()
      const coverBuffer = coverBlob ? Buffer.from(await coverBlob.arrayBuffer()) : null

      return {
        metadata: {
          title: stringValue(metadata.title) || this.file.originalFilename.replace(/\.[^/.]+$/, ''),
          authors: stringList(metadata.author ?? metadata.authors),
          publisher: stringValue(metadata.publisher),
          identifiers: identifier ? [{ type: 'foliate', value: identifier }] : [],
          language: stringValue(metadata.language),
          description: stringValue(metadata.description),
          subjects: stringList(metadata.subject ?? metadata.subjects),
        },
        cover: coverBuffer
          ? {
              archivePath: `cover.${detectCoverExtension(coverBuffer)}`,
              imageBuffer: coverBuffer,
            }
          : null,
      }
    } finally {
      book.destroy?.()
    }
  }

  private async openBook(blob: Blob, buffer: Buffer): Promise<FoliateBookMetadata> {
    switch (this.file.fileExtension) {
      case 'mobi':
      case 'azw3': {
        installDomGlobals()
        const [{ MOBI, isMOBI }, { unzlibSync }] = await Promise.all([
          import('foliate-js/mobi.js'),
          import('foliate-js/vendor/fflate.js'),
        ])
        if (!(await isMOBI(blob))) {
          throw new Error('Invalid MOBI/AZW3 file')
        }
        const book = await new MOBI({ unzlib: unzlibSync }).open(blob)
        try {
          assertDrmFreeKindle(book.mobi?.headers?.palmdoc?.encryption ?? 0)
        } catch (error) {
          book.destroy?.()
          throw error
        }
        return book
      }
      case 'fb2': {
        installDomGlobals()
        if (!/<(?:[\w-]+:)?FictionBook(?:\s|>)/i.test(buffer.toString('utf8'))) {
          throw new Error('Invalid FB2 file')
        }
        const { makeFB2 } = await import('foliate-js/fb2.js')
        return await makeFB2(blob)
      }
      case 'cbz': {
        const { makeComicBook } = await import('foliate-js/comic-book.js')
        const archive = new NodeZip(buffer, {
          binary: true,
          base64: false,
          checkCRC32: true,
        })
        const entries = Object.values(
          archive.files as unknown as Record<string, NodeZipEntry>
        ).filter((entry) => !entry.dir)
        if (!entries.some((entry) => /\.(?:avif|bmp|gif|jpe?g|png|webp)$/i.test(entry.name))) {
          throw new Error('Invalid CBZ file: no readable images')
        }
        const entryMap = new Map(entries.map((entry) => [entry.name, entry]))
        return await makeComicBook(
          {
            entries: entries.map((entry) => ({ filename: entry.name })),
            loadBlob: async (name) => {
              const data = entryMap.get(name)?.asBinary()
              if (data === undefined) throw new Error(`Missing CBZ entry: ${name}`)
              return new Blob([Buffer.from(data, 'binary')])
            },
            getSize: (name) => entryMap.get(name)?._data?.length ?? 0,
            getComment: async () => archive.comment ?? '',
          },
          { name: this.file.originalFilename }
        )
      }
      default:
        throw new Error(`Unsupported Foliate metadata format: ${this.file.fileExtension}`)
    }
  }
}
