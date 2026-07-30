import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FoliateMetadataParser,
  assertDrmFreeKindle,
} from '../src/main/parsers/foliate/FoliateMetadataParser'

describe('Foliate metadata parser', () => {
  it('extracts FB2 metadata through Foliate', async () => {
    const fixturePath = path.resolve('tests/fixtures/sample.fb2')
    const parser = new FoliateMetadataParser({
      filePath: fixturePath,
      destinationFile: fixturePath,
      fileName: 'sample.fb2',
      destinationDir: path.dirname(fixturePath),
      encodedFilename: 'sample.fb2',
      subfolder: path.dirname(fixturePath),
      originalFilename: 'sample.fb2',
      fileExtension: 'fb2',
      encodedName: 'sample',
      imageDir: path.dirname(fixturePath),
      imageAbsoluteDir: path.dirname(fixturePath),
    })

    const result = await parser.parse()
    expect(result.metadata.title).toBe('Capability Test Book')
    expect(result.metadata.authors.join(' ')).toContain('Ada')
    expect(result.metadata.language).toBe('en')
    expect(result.metadata.identifiers).toEqual([{ type: 'foliate', value: 'liberty-fixture' }])
  })

  it('rejects DRM-protected Kindle publications', () => {
    expect(() => assertDrmFreeKindle(1)).toThrow('DRM-protected Kindle books are not supported')
    expect(() => assertDrmFreeKindle(0)).not.toThrow()
  })
})
