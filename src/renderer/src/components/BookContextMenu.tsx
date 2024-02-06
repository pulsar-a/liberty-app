import { faBookOpen, faEye, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useNavigate, useRouter } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BookEntity from '../../../main/entities/book.entity'
import { useIpc } from '../hooks/useIpc'
import { ConfirmationDialog } from './ConfirmationDialog'
import { ContextMenu } from './ContextMenu'

type BookContextMenuProps = {
  book: BookEntity
}

export const BookContextMenu: React.FC<BookContextMenuProps> = ({ book }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const location = router.parseLocation()
  const navigate = useNavigate()
  const { main } = useIpc()
  const utils = main.useUtils()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)

  const openBookDetails = async () => {
    // Wait for the dropdown to close before opening the book details. Otherwise, flyout won't show.
    await new Promise((resolve) => setTimeout(resolve, 50))
    await navigate({
      to: '/book/$bookId',
      params: { bookId: book.id },
      search: { flyout: true, ...location.search },
    })
  }

  const removeMutation = main.removeBookById.useMutation({
    onSettled: async () => {
      await navigate({ to: '/', search: { ...location.search } })
      utils.invalidate(undefined, {
        queryKey: ['getBooks', undefined],
      })
    },
  })

  const removeBook = async () => {
    return removeMutation.mutate({ id: book.id })
  }

  const readBook = async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    await navigate({
      to: '/reader',
    })
  }

  const menuItems = [
    {
      id: `view-details-${book.id}`,
      icon: faEye,
      label: t('libraryView_bookContextMenu_viewDetails_label'),
      onClick: openBookDetails,
    },
    {
      id: `read-${book.id}`,
      icon: faBookOpen,
      label: t('libraryView_bookContextMenu_read_label'),
      onClick: readBook,
    },
    { id: `separator-${book.id}`, separator: true },
    {
      id: `remove-${book.id}`,
      icon: faTrash,
      label: t('delete'),
      onClick: () => setShowDeleteConfirmation(true),
    },
  ]

  return (
    <>
      <ConfirmationDialog
        title={t('bookDetailsView_bookDeleteConfirmation_title')}
        message={t('bookDetailsView_bookDeleteConfirmation_message')}
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={removeBook}
      />
      <ContextMenu items={menuItems} />
    </>
  )
}
