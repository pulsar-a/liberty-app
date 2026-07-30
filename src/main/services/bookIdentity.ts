import type { BookIdentifier as ParsedIdentifier, BookMetadata } from '../../../types/parsed.types'

const PLACEHOLDERS = new Set(['', '0', 'unknown', 'none', 'n/a', 'na', 'undefined', 'null'])

export function normalizeIdentifier(type: string, value: string): string | null {
  const normalizedType = type.trim().toLowerCase().replace(/^urn:/, '')
  let normalizedValue = value.trim().normalize('NFKC')

  if (normalizedType.includes('isbn') || /^97[89][\d -]{10,}$/.test(normalizedValue)) {
    normalizedValue = normalizedValue.replace(/[^0-9Xx]/g, '').toUpperCase()
    if (normalizedValue.length !== 10 && normalizedValue.length !== 13) return null
  } else if (normalizedType.includes('doi')) {
    normalizedValue = normalizedValue
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
      .toLowerCase()
  } else if (normalizedType.includes('uuid') || /^urn:uuid:/i.test(normalizedValue)) {
    normalizedValue = normalizedValue
      .replace(/^urn:uuid:/i, '')
      .replace(/[{}]/g, '')
      .toLowerCase()
  } else if (normalizedType.includes('asin')) {
    normalizedValue = normalizedValue.replace(/\s+/g, '').toUpperCase()
  } else {
    normalizedValue = normalizedValue.replace(/\s+/g, '').toLowerCase()
  }

  return PLACEHOLDERS.has(normalizedValue.toLowerCase()) ? null : normalizedValue
}

export const normalizeText = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const normalizeLanguage = (value: string | null | undefined): string =>
  (value || '').trim().toLocaleLowerCase().split(/[-_]/)[0]

export function normalizedIdentifiers(
  identifiers: ParsedIdentifier[]
): Array<ParsedIdentifier & { normalizedValue: string }> {
  return identifiers.flatMap((identifier) => {
    const normalizedValue = normalizeIdentifier(identifier.type, identifier.value)
    return normalizedValue ? [{ ...identifier, normalizedValue }] : []
  })
}

export function isTrustedIdentifier(type: string, value: string): boolean {
  const normalizedType = type.trim().toLowerCase()
  const normalizedValue = value.trim()
  return (
    /(isbn|doi|asin|uuid)/.test(normalizedType) ||
    /^urn:(isbn|uuid):/i.test(normalizedValue) ||
    /^[{]?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[}]?$/i.test(
      normalizedValue
    ) ||
    /^(?:97[89][ -]?)?(?:\d[ -]?){9}[\dXx]$/.test(normalizedValue)
  )
}

export function metadataHasLanguageConflict(
  incoming: BookMetadata,
  existingLanguage: string | null
): boolean {
  const left = normalizeLanguage(incoming.language)
  const right = normalizeLanguage(existingLanguage)
  return Boolean(left && right && left !== right)
}
