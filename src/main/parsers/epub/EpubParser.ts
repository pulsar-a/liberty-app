import fs from 'fs'
import NodeZip from 'node-zip'
import xml2js from 'xml2js'
import { BookMetadata, ParsedBook } from '../../../../types/parsed.types'

export class EpubParser {
  private filePath: string
  private archive: NodeZip
  private xmlParser: xml2js.Parser

  constructor(filePath: string) {
    this.xmlParser = new xml2js.Parser()
    this.filePath = filePath
  }

  async parse(): Promise<ParsedBook | null> {
    const xmlString: string = await this.getArchivedFileContent('content.opf')
    this.xmlParser.parseString(xmlString, (err: Error, object: any) => {
      console.log('object', object.package.metadata[0])
      /*
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
       */

      console.log('object', object.package.manifest)
    })

    const metadata = await this._parseBookMetadata()

    if (!metadata) {
      return null
    }

    // const sections = await this._parseSections()
    return {
      metadata,
      // sections,
    }
  }

  private async getArchivedFileContent(filename: string): Promise<string> {
    const buffer: Buffer = fs.readFileSync(this.filePath, 'binary') as unknown as Buffer

    // const arch = new AdmZip(buffer)

    const zip: NodeZip = new NodeZip(buffer, { binary: true, base64: false, checkCRC32: true })

    return zip.file(filename).asText()

    // arch.getEntries().forEach((entry) => {
    //   console.log(entry.toString())
    // })

    // console.log('CONTENT OPF ', arch.readAsText(filename))

    // return ''
  }
  //
  // resolveFile(path: string): {
  //   asText: () => string
  // } {
  //   const root = this.determineRoot(path)
  //   const path = path[0] === '/' ? path.substr(1) : this._root + path
  //
  //   const file = this._zip.file(decodeURI(_path))
  //   if (file) {
  //     return file
  //   } else {
  //     throw new Error(`${_path} not found!`)
  //   }
  // }

  // determineRoot = (opfPath: string) => {
  //   let root = ''
  //   // set the opsRoot for resolving paths
  //   if (opfPath.match(/\//)) {
  //     // not at top level
  //     root = opfPath.replace(/\/([^\/]+)\.opf/i, '')
  //     if (!root.match(/\/$/)) {
  //       // 以 '/' 结尾，下面的 zip 路径写法会简单很多
  //       root += '/'
  //     }
  //     if (root.match(/^\//)) {
  //       root = root.replace(/^\//, '')
  //     }
  //   }
  //   return root
  // }

  async _parseBookMetadata(): Promise<BookMetadata | null> {
    return {
      authors: [],
      description: '',
      identifiers: [],
      language: '',
      publisher: '',
      subjects: [],
      title: '',
      coverImage: '',
    }
  }
}
