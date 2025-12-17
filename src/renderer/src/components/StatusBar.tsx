import { useIpc } from '@/hooks/useIpc'
import { useLocation } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'

type StatusBarProps = {
  className?: string
}

export const StatusBar: React.FC<StatusBarProps> = ({ className }) => {
  const { t } = useTranslation()
  const { main } = useIpc()
  const location = useLocation()

  // Check current route by pathname
  const pathname = location.pathname
  const isLibrary = pathname === '/' || pathname.startsWith('/book/')
  const isMyCollections = pathname === '/my-collections'
  const isReader = pathname === '/reader'

  // Fetch data for library stats
  const { data: books } = main.getBooks.useQuery(undefined, {
    queryKey: ['getBooks', undefined],
    enabled: isLibrary,
  })
  const { data: authors } = main.getAuthors.useQuery(undefined, {
    queryKey: ['getAuthors', undefined],
    enabled: isLibrary,
  })

  // Mock collections count (would come from API when implemented)
  const collectionsCount = 3

  // Mock reader progress (would come from current book state when implemented)
  const readerProgress = 42
  const currentBookTitle = 'The Great Gatsby'
  const currentBookAuthor = 'F. Scott Fitzgerald'

  const renderLibraryStatus = () => {
    const booksCount = books?.items.length || 0
    const authorsCount = authors?.items.length || 0

    return (
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5">
          <span className="font-medium tabular-nums">{booksCount}</span>
          <span className="text-gray-500 dark:text-gray-400">
            {t('statusBar_books', { count: booksCount })}
          </span>
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="font-medium tabular-nums">{authorsCount}</span>
          <span className="text-gray-500 dark:text-gray-400">
            {t('statusBar_authors', { count: authorsCount })}
          </span>
        </span>
      </div>
    )
  }

  const renderCollectionsStatus = () => {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">{collectionsCount}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {t('statusBar_collections', { count: collectionsCount })}
        </span>
      </div>
    )
  }

  const renderReaderStatus = () => {
    return (
      <div className="flex w-full items-center gap-4">
        {/* Progress bar and percentage */}
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${readerProgress}%` }}
            />
          </div>
          <span className="font-medium tabular-nums">{readerProgress}%</span>
        </div>

        {/* Book info - truncated on small screens */}
        <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-hidden md:flex">
          <span className="h-3 w-px bg-gray-400 dark:bg-gray-600" />
          <span className="truncate pl-2 text-gray-600 dark:text-gray-300">
            {currentBookTitle}
          </span>
          <span className="shrink-0 text-gray-400 dark:text-gray-500">—</span>
          <span className="truncate text-gray-500 dark:text-gray-400">{currentBookAuthor}</span>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (isLibrary) return renderLibraryStatus()
    if (isMyCollections) return renderCollectionsStatus()
    if (isReader) return renderReaderStatus()
    return null
  }

  const content = renderContent()
  if (!content) return null

  return (
    <div
      className={clsx(
        'fixed bottom-0 left-[calc(15rem+14rem)] right-0 z-40 flex h-7 items-center border-t border-gray-300 bg-gray-100/95 px-4 text-xs backdrop-blur-sm dark:border-gray-700 dark:bg-bright-gray-900/95',
        className
      )}
    >
      {content}
    </div>
  )
}

