import fs from 'fs'
import NodeZip from 'node-zip'
import xml2js from 'xml2js'
import { DOMParser } from '@xmldom/xmldom'
import {
  BookCoverData,
  BookIdentifier,
  BookMetadata,
  ParsedBook,
} from '../../../../types/parsed.types'
import { logger } from '../../utils/logger'
import { AbstractParser, FileData } from '../AbstractParser'

/**
 * Parser for EPUB format e-books
 * Extracts metadata, cover images, and identifiers from EPUB files
 */
export class EpubParser extends AbstractParser {
  static readonly supportedExtensions = ['epub']

  private readonly filePath: string
  private xmlParser: xml2js.Parser
  private parsedCache: ParsedBook | null = null
  private readonly archive: NodeZip | null = null

  constructor(file: FileData) {
    super(file)
    this.xmlParser = new xml2js.Parser()
    this.filePath = file.filePath

    const buffer: Buffer = fs.readFileSync(this.filePath, 'binary') as unknown as Buffer

    this.archive = new NodeZip(buffer, { binary: true, base64: false, checkCRC32: true })
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
    const xmlString = await this.getArchivedFileContent(contentOpfPath)

    if (!xmlString) {
      return null
    }

    const metadata = await this.parseBookMetadata(xmlString)

    if (!metadata) {
      return null
    }

    const cover = await this.getBookCoverData(xmlString, contentOpfPath)

    this.parsedCache = {
      metadata,
      cover,
    }

    logger.debug('Parsed EPUB metadata:', metadata.title)

    return this.parsedCache
  }

  private async getArchivedFileContent(filename: string): Promise<string | null> {
    if (!this.archive) {
      return null
    }

    try {
      const zip: NodeZip = this.archive

      const fileData = zip.file(filename)

      return fileData?.asText() || null
    } catch (error) {
      logger.error('ZIP read error:', error)
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

    return {
      authors: authors || [],
      description: contentOpfRaw?.package?.metadata?.[0]?.['dc:description']?.[0] || '',
      identifiers,
      language: contentOpfRaw?.package?.metadata?.[0]?.['dc:language']?.[0] || '',
      publisher: contentOpfRaw?.package?.metadata?.[0]?.['dc:publisher']?.[0] || '',
      subjects: [],
      title: bookTitle || '',
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
        const identifierType = identifier?.$?.['opf:scheme'] || identifier?.$?.id || null
        const value = identifier._ || null

        // Filter out identifiers with missing type or value (both are required by DB schema)
        if (!value || !identifierType) {
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
    ) || []
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

  private async getBookCoverData(
    xmlString: string,
    contentOpfPath: string
  ): Promise<BookCoverData> {
    const coverImagePath = this.getBookCoverImagePath(xmlString, contentOpfPath)

    logger.debug('Cover image path:', coverImagePath)

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverData',message:'Cover path extraction',data:{coverImagePath,contentOpfPath,archiveFiles:this.archive?Object.keys(this.archive.files).slice(0,20):null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    const archiveFile = coverImagePath ? this.archive.file(coverImagePath) : null;
    const imageBuffer = archiveFile?._data ?? null;

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverData',message:'Archive file lookup result',data:{coverImagePath,archiveFileExists:!!archiveFile,imageBufferExists:!!imageBuffer,imageBufferType:imageBuffer?typeof imageBuffer:null,imageBufferLength:imageBuffer?.length??0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H3'})}).catch(()=>{});
    // #endregion

    return {
      archivePath: coverImagePath || '',
      imageBuffer: imageBuffer,
    }
  }

  private getBookCoverImagePath(xmlString: string, contentOpfPath: string): string | null {
    const opfDocument = new DOMParser().parseFromString(xmlString, 'text/xml')
    const opfDocumentDir = contentOpfPath.split('/').slice(0, -1).join('/')

    // Method 1: Look for <meta name="cover" content="cover-id">
    const metas = opfDocument.getElementsByTagName('meta')
    const coverItemId = Array.from(metas)
      .find((meta) => meta.getAttribute('name') === 'cover')
      ?.getAttribute('content')

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverImagePath',message:'Cover detection method 1 (meta tag)',data:{coverItemId,metaCount:metas.length,opfDocumentDir},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion

    if (coverItemId) {
      const coverImage = opfDocument.getElementById(coverItemId)?.getAttribute('href')
      if (coverImage) {
        const fullPath = (opfDocumentDir ? opfDocumentDir + '/' : '') + coverImage
        return fullPath
      }
    }

    // Method 2: EPUB 3 - Look for manifest item with properties="cover-image"
    const manifestItems = opfDocument.getElementsByTagName('item')
    const coverImageItem = Array.from(manifestItems)
      .find((item) => item.getAttribute('properties')?.includes('cover-image'))

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverImagePath',message:'Cover detection method 2 (EPUB3 properties)',data:{foundCoverImageItem:!!coverImageItem,manifestItemCount:manifestItems.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion

    if (coverImageItem) {
      const coverHref = coverImageItem.getAttribute('href')
      if (coverHref) {
        const fullPath = (opfDocumentDir ? opfDocumentDir + '/' : '') + coverHref
        return fullPath
      }
    }

    // Method 3: Look in <guide> section for type="cover"
    const guideRefs = opfDocument.getElementsByTagName('reference')
    const guideCover = Array.from(guideRefs)
      .find((ref) => ref.getAttribute('type') === 'cover')

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverImagePath',message:'Cover detection method 3 (guide section)',data:{foundGuideCover:!!guideCover,guideRefCount:guideRefs.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion

    if (guideCover) {
      const coverHref = guideCover.getAttribute('href')
      if (coverHref) {
        const fullPath = (opfDocumentDir ? opfDocumentDir + '/' : '') + coverHref
        return fullPath
      }
    }

    // Method 4: Fallback - look for common cover filenames in archive
    const commonCoverNames = ['cover.jpg', 'cover.jpeg', 'cover.png', 'Cover.jpg', 'Cover.jpeg', 'Cover.png']
    for (const coverName of commonCoverNames) {
      const possiblePaths = [
        coverName,
        `images/${coverName}`,
        `Images/${coverName}`,
        `OEBPS/${coverName}`,
        `OEBPS/images/${coverName}`,
        `OEBPS/Images/${coverName}`,
        (opfDocumentDir ? opfDocumentDir + '/' : '') + coverName,
        (opfDocumentDir ? opfDocumentDir + '/images/' : 'images/') + coverName,
      ]
      for (const possiblePath of possiblePaths) {
        if (this.archive?.file(possiblePath)) {
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverImagePath',message:'Cover detection method 4 (filename fallback)',data:{foundPath:possiblePath},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
          // #endregion
          return possiblePath
        }
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/becba53d-c6f7-44ee-a889-dde4f95ffa43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EpubParser.ts:getBookCoverImagePath',message:'No cover found with any method',data:{opfDocumentDir},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion

    return null
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
