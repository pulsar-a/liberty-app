import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { loadSafeZip } from '../src/main/utils/safeZip'

describe('archive safety limits', () => {
  it('loads a normal archive', async () => {
    const zip = new JSZip()
    zip.file('chapter.xhtml', '<p>Chapter</p>')

    const archive = await loadSafeZip(await zip.generateAsync({ type: 'nodebuffer' }))

    await expect(archive.file('chapter.xhtml')?.async('text')).resolves.toBe('<p>Chapter</p>')
  })

  it('rejects archives that expand beyond the configured limit', async () => {
    const zip = new JSZip()
    zip.file('large.txt', 'a'.repeat(128))

    await expect(
      loadSafeZip(await zip.generateAsync({ type: 'nodebuffer' }), {
        maxEntries: 10,
        maxUncompressedBytes: 32,
      })
    ).rejects.toThrow('expands beyond')
  })
})
