export const formatFileSize = (bytes: number): string => {
  const units = ['b', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0b'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  if (i === 0) return `${bytes} ${units[i]}`

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}
