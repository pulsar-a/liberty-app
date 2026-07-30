export const BOOK_FORMATS = ['epub', 'mobi', 'azw3', 'fb2', 'cbz'] as const

export type BookFormat = (typeof BOOK_FORMATS)[number]
export type ReaderEngine = 'html' | 'wasm' | 'foliate'

export interface ReaderEngineDescriptor {
  id: ReaderEngine
  label: string
  experimental: boolean
  supportedFormats: readonly BookFormat[]
  formatPriority: Partial<Record<BookFormat, number>>
}

export const READER_ENGINES: readonly ReaderEngineDescriptor[] = [
  {
    id: 'wasm',
    label: 'WASM Reader',
    experimental: false,
    supportedFormats: ['epub'],
    formatPriority: { epub: 300 },
  },
  {
    id: 'html',
    label: 'HTML Reader',
    experimental: false,
    supportedFormats: ['epub'],
    formatPriority: { epub: 100 },
  },
  {
    id: 'foliate',
    label: 'Foliate',
    experimental: true,
    supportedFormats: ['epub', 'mobi', 'azw3', 'fb2', 'cbz'],
    formatPriority: {
      epub: 200,
      mobi: 300,
      azw3: 300,
      fb2: 300,
      cbz: 300,
    },
  },
] as const

export interface ReaderEngineResolution {
  format: BookFormat | null
  engine: ReaderEngine | null
  usedFallback: boolean
}

export function normalizeBookFormat(value: string | null | undefined): BookFormat | null {
  if (!value) return null

  const normalized = value.trim().toLowerCase().replace(/^\./, '')
  const alias = normalized === 'kf8' ? 'azw3' : normalized
  return BOOK_FORMATS.includes(alias as BookFormat) ? (alias as BookFormat) : null
}

export function getReaderEngineDescriptor(engine: ReaderEngine): ReaderEngineDescriptor {
  const descriptor = READER_ENGINES.find((item) => item.id === engine)
  if (!descriptor) {
    throw new Error(`Reader engine is not registered: ${engine}`)
  }
  return descriptor
}

export function engineSupportsFormat(engine: ReaderEngine, format: BookFormat): boolean {
  return getReaderEngineDescriptor(engine).supportedFormats.includes(format)
}

export function resolveReaderEngine(
  preferredEngine: ReaderEngine,
  fileFormat: string | null | undefined
): ReaderEngineResolution {
  const format = normalizeBookFormat(fileFormat)
  if (!format) {
    return { format: null, engine: null, usedFallback: false }
  }

  if (engineSupportsFormat(preferredEngine, format)) {
    return { format, engine: preferredEngine, usedFallback: false }
  }

  const fallback = READER_ENGINES.filter((engine) => engine.supportedFormats.includes(format)).sort(
    (left, right) => (right.formatPriority[format] ?? 0) - (left.formatPriority[format] ?? 0)
  )[0]

  return {
    format,
    engine: fallback?.id ?? null,
    usedFallback: Boolean(fallback),
  }
}

export function getReadableBookFormats(): BookFormat[] {
  return BOOK_FORMATS.filter((format) =>
    READER_ENGINES.some((engine) => engine.supportedFormats.includes(format))
  )
}
