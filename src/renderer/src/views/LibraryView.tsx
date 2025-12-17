import { useIpc } from '@/hooks/useIpc'
import { libraryRoute } from '@/routes/routes'
import {
  faBars,
  faPlusCircle as faPlus,
  faTableCellsLarge,
} from '@fortawesome/free-solid-svg-icons'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteEntry } from '../../../../types/router.types'
import BookEntity from '../../../main/entities/book.entity'
import { BooksGrid } from '../components/BooksGrid'
import { BooksList } from '../components/BooksList'
import { Button } from '../components/Button'
import { ButtonGroup } from '../components/ButtonGroup'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageTitle } from '../components/PageTitle'
import { TextInput } from '../components/TextInput'
import { useSettings } from '../hooks/useSettings'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()
  const { getSetting, setSetting } = useSettings()
  const { authorId } = libraryRoute.useSearch()
  const { main } = useIpc()
  const { data: books, isLoading: isBooksLoading } = main.getBooks.useQuery(undefined, {
    queryKey: ['getBooks', undefined],
    suspense: true,
  })
  const { data: authors, isLoading: isAuthorsLoading } = main.getAuthors.useQuery(undefined, {
    queryKey: ['getAuthors', undefined],
    suspense: true,
  })
  console.log('RENDER: LibraryView')

  const utils = main.useUtils()
  const [authorSearchTerm, setAuthorSearchTerm] = useState<string>('')
  const [listStyle, setListStyle] = useState<'grid' | 'list'>(
    getSetting('libraryViewStyle', 'grid') as 'grid' | 'list'
  )

  const updateListStyle = (value: 'grid' | 'list') => {
    setListStyle(value)
    setSetting('libraryViewStyle', value)
  }

  const mutation = main.addBooks.useMutation({
    onSettled: () => {
      utils.invalidate(undefined, {
        queryKey: ['getBooks', undefined],
      })
    },
  })

  const filteredBooks = ((): BookEntity[] => {
    if (!books?.items) {
      return []
    }

    if (authorId === undefined) {
      return books.items as unknown as BookEntity[]
    }

    return books.items.filter((book) => {
      // Books without author
      if (book.authors.length === 0 && authorId === null) {
        return true
      }

      // Search by author
      return book.authors.some((author) => author.id === authorId)
    }) as unknown as BookEntity[]
  })()

  const booksWithoutAuthorCount = useMemo(() => {
    return books?.items.filter((book) => book.authors.length === 0).length || 0
  }, [books])

  const authorRouteEntries: RouteEntry[] = useMemo(() => {
    const isSearching = authorSearchTerm.trim().length > 0

    return [
      // "All books" entry - hidden when searching
      ...(!isSearching
        ? [
            {
              id: 'all-books',
              name: t('libraryView_allBooks_label'),
              to: '/',
              active: authorId === undefined,
              search: {},
              count: books?.items.length || 0,
            } as RouteEntry,
          ]
        : []),
      // "No author" entry for books without authors
      ...(booksWithoutAuthorCount > 0
        ? [
            {
              id: 'no-author',
              name: t('libraryView_noAuthor_label'),
              to: '/',
              active: authorId === null,
              search: { authorId: null },
              count: booksWithoutAuthorCount,
            } as RouteEntry,
          ]
        : []),
    ].concat(
      authors?.items
        .filter((author) => {
          return (
            authorSearchTerm.toLowerCase() === '' ||
            author.name.toLowerCase().includes(authorSearchTerm.toLowerCase())
          )
        })
        .map((author) => ({
          id: author.id.toString(),
          name: author.name,
          active: authorId === author.id,
          to: '/',
          search: { authorId: author.id },
          count: author.booksCount,
        })) || []
    )
  }, [authors, authorSearchTerm, books, authorId, booksWithoutAuthorCount])

  const selectedAuthorName = useMemo(() => {
    if (authorId === null) {
      return `${t('libraryView_noAuthor_label')} (${booksWithoutAuthorCount})`
    }

    const author = authors?.items.find((author) => author.id === authorId)
    if (author) {
      return `${author.name} (${author.booksCount})`
    }
    return undefined
  }, [authors, authorId, booksWithoutAuthorCount])

  const isLoading = isBooksLoading || isAuthorsLoading

  const addBook = async () => {
    mutation.mutate()
  }

  return (
    <>
      <ThreeSectionsLayout
        content={
          <div className="max-w-full px-4 pb-36 lg:px-8">
            <PageTitle
              title={t('libraryView_title')}
              subtitle={selectedAuthorName}
              actions={
                <ButtonGroup
                  items={[
                    {
                      icon: faTableCellsLarge,
                      active: listStyle === 'grid',
                      onClick: () => updateListStyle('grid'),
                    },
                    {
                      icon: faBars,
                      active: listStyle === 'list',
                      onClick: () => updateListStyle('list'),
                    },
                  ]}
                />
              }
            />
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {listStyle === 'grid' && !isLoading && books && (
              <BooksGrid books={filteredBooks || []} />
            )}
            {listStyle === 'list' && !isLoading && books && (
              <BooksList books={filteredBooks || []} />
            )}
          </div>
        }
        sidebarTop={
          <div className="px-2">
            <Button
              label={t('libraryView_addBooks_button')}
              leadingIcon={faPlus}
              variant="primary"
              shape="rounded"
              block
              size="xl"
              onClick={addBook}
            />
            <TextInput
              value={authorSearchTerm}
              placeholder={t('libraryView_filterAuthors_placeholder')}
              className="mt-8"
              onChange={setAuthorSearchTerm}
            />
          </div>
        }
        sidebar={
          <div className="px-2 pb-8 pt-3">
            <SubmenuEntries className="pt-4" items={authorRouteEntries || []} />
          </div>
        }
      />
    </>
  )
}
