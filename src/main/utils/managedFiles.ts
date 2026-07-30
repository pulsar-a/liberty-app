import { app } from 'electron'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { logger } from './logger'
import { isPathInside } from './pathSecurity'

export const removeManagedBookFile = async (filePath: string): Promise<boolean> => {
  try {
    const managedRoot = await fs.realpath(resolve(app.getPath('userData'), 'books'))
    const canonicalPath = await fs.realpath(filePath)
    if (!isPathInside(managedRoot, canonicalPath)) {
      logger.warn('Blocked deletion outside the managed book directory')
      return false
    }

    await fs.unlink(canonicalPath)
    return true
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    if (code !== 'ENOENT') {
      logger.warn(`Managed book asset cleanup failed: ${error}`)
    }
    return false
  }
}
