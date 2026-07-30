declare module 'foliate-js/view.js' {
  export interface FoliateTocItem {
    label?: string
    href?: string
    subitems?: FoliateTocItem[]
  }

  export interface FoliateBook {
    toc?: FoliateTocItem[]
    dir?: string
    destroy?: () => void
  }

  export interface FoliateRenderer extends HTMLElement {
    setStyles?: (styles: string) => void
  }

  export interface FoliateRelocateDetail {
    cfi: string
    fraction: number
    tocItem?: FoliateTocItem
    location?: {
      current: number
      next: number
      total: number
    }
  }

  export class View extends HTMLElement {
    book: FoliateBook
    renderer: FoliateRenderer
    open(source: string | Blob): Promise<void>
    init(options: {
      lastLocation?: string | { fraction: number }
      showTextStart?: boolean
    }): Promise<void>
    goTo(target: string | number | { fraction: number }): Promise<unknown>
    goToFraction(fraction: number): Promise<void>
    goLeft(): Promise<void>
    goRight(): Promise<void>
    prev(): Promise<void>
    next(): Promise<void>
  }
}

declare module 'foliate-js/mobi.js' {
  export function isMOBI(file: Blob): Promise<boolean>
  export class MOBI {
    constructor(options: { unzlib: (data: Uint8Array) => Uint8Array })
    open(file: Blob): Promise<{
      metadata?: Record<string, unknown>
      getCover?: () => Promise<Blob | undefined>
      mobi?: { headers?: { palmdoc?: { encryption?: number } } }
      destroy?: () => void
    }>
  }
}

declare module 'foliate-js/fb2.js' {
  export function makeFB2(file: Blob): Promise<{
    metadata?: Record<string, unknown>
    getCover?: () => Promise<Blob | null>
    destroy?: () => void
  }>
}

declare module 'foliate-js/comic-book.js' {
  export function makeComicBook(
    loader: {
      entries: { filename: string }[]
      loadBlob: (name: string) => Promise<Blob>
      getSize: (name: string) => number
      getComment: () => Promise<string>
    },
    file: { name: string }
  ): Promise<{
    metadata?: Record<string, unknown>
    getCover?: () => Promise<Blob | null>
    destroy?: () => void
  }>
}

declare module 'foliate-js/vendor/fflate.js' {
  export function unzlibSync(data: Uint8Array): Uint8Array
}
