import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isPathInside } from '../src/main/utils/pathSecurity'

describe('managed book path validation', () => {
  const root = path.resolve('managed-books')

  it('allows the managed directory and its descendants', () => {
    expect(isPathInside(root, root)).toBe(true)
    expect(isPathInside(root, path.join(root, 'book.epub'))).toBe(true)
    expect(isPathInside(root, path.join(root, 'images', 'cover.jpg'))).toBe(true)
  })

  it('rejects siblings and traversal targets', () => {
    expect(isPathInside(root, path.resolve(root, '..', 'secret.txt'))).toBe(false)
    expect(isPathInside(root, `${root}-backup`)).toBe(false)
  })
})
