import JSZip from 'jszip'

type ZipEntryWithSize = {
  dir: boolean
  _data?: { uncompressedSize?: number }
}

type ZipLimits = {
  maxEntries: number
  maxUncompressedBytes: number
}

const DEFAULT_LIMITS: ZipLimits = {
  maxEntries: 20_000,
  maxUncompressedBytes: 512 * 1024 * 1024,
}

export const loadSafeZip = async (
  data: Buffer | Uint8Array,
  limits: ZipLimits = DEFAULT_LIMITS
): Promise<JSZip> => {
  const archive = await JSZip.loadAsync(data, { checkCRC32: true })
  const entries = Object.values(archive.files) as ZipEntryWithSize[]
  if (entries.length > limits.maxEntries) {
    throw new Error('Archive contains too many entries')
  }

  const uncompressedBytes = entries.reduce(
    (total, entry) => total + (entry.dir ? 0 : entry._data?.uncompressedSize || 0),
    0
  )
  if (uncompressedBytes > limits.maxUncompressedBytes) {
    throw new Error('Archive expands beyond the supported size')
  }
  return archive
}
