import { Bookmark, TocEntry } from '@app-types/reader.types'
import {
  faBookmark,
  faBookOpen,
  faChevronDown,
  faChevronRight,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReaderStore } from '../../store/useReaderStore'

interface ReaderSidebarProps {
  className?: string
  onAddBookmark?: () => void
  onDeleteBookmark?: (bookmarkId: number) => void
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  className,
  onAddBookmark,
  onDeleteBookmark,
}) => {
  const { t } = useTranslation()
  const {
    content,
    sidebarTab,
    setSidebarTab,
    bookmarks,
    currentPageIndex,
    goToChapter,
    goToPage,
    hasBookmarkOnCurrentPage,
  } = useReaderStore()

  const tableOfContents = content?.tableOfContents || []

  return (
    <div className={clsx('flex h-full flex-col', className)}>
      {/* Tab buttons - icons only for compactness and language independence */}
      <div className="flex border-b border-gray-300 dark:border-gray-700">
        <button
          onClick={() => setSidebarTab('contents')}
          className={clsx(
            'relative flex flex-1 items-center justify-center py-3 transition-colors',
            sidebarTab === 'contents'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          )}
          title={t('reader_contents', 'Contents')}
          aria-label={t('reader_contents', 'Contents')}
        >
          <FontAwesomeIcon icon={faBookOpen} className="h-5 w-5" />
        </button>
        <button
          onClick={() => setSidebarTab('bookmarks')}
          className={clsx(
            'relative flex flex-1 items-center justify-center py-3 transition-colors',
            sidebarTab === 'bookmarks'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          )}
          title={t('reader_bookmarks', 'Bookmarks')}
          aria-label={t('reader_bookmarks', 'Bookmarks')}
        >
          <FontAwesomeIcon icon={faBookmark} className="h-5 w-5" />
          {bookmarks.length > 0 && (
            <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-medium text-white">
              {bookmarks.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {sidebarTab === 'contents' ? (
          <TableOfContents
            entries={tableOfContents}
            onNavigate={(href) => {
              // Parse href to extract file path and anchor
              const hashIndex = href.indexOf('#')
              const hrefWithoutFragment = hashIndex >= 0 ? href.substring(0, hashIndex) : href
              const anchorId = hashIndex >= 0 ? href.substring(hashIndex + 1) : undefined
              
              // Find chapter by href - handle various href formats
              const chapter = content?.chapters.find((c) => {
                // Match by exact href
                if (c.href === href || c.href === hrefWithoutFragment) return true
                // Match by href containing chapter href (for relative paths)
                if (hrefWithoutFragment && c.href.endsWith(hrefWithoutFragment)) return true
                if (hrefWithoutFragment && hrefWithoutFragment.endsWith(c.href)) return true
                // Match by id
                if (hrefWithoutFragment && (href.includes(c.id) || c.id.includes(hrefWithoutFragment))) return true
                return false
              })
              
              if (chapter) {
                goToChapter(chapter.id, anchorId)
              }
            }}
          />
        ) : (
          <BookmarksList
            bookmarks={bookmarks}
            currentPageIndex={currentPageIndex}
            onNavigate={goToPage}
            onAdd={onAddBookmark}
            onDelete={onDeleteBookmark}
            hasBookmarkOnCurrentPage={hasBookmarkOnCurrentPage()}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Table of Contents
// ============================================================================

interface TableOfContentsProps {
  entries: TocEntry[]
  onNavigate: (href: string) => void
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ entries, onNavigate }) => {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-gray-500">
        {t('reader_no_toc', 'No table of contents available')}
      </div>
    )
  }

  return (
    <nav className="p-2">
      <ul className="space-y-1">
        {entries.map((entry) => (
          <TocEntryItem key={entry.id} entry={entry} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  )
}

interface TocEntryItemProps {
  entry: TocEntry
  onNavigate: (href: string) => void
}

const TocEntryItem: React.FC<TocEntryItemProps> = ({ entry, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = entry.children && entry.children.length > 0

  return (
    <li>
      <div className="flex items-start">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-1 mt-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon
              icon={isExpanded ? faChevronDown : faChevronRight}
              className="h-3 w-3"
            />
          </button>
        )}
        <button
          onClick={() => onNavigate(entry.href)}
          className={clsx(
            'flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
            !hasChildren && 'ml-5'
          )}
          style={{ paddingLeft: hasChildren ? undefined : `${entry.level * 0.75 + 0.5}rem` }}
        >
          {entry.title}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2 dark:border-gray-700">
          {entry.children!.map((child) => (
            <TocEntryItem key={child.id} entry={child} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  )
}

// ============================================================================
// Bookmarks List
// ============================================================================

interface BookmarksListProps {
  bookmarks: Bookmark[]
  currentPageIndex: number
  onNavigate: (pageIndex: number) => void
  onAdd?: () => void
  onDelete?: (bookmarkId: number) => void
  hasBookmarkOnCurrentPage: boolean
}

const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  currentPageIndex,
  onNavigate,
  onAdd,
  onDelete,
  hasBookmarkOnCurrentPage,
}) => {
  const { t } = useTranslation()

  return (
    <div className="p-2">
      {/* Add bookmark button */}
      <button
        onClick={onAdd}
        disabled={hasBookmarkOnCurrentPage}
        className={clsx(
          'mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors',
          hasBookmarkOnCurrentPage
            ? 'cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600'
            : 'border-indigo-300 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20'
        )}
      >
        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
        {t('reader_add_bookmark', 'Add Bookmark')}
      </button>

      {/* Bookmarks list */}
      {bookmarks.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <FontAwesomeIcon icon={faBookmark} className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">{t('reader_no_bookmarks', 'No bookmarks yet')}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t('reader_bookmark_hint', 'Add bookmarks to save your favorite passages')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isCurrentPage={bookmark.pageIndex === currentPageIndex}
              onNavigate={() => onNavigate(bookmark.pageIndex)}
              onDelete={() => onDelete?.(bookmark.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: Bookmark
  isCurrentPage: boolean
  onNavigate: () => void
  onDelete: () => void
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  isCurrentPage,
  onNavigate,
  onDelete,
}) => {
  const { t } = useTranslation()

  return (
    <li
      className={clsx(
        'group relative rounded-lg border transition-colors',
        isCurrentPage
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
      )}
    >
      <div className="flex items-stretch">
        {/* Main content - clickable to navigate */}
        <button onClick={onNavigate} className="flex-1 p-3 text-left">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faBookmark}
              className={clsx(
                'h-4 w-4 shrink-0',
                isCurrentPage ? 'text-indigo-500' : 'text-gray-400'
              )}
            />
            <span className="text-sm font-medium">
              {bookmark.label || t('reader_page_n', 'Page {{n}}', { n: bookmark.pageIndex + 1 })}
            </span>
          </div>

          {bookmark.selectedText && (
            <p className="mt-1.5 line-clamp-2 pl-6 text-xs italic text-gray-500 dark:text-gray-400">
              "{bookmark.selectedText}"
            </p>
          )}
        </button>

        {/* Delete button - visible on hover, separate column */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex w-10 shrink-0 items-center justify-center rounded-r-lg border-l border-transparent text-gray-300 opacity-0 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:border-red-900 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          aria-label={t('delete', 'Delete')}
          title={t('delete', 'Delete')}
        >
          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

