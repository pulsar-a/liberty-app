import { describe, expect, it, vi } from 'vitest'

describe('reader store synchronization', () => {
  it('does not notify subscribers when query data is mirrored unchanged', async () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })

    const { useReaderStore } = await import('../src/renderer/src/store/useReaderStore')
    let notifications = 0
    const unsubscribe = useReaderStore.subscribe(() => {
      notifications += 1
    })

    const metadata = { bookId: 42, bookTitle: 'Stable Book', bookAuthor: 'Stable Author' }
    useReaderStore.getState().setBookMetadata(metadata)
    const afterFirstUpdate = notifications
    useReaderStore.getState().setBookMetadata({ ...metadata })
    useReaderStore.getState().setLoading(useReaderStore.getState().isLoading)
    useReaderStore.getState().setBookmarks([])
    useReaderStore.getState().setEngineLocation({
      currentPageIndex: 12,
      totalPages: 100,
      progression: 0.125,
    })
    const afterLocationUpdate = notifications
    useReaderStore.getState().setEngineLocation({
      currentPageIndex: 12,
      totalPages: 100,
      progression: 0.125,
    })

    expect(afterFirstUpdate).toBeGreaterThan(0)
    expect(afterLocationUpdate).toBe(afterFirstUpdate + 1)
    expect(notifications).toBe(afterLocationUpdate)
    expect(useReaderStore.getState().getProgressPercentage()).toBe(13)

    unsubscribe()
    vi.unstubAllGlobals()
  })
})
