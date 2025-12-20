import { faBook, faFileAlt, faFilter, faFolderOpen, faHashtag, faServer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageTitle } from '../components/PageTitle'
import { BookSearchEntry } from '../components/search/BookSearchEntry'
import { CollectionSearchEntry } from '../components/search/CollectionSearchEntry'
import { useIpc } from '../hooks/useIpc'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import {
  BookFormat,
  SearchFilter,
  useSearchStore,
} from '../store/useSearchStore'

// Filter option configuration
const FILTER_OPTIONS: { id: SearchFilter; icon: typeof faBook; labelKey: string }[] = [
  { id: 'books', icon: faBook, labelKey: 'search_filter_books' },
  { id: 'collections', icon: faFolderOpen, labelKey: 'search_filter_collections' },
  { id: 'book_ids', icon: faHashtag, labelKey: 'search_filter_bookIds' },
  { id: 'file_names', icon: faFileAlt, labelKey: 'search_filter_fileNames' },
  { id: 'internal_file_names', icon: faServer, labelKey: 'search_filter_internalFileNames' },
]

// Format option configuration
const FORMAT_OPTIONS: { id: BookFormat; label: string }[] = [
  { id: 'epub', label: 'EPUB' },
  { id: 'pdf', label: 'PDF' },
  { id: 'fb2', label: 'FB2' },
  { id: 'fb3', label: 'FB3' },
  { id: 'txt', label: 'TXT' },
]

export const SearchView: React.FC = () => {
  const { t } = useTranslation()
  const { main } = useIpc()

  const { searchTerm, filters, toggleFilter, formats, toggleFormat, setDropdownOpen } =
    useSearchStore()

  // Close dropdown when entering search page
  useEffect(() => {
    setDropdownOpen(false)
  }, [setDropdownOpen])

  // Full search query
  const { data: searchResults, isLoading } = main.search.useQuery(
    {
      query: searchTerm,
      filters: filters,
      formats: formats.length > 0 ? formats : undefined,
    },
    {
      enabled: searchTerm.length > 0,
      queryKey: ['search', searchTerm, filters, formats],
    }
  )

  const hasBooks = searchResults?.books && searchResults.books.length > 0
  const hasCollections = searchResults?.collections && searchResults.collections.length > 0
  const hasResults = hasBooks || hasCollections

  // Determine which sections to show based on filters
  const showBooksSection = filters.some((f) =>
    ['books', 'book_ids', 'file_names', 'internal_file_names'].includes(f)
  )
  const showCollectionsSection = filters.includes('collections')

  return (
    <ThreeSectionsLayout
      content={
        <div className="px-4 pb-36 lg:px-8">
          <PageTitle
            title={t('search_page_title', 'Search')}
            subtitle={
              searchTerm
                ? t('search_page_subtitle', 'Results for "{{query}}"', { query: searchTerm })
                : t('search_page_subtitle_empty', 'Type in the search bar above')
            }
          />

          {/* Loading state */}
          {isLoading && searchTerm && (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Empty search term */}
          {!searchTerm && (
            <EmptyState
              message={t('search_enterQuery', 'Enter a search term')}
              details={t(
                'search_enterQuery_hint',
                'Use the search bar above to find books and collections'
              )}
              type="info"
            />
          )}

          {/* No results */}
          {!isLoading && searchTerm && !hasResults && (
            <EmptyState
              message={t('search_noResults_title', 'No results found')}
              details={t(
                'search_noResults_hint',
                'Try different search terms or adjust your filters'
              )}
              type="info"
            />
          )}

          {/* Results */}
          {!isLoading && hasResults && (
            <div className="space-y-10">
              {/* Books results */}
              {showBooksSection && hasBooks && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faBook} className="h-5 w-5 text-indigo-500" />
                    {t('search_section_books', 'Books')}
                    <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({searchResults.totalBooks})
                    </span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {searchResults.books.map((book) => (
                      <BookSearchEntry
                        key={book.id}
                        book={book}
                        searchTerm={searchTerm}
                        showMatchedField
                        variant="list"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Collections results */}
              {showCollectionsSection && hasCollections && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faFolderOpen} className="h-5 w-5 text-indigo-500" />
                    {t('search_section_collections', 'Collections')}
                    <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({searchResults.totalCollections})
                    </span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {searchResults.collections.map((collection) => (
                      <CollectionSearchEntry
                        key={collection.id}
                        collection={collection}
                        searchTerm={searchTerm}
                        variant="list"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      }
      sidebar={
        <div className="px-4 py-4">
          {/* Search Filters */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <FontAwesomeIcon icon={faFilter} className="h-3.5 w-3.5" />
              {t('search_filters_title', 'Search In')}
            </h3>
            <div className="space-y-1">
              {FILTER_OPTIONS.map((option) => {
                const isActive = filters.includes(option.id)
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleFilter(option.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-mako-700/50'
                    )}
                  >
                    <FontAwesomeIcon
                      icon={option.icon}
                      className={clsx('h-4 w-4', isActive ? 'text-indigo-500' : 'text-gray-400')}
                    />
                    {t(option.labelKey, option.id)}
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Format Filters */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('search_formats_title', 'Book Formats')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((option) => {
                const isActive = formats.includes(option.id)
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleFormat(option.id)}
                    className={clsx(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-mako-700 dark:text-gray-300 dark:hover:bg-mako-600'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            {formats.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('search_formats_hint', 'Showing only selected formats')}
              </p>
            )}
          </div>
        </div>
      }
    />
  )
}

