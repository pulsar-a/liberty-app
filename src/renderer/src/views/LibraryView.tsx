import { LoadingSpinner } from '@/components/LoadingSpinner'
import { TiledBooksList } from '@/components/TiledBooksList'
import { useIpc } from '@/hooks/useIpc'
import { SubmenuEntries } from '@/layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '@/layouts/parts/ThreeSectionsLayout'
import { libraryRoute } from '@/routes/routes'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteEntry } from '../../../../types/router.types'
import BookEntity from '../../../main/entities/book.entity'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()
  const { authorId } = libraryRoute.useSearch()
  const { main } = useIpc()
  const { data: books, isLoading: isBooksLoading } = main.getBooks.useQuery()
  const { data: authors, isLoading: isAuthorsLoading } = main.getAuthors.useQuery()

  const filteredBooks = useMemo<BookEntity[]>((): BookEntity[] => {
    if (!books?.items) {
      return []
    }

    if (!authorId) {
      return books.items as unknown as BookEntity[]
    }

    return books.items.filter((book) =>
      book.authors.some((author) => author.id === authorId)
    ) as unknown as BookEntity[]
  }, [books, authorId])

  const authorRouteEntries: RouteEntry[] = useMemo(() => {
    return (
      authors?.items.map((author) => ({
        id: author.id.toString(),
        name: author.name,
        to: '/',
        search: { authorId: author.id },
      })) || []
    )
  }, [authors])

  const selectedAuthorName = useMemo(() => {
    const author = authors?.items.find((author) => author.id === authorId)
    return author?.name
  }, [authors, authorId])

  const isLoading = isBooksLoading || isAuthorsLoading

  return (
    <>
      <ThreeSectionsLayout
        content={
          <div className="px-4 pb-36 lg:px-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('libraryView_title')}
              </h2>

              {authorId && <h4 className="text-xl">{selectedAuthorName}</h4>}
            </div>
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
            {!isLoading && books && <TiledBooksList books={filteredBooks || []} />}
          </div>
        }
        sidebar={<SubmenuEntries items={authorRouteEntries || []} />}
      />
    </>
  )
}
