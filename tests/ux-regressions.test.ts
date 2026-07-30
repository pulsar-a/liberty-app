import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('reported UX regressions', () => {
  it('keeps the reader settings drawer behind the bottom status bar', () => {
    const drawer = readSource(
      'src/renderer/src/components/reader/ReaderSettingsDrawer.tsx'
    )
    const statusBar = readSource('src/renderer/src/components/StatusBar.tsx')

    expect(drawer).toContain('right-0 z-30')
    expect(statusBar).toContain('right-0 z-40')
  })

  it('gives collection metadata and actions separate layout columns', () => {
    const collections = readSource('src/renderer/src/views/MyCollectionsView.tsx')

    expect(collections).toContain('grid-cols-[minmax(0,1fr)_auto]')
    expect(collections).toContain('faEllipsisVertical')
    expect(collections).not.toContain('group-hover:opacity-100')
  })
})
