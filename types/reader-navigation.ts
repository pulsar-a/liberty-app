import { BookChapter, TocEntry } from './reader.types'

function decodeHrefPart(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function normalizeBookPath(value: string): string {
  const normalized = decodeHrefPart(value)
    .replace(/\\/g, '/')
    .replace(/[?#].*$/, '')
  const parts: string[] = []

  for (const part of normalized.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') {
      parts.pop()
    } else {
      parts.push(part)
    }
  }

  return parts.join('/')
}

export function splitBookHref(href: string): { path: string; anchorId?: string } {
  const hashIndex = href.indexOf('#')
  const rawPath = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const rawAnchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : ''

  return {
    path: normalizeBookPath(rawPath),
    anchorId: rawAnchor ? decodeHrefPart(rawAnchor) : undefined,
  }
}

/** Resolve a link relative to the NAV/NCX file that contains it. */
export function resolveBookHref(baseFile: string, href: string): string {
  const hashIndex = href.indexOf('#')
  const rawPath = (hashIndex >= 0 ? href.slice(0, hashIndex) : href)
    .replace(/\\/g, '/')
    .replace(/\?.*$/, '')
  const rawAnchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : ''
  const anchorId = rawAnchor ? decodeHrefPart(rawAnchor) : undefined
  const baseDirectory = normalizeBookPath(baseFile).split('/').slice(0, -1).join('/')
  const resolvedPath = rawPath
    ? normalizeBookPath(baseDirectory ? `${baseDirectory}/${rawPath}` : rawPath)
    : normalizeBookPath(baseFile)

  return anchorId ? `${resolvedPath}#${encodeURIComponent(anchorId)}` : resolvedPath
}

export function attachTocTargets(entries: TocEntry[], chapters: BookChapter[]): TocEntry[] {
  const chaptersByHref = new Map(
    chapters.map((chapter) => [normalizeBookPath(chapter.href), chapter])
  )

  return entries.map((entry) => {
    const { path, anchorId } = splitBookHref(entry.href)
    const chapter = chaptersByHref.get(path)

    return {
      ...entry,
      chapterId: chapter?.id,
      anchorId,
      children: entry.children ? attachTocTargets(entry.children, chapters) : undefined,
    }
  })
}

export function resolveTocTarget(
  entry: TocEntry,
  chapters: BookChapter[]
): { chapterId: string; anchorId?: string } | null {
  if (entry.chapterId && chapters.some((chapter) => chapter.id === entry.chapterId)) {
    return { chapterId: entry.chapterId, anchorId: entry.anchorId }
  }

  const { path, anchorId } = splitBookHref(entry.href)
  const exact = chapters.find((chapter) => normalizeBookPath(chapter.href) === path)
  if (exact) return { chapterId: exact.id, anchorId }

  const caseInsensitive = chapters.filter(
    (chapter) => normalizeBookPath(chapter.href).toLocaleLowerCase() === path.toLocaleLowerCase()
  )
  if (caseInsensitive.length === 1) {
    return { chapterId: caseInsensitive[0].id, anchorId }
  }

  return null
}
