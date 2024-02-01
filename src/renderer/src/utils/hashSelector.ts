const getHashCode = (text: string): number => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const getStableOptionForHash = <T>(hash: string, options: T[]): T => {
  const hashValue = getHashCode(hash)
  const colorIndex = Math.abs(hashValue) % options.length
  return options[colorIndex]
}
