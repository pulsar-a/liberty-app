import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { HighlightedText } from './HighlightedText'

export interface CollectionSearchEntryData {
  id: number
  name: string
  booksCount: number
}

interface CollectionSearchEntryProps {
  collection: CollectionSearchEntryData
  searchTerm: string
  variant?: 'dropdown' | 'list'
  onSelect?: () => void
}

export const CollectionSearchEntry: React.FC<CollectionSearchEntryProps> = ({
  collection,
  searchTerm,
  variant = 'list',
  onSelect,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleClick = async () => {
    onSelect?.()
    // Navigate to collections page with this collection selected
    await navigate({
      to: '/my-collections',
      search: { collectionId: collection.id },
    }).catch(console.error)
  }

  const isDropdown = variant === 'dropdown'

  return (
    <div
      className={clsx(
        'group flex cursor-default items-center gap-3 transition-colors',
        isDropdown
          ? 'p-3 hover:bg-gray-100 dark:hover:bg-mako-700/50'
          : 'rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 dark:bg-mako-800/50 dark:ring-gray-700 dark:hover:ring-indigo-500/50'
      )}
      onClick={handleClick}
    >
      {/* Collection icon */}
      <div
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
          isDropdown ? 'h-10 w-10' : 'h-12 w-12'
        )}
      >
        <FontAwesomeIcon icon={faFolderOpen} className={clsx(isDropdown ? 'h-4 w-4' : 'h-5 w-5')} />
      </div>

      {/* Collection info */}
      <div className="min-w-0 flex-1">
        <h4
          className={clsx(
            'font-semibold text-gray-900 dark:text-white',
            isDropdown ? 'text-sm' : 'text-base'
          )}
        >
          <HighlightedText text={collection.name} highlight={searchTerm} />
        </h4>
        <p
          className={clsx(
            'text-gray-500 dark:text-gray-400',
            isDropdown ? 'text-xs' : 'text-sm'
          )}
        >
          {t('search_collection_booksCount', '{{count}} books', { count: collection.booksCount })}
        </p>
      </div>

      {/* Arrow indicator on hover */}
      {!isDropdown && (
        <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-gray-400">→</span>
        </div>
      )}
    </div>
  )
}

