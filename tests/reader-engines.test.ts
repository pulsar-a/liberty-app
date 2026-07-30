import { describe, expect, it, vi } from 'vitest'
import { getSupportedFormats } from '../src/main/parsers/ParserRegistry'
import {
  BOOK_FORMATS,
  READER_ENGINES,
  getReadableBookFormats,
  normalizeBookFormat,
  resolveReaderEngine,
} from '../types/reader-engines'

vi.mock('electron', () => ({ app: { isPackaged: false } }))

describe('reader engine capabilities', () => {
  it('registers format information for every engine', () => {
    expect(READER_ENGINES.map((engine) => engine.id)).toEqual(['wasm', 'html', 'foliate'])
    for (const engine of READER_ENGINES) {
      expect(engine.supportedFormats.length).toBeGreaterThan(0)
      for (const format of engine.supportedFormats) {
        expect(engine.formatPriority[format]).toBeGreaterThan(0)
      }
    }
  })

  it('keeps the preferred engine when it supports the format', () => {
    expect(resolveReaderEngine('html', 'EPUB')).toEqual({
      format: 'epub',
      engine: 'html',
      usedFallback: false,
    })
    expect(resolveReaderEngine('foliate', '.mobi')).toEqual({
      format: 'mobi',
      engine: 'foliate',
      usedFallback: false,
    })
  })

  it('resolves every preferred-engine and readable-format combination', () => {
    for (const preferred of READER_ENGINES) {
      for (const format of BOOK_FORMATS) {
        const result = resolveReaderEngine(preferred.id, format)
        const preferredSupportsFormat = preferred.supportedFormats.includes(format)

        expect(result.format).toBe(format)
        expect(result.engine).toBe(
          preferredSupportsFormat ? preferred.id : format === 'epub' ? 'wasm' : 'foliate'
        )
        expect(result.usedFallback).toBe(!preferredSupportsFormat)
      }
    }
  })

  it('selects the best compatible engine without changing the preference', () => {
    expect(resolveReaderEngine('wasm', 'azw3')).toEqual({
      format: 'azw3',
      engine: 'foliate',
      usedFallback: true,
    })
    expect(resolveReaderEngine('html', 'cbz')).toEqual({
      format: 'cbz',
      engine: 'foliate',
      usedFallback: true,
    })
  })

  it('returns no engine for unreadable formats', () => {
    expect(resolveReaderEngine('wasm', 'pdf')).toEqual({
      format: null,
      engine: null,
      usedFallback: false,
    })
  })

  it('normalizes KF8 and derives imports from readable engine formats', () => {
    expect(normalizeBookFormat('KF8')).toBe('azw3')
    expect(getReadableBookFormats()).toEqual([...BOOK_FORMATS])
    expect(getSupportedFormats()).toEqual([...BOOK_FORMATS])
    expect(
      READER_ENGINES.map((engine) => ({
        label: engine.label,
        formats: engine.supportedFormats.join(','),
      }))
    ).toEqual([
      { label: 'WASM Reader', formats: 'epub' },
      { label: 'HTML Reader', formats: 'epub' },
      { label: 'Foliate', formats: 'epub,mobi,azw3,fb2,cbz' },
    ])
  })
})
