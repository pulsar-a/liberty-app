import { LoadingSpinner } from '@/components/LoadingSpinner'
import { TiledBooksList } from '@/components/TiledBooksList'
import { useIpc } from '@/hooks/useIpc'
import { SubmenuEntries } from '@/layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '@/layouts/parts/ThreeSectionsLayout'
import { libraryRoute } from '@/routes/routes'
import { faPlusCircle as faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Outlet } from '@tanstack/react-router'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteEntry } from '../../../../types/router.types'
import BookEntity from '../../../main/entities/book.entity'
import { Button } from '../components/Button'
import { PageTitle } from '../components/PageTitle'
import { TextInput } from '../components/TextInput'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()
  const { authorId } = libraryRoute.useSearch()
  const { main } = useIpc()
  const { data: books, isLoading: isBooksLoading } = main.getBooks.useQuery(undefined, {
    queryKey: ['getBooks', undefined],
  })
  const { data: authors, isLoading: isAuthorsLoading } = main.getAuthors.useQuery()
  const utils = main.useUtils()
  const [authorSearchTerm, setAuthorSearchTerm] = useState<string>('')

  const mutation = main.addBooks.useMutation({
    onSettled: () => {
      utils.invalidate(undefined, {
        queryKey: ['getBooks', undefined],
      })
    },
  })

  const filteredBooks = useMemo<BookEntity[]>((): BookEntity[] => {
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
  }, [books, authorId])

  const authorRouteEntries: RouteEntry[] = useMemo(() => {
    return [
      {
        id: 'no-author',
        name: t('libraryView_noAuthor_label'),
        to: '/',
        search: { authorId: null },
      } as RouteEntry,
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
          to: '/',
          search: { authorId: author.id },
        })) || []
    )
  }, [authors, authorSearchTerm])

  const selectedAuthorName = useMemo(() => {
    const author = authors?.items.find((author) => author.id === authorId)
    return author?.name
  }, [authors, authorId])

  const isLoading = isBooksLoading || isAuthorsLoading

  const addBook = async () => {
    mutation.mutate()
  }

  return (
    <>
      <Outlet />
      <ThreeSectionsLayout
        content={
          <div className="max-w-full px-4 pb-36 lg:px-8">
            <PageTitle title={t('libraryView_title')} subtitle={selectedAuthorName} />
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
            {!isLoading && books && <TiledBooksList books={filteredBooks || []} />}
          </div>
        }
        sidebarTop={
          <div className="px-2">
            <Button
              label={t('libraryView_addBooks_button')}
              leadingIcon={<FontAwesomeIcon icon={faPlus} />}
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
