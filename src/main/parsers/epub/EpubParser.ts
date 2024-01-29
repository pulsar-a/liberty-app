import fs from 'fs'
import NodeZip from 'node-zip'
import xml2js from 'xml2js'
import { DOMParser } from 'xmldom'
import { BookIdentifier, BookMetadata, ParsedBook } from '../../../../types/parsed.types'
import { AbstractParser, FileData } from '../AbstractParser'

export class EpubParser extends AbstractParser {
  private readonly filePath: string
  private xmlParser: xml2js.Parser
  private parsedCache: ParsedBook | null = null

  constructor(file: FileData) {
    super(file)
    this.xmlParser = new xml2js.Parser()
    this.filePath = file.filePath
  }

  async parse(): Promise<ParsedBook | null> {
    if (this.parsedCache) {
      return this.parsedCache
    }

    const containerDataRaw = await this.getArchivedFileContent('META-INF/container.xml')

    if (!containerDataRaw) {
      return null
    }

    const containerData = await this.xmlParser.parseStringPromise(containerDataRaw)

    const contentOpfPath = containerData?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.['full-path']

    if (!contentOpfPath) {
      return null
    }

    // @see https://www.w3.org/TR/epub/#sec-parsing-urls-metainf
    const xmlString: string | undefined = await this.getArchivedFileContent(contentOpfPath)

    if (!xmlString) {
      return null
    }

    const metadata = await this.parseBookMetadata(xmlString)

    console.log('==== METADATA:', metadata)

    if (!metadata) {
      return null
    }

    this.parsedCache = {
      metadata,
    }

    // const sections = await this._parseSections()
    return this.parsedCache
  }

  private async getArchivedFileContent(filename: string): Promise<string | undefined> {
    try {
      const buffer: Buffer = fs.readFileSync(this.filePath, 'binary') as unknown as Buffer

      const zip: NodeZip = new NodeZip(buffer, { binary: true, base64: false, checkCRC32: true })

      const fileData = zip.file(filename)

      return fileData?.asText() || null
    } catch (error) {
      console.error('ZIP:', error)
      throw new Error('ZIP: Error while reading file')
    }
  }

  private async parseBookMetadata(xmlString: string): Promise<BookMetadata> {
    const contentOpfRaw = await this.xmlParser.parseStringPromise(xmlString)

    const authors = this.getBookAuthors(contentOpfRaw)

    const identifiers = this.getBookIdentifiers(contentOpfRaw)

    let bookTitle = contentOpfRaw?.package?.metadata?.[0]?.['dc:title']?.[0]

    if (typeof bookTitle === 'object') {
      bookTitle = bookTitle._
    }

    const coverImagePath = this.getBookCoverImagePath(xmlString)

    return {
      authors: authors || [],
      description: contentOpfRaw?.package?.metadata?.[0]?.['dc:description']?.[0] || '',
      identifiers,
      language: contentOpfRaw?.package?.metadata?.[0]?.['dc:language']?.[0] || '',
      publisher: contentOpfRaw?.package?.metadata?.[0]?.['dc:publisher']?.[0] || '',
      subjects: [],
      title: bookTitle || '',
      coverImage: coverImagePath || null,
    }
  }

  private getBookIdentifiers(contentOpfRaw: {
    package: Record<string, unknown>
  }): BookIdentifier[] {
    return contentOpfRaw?.package?.metadata?.[0]?.['dc:identifier']?.reduce(
      (
        result: { type: string; value: string }[],
        identifier: { $: { 'opf:scheme': string; id?: string }; _: string }
      ) => {
        const identifierType = identifier.$['opf:scheme'] || identifier.$.id || null
        const value = identifier._ || null

        if (!value) {
          return result
        }

        return [
          ...result,
          {
            type: identifierType,
            value: identifier._,
          },
        ]
      },
      []
    )
  }

  private getBookAuthors(contentOpfRaw: { package: Record<string, unknown> }): string[] {
    const authorsRaw = contentOpfRaw?.package?.metadata?.[0]?.['dc:creator'] || []
    // console.log(
    //   '==== OPF CREATOR:',
    //   opfDocument.getElementsByTagName('dc:creator')?.[0]?.textContent
    // )
    return (
      authorsRaw
        ?.map((author: string | Record<'_', string>) =>
          typeof author === 'object' ? author?._ : author
        )
        .map((author: string) => author.replace(/\s{2,}/g, ' ').trim()) || []
    )
  }

  private getBookCoverImagePath(xmlString: string): string | null {
    const opfDocument = new DOMParser().parseFromString(xmlString, 'text/xml')

    // console.log(
    //   '==== OPF DOCUMENT:',
    //   opfDocument.getElementById('coverimage')?.getAttribute('href')
    // )

    // const coverMeta = contentOpfRaw?.package?.metadata?.[0]?.meta?.find(
    //   (meta: { $: { name: string } }) => meta.$?.name === 'cover'
    // )

    const metas = opfDocument.getElementsByTagName('meta')

    const coverItemId = Array.from(metas)
      .find((meta) => meta.getAttribute('name') === 'cover')
      ?.getAttribute('content')

    if (!coverItemId) {
      return null
    }

    return opfDocument.getElementById(coverItemId)?.getAttribute('href') || null
  }
}

/*
OPF FILE EXAMPLES:
  // Metadata
  {
    '$': {
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:opf': 'http://www.idpf.org/2007/opf',
      'xmlns:dcterms': 'http://purl.org/dc/terms/',
      'xmlns:calibre': 'http://calibre.kovidgoyal.net/2009/metadata',
      'xmlns:dc': 'http://purl.org/dc/elements/1.1/'
    },
    meta: [ [Object], [Object], [Object] ],
    'dc:language': [ 'zh' ],
    'dc:creator': [ [Object], [Object] ],
    'dc:title': [ 'σê¢Σ╕Üµù╢,µêæΣ╗¼σ£¿τƒÑΣ╣ÄΦüèΣ╗ÇΣ╣ê?' ],
    'dc:date': [ '2014-01-16T16:00:00+00:00' ],
    'dc:contributor': [ [Object] ],
    'dc:identifier': [ [Object], [Object], [Object], [Object] ]
  }

  {
    '$': {
      'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
      'xmlns:opf': 'http://www.idpf.org/2007/opf'
    },
    meta: [ { '$': [Object] }, { '$': [Object] }, { '$': [Object] } ],
    'dc:title': [ 'Sapiens. ╨Ü╤Ç╨░╤é╨║╨░╤Å ╨╕╤ü╤é╨╛╤Ç╨╕╤Å ╤ç╨╡╨╗╨╛╨▓╨╡╤ç╨╡╤ü╤é╨▓╨░' ],
    'dc:type': [ '╨¥╨░╤â╨║╨░' ],
    'dc:creator': [ '╨«╨▓╨░╨╗╤î ╨¥╨╛╨╣ ╨Ñ╨░╤Ç╨░╤Ç╨╕' ],
    'dc:subject': [ '' ],
    'dc:description': [
      '╨«╨▓╨░╨╗╤î ╨Ñ╨░╤Ç╨░╤Ç╨╕ ╨┐╨╛╨║╨░╨╖╤ï╨▓╨░╨╡╤é, ╨║╨░╨║ ╤à╨╛╨┤ ╨╕╤ü╤é╨╛╤Ç╨╕╨╕ ╤ä╨╛╤Ç╨╝╨╕╤Ç╨╛╨▓╨░╨╗ ╤ç╨╡╨╗╨╛╨▓╨╡╤ç╨╡╤ü╨║╨╛╨╡ ╨╛╨▒╤ë╨╡╤ü╤é╨▓╨╛ ╨╕ ╨┤╨╡╨╣╤ü╤é╨▓╨╕╤é╨╡╨╗╤î╨╜╨╛╤ü╤é╤î ╨▓╨╛╨║╤Ç╤â╨│ ╨╜╨╡╨│╨╛. ╨Ü╨╜╨╕╨│╨░ ╨┐╤Ç╨╛╤ü╨╗╨╡╨╢╨╕╨▓╨░╨╡╤é ╤ü╨▓╤Å╨╖╤î ╨╝╨╡╨╢╨┤╤â ╤ü╨╛╨▒╤ï╤é╨╕╤Å╨╝╨╕ ╨┐╤Ç╨╛╤ê╨╗╨╛╨│╨╛ ╨╕ ╨┐╤Ç╨╛╨▒╨╗╨╡╨╝╨░╨╝╨╕ ╤ü╨╛╨▓╤Ç╨╡╨╝╨╡╨╜╨╜╨╛╤ü╤é╨╕.'
    ],
    'dc:publisher': [ '╨í╨╕╨╜╨┤╨▒╨░╨┤' ],
    'dc:date': [ '2020', { _: '2023-05-10', '$': [Object] } ],
    'dc:source': [ '' ],
    'dc:relation': [ '' ],
    'dc:coverage': [ '' ],
    'dc:rights': [
      'Copyright ┬⌐ Yuval Noah Harari, 2011',
      '┬⌐ ╨ÿ╨╖╨┤╨░╨╜╨╕╨╡ ╨╜╨░ ╤Ç╤â╤ü╤ü╨║╨╛╨╝ ╤Å╨╖╤ï╨║╨╡, ╨┐╨╡╤Ç╨╡╨▓╨╛╨┤ ╨╜╨░ ╤Ç╤â╤ü╤ü╨║╨╕╨╣ ╤Å╨╖╤ï╨║, ╨╛╤ä╨╛╤Ç╨╝╨╗╨╡╨╜╨╕╨╡. ╨ÿ╨╖╨┤╨░╤é╨╡╨╗╤î╤ü╤é╨▓╨╛ ┬½╨í╨╕╨╜╨┤╨▒╨░╨┤┬╗, 2016; 2018.'
    ],
    'dc:language': [ 'ru-RU' ],
    'dc:identifier': [ { _: '9785906837233', '$': [Object] } ]
  }
   */
