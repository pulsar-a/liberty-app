import { isAbsolute, relative } from 'node:path'

export const isPathInside = (parent: string, candidate: string): boolean => {
  const relativePath = relative(parent, candidate)
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
}
