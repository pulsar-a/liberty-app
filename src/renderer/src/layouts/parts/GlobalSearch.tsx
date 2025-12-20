import { faChevronRight, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Transition } from '@headlessui/react'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookSearchEntry } from '../../components/search/BookSearchEntry'
import { CollectionSearchEntry } from '../../components/search/CollectionSearchEntry'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useIpc } from '../../hooks/useIpc'
import { useSearchStore } from '../../store/useSearchStore'
import { grabIsMac, usePlatformStore } from '../../store/usePlatformStore'

export const GlobalSearch: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMac = usePlatformStore(grabIsMac)
  const { main } = useIpc()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    searchTerm,
    setSearchTerm,
    isDropdownOpen,
    setDropdownOpen,
    setFilters,
  } = useSearchStore()
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  
  // Debounce search term updates to store
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm)
    }, 150)
    return () => clearTimeout(timer)
  }, [localSearchTerm, setSearchTerm])

  // Quick search query
  const { data: searchResults, isLoading } = main.quickSearch.useQuery(
    { query: localSearchTerm },
    {
      enabled: localSearchTerm.length > 0,
      queryKey: ['quickSearch', localSearchTerm],
    }
  )

  // Show/hide dropdown based on search term and focus
  useEffect(() => {
    if (localSearchTerm.length > 0) {
      setDropdownOpen(true)
    }
  }, [localSearchTerm, setDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setDropdownOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape to close dropdown
      if (e.key === 'Escape' && isDropdownOpen) {
        setDropdownOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDropdownOpen, setDropdownOpen])

  const handleFocus = () => {
    if (localSearchTerm.length > 0) {
      setDropdownOpen(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  const handleShowAllBooks = () => {
    setFilters(['books'])
    setDropdownOpen(false)
    navigate({ to: '/search' })
  }

  const handleShowAllCollections = () => {
    setFilters(['collections'])
    setDropdownOpen(false)
    navigate({ to: '/search' })
  }

  const handleSelectResult = () => {
    setDropdownOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearchTerm.length > 0) {
      setDropdownOpen(false)
      navigate({ to: '/search' })
    }
  }

  const hasBooks = searchResults?.books && searchResults.books.length > 0
  const hasCollections = searchResults?.collections && searchResults.collections.length > 0
  const hasResults = hasBooks || hasCollections

  const withShortcuts = true

  return (
    <div ref={containerRef} className="relative">
      {/* Search bar */}
      <div className="fixed left-0 right-0 top-0 z-10 pl-60">
        <div
          className={clsx(
            'sticky top-0 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-mako-50 px-6 shadow transition-colors focus-within:bg-white sm:gap-x-6 dark:border-gray-800 dark:bg-mako-950 focus-within:dark:bg-mako-900'
          )}
        >
          <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
            <div className="relative flex flex-1">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id="search-field"
                className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm dark:text-white"
                placeholder={t('searchbar_placeholder')}
                type="search"
                value={localSearchTerm}
                name="search"
                autoComplete="off"
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex items-center gap-x-4 md:gap-x-6">
              {withShortcuts && (
                <kbd className="hidden items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-sm text-gray-400 lg:inline-flex dark:border-gray-700 dark:bg-mako-800">
                  {isMac ? '⌘' : 'Ctrl+'}K
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search dropdown */}
      <Transition
        show={isDropdownOpen && localSearchTerm.length > 0}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="fixed left-60 right-0 top-16 z-20 px-6 pt-2">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-mako-900 dark:ring-white/10">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {/* No results */}
            {!isLoading && !hasResults && localSearchTerm.length > 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('search_noResults', 'No results found for "{{query}}"', { query: localSearchTerm })}
              </div>
            )}

            {/* Results */}
            {!isLoading && hasResults && (
              <div className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {/* Books section */}
                {hasBooks && (
                  <div>
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-mako-800/80 dark:text-gray-400">
                      {t('search_section_books', 'Books')}
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {searchResults.books.map((book) => (
                        <BookSearchEntry
                          key={book.id}
                          book={book}
                          searchTerm={localSearchTerm}
                          variant="dropdown"
                          onSelect={handleSelectResult}
                        />
                      ))}
                    </div>
                    {searchResults.hasMoreBooks && (
                      <button
                        onClick={handleShowAllBooks}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                      >
                        <span>{t('search_showAll_books', 'Show all books')}</span>
                        <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Collections section */}
                {hasCollections && (
                  <div>
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-mako-800/80 dark:text-gray-400">
                      {t('search_section_collections', 'Collections')}
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {searchResults.collections.map((collection) => (
                        <CollectionSearchEntry
                          key={collection.id}
                          collection={collection}
                          searchTerm={localSearchTerm}
                          variant="dropdown"
                          onSelect={handleSelectResult}
                        />
                      ))}
                    </div>
                    {searchResults.hasMoreCollections && (
                      <button
                        onClick={handleShowAllCollections}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                      >
                        <span>{t('search_showAll_collections', 'Show all collections')}</span>
                        <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  )
}
