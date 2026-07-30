import { faBookOpen, faEye, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { BookSummary } from '@app-types/books.types'
import { useLocation, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIpc } from '../hooks/useIpc'
import { useSettings } from '../hooks/useSettings'
import { ConfirmationDialog } from './ConfirmationDialog'
import { ContextMenu } from './ContextMenu'

type BookContextMenuProps = {
  book: BookSummary
}

export const BookContextMenu: React.FC<BookContextMenuProps> = ({ book }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { main } = useIpc()
  const { getSetting, setSetting } = useSettings()
  const utils = main.useUtils()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)

  const openBookDetails = async () => {
    // Wait for the dropdown to close before opening the book details. Otherwise, flyout won't show.
    await new Promise((resolve) => setTimeout(resolve, 50))
    await navigate({
      search: { ...location.search, bookId: book.id },
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

  const requestBookDeletion = () => {
    const confirmDelete = getSetting('confirmDeleteBook', true)
    if (confirmDelete) {
      setShowDeleteConfirmation(true)
    } else {
      removeBook()
    }
  }

  const handleNeverAskBeforeDeletingBook = (value: boolean) => {
    if (value) {
      setSetting('confirmDeleteBook', false)
    }
  }

  const readBook = async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    await navigate({
      to: '/reader/$bookId',
      params: { bookId: book.id.toString() },
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
      disabled: !book.hasReadableFile,
    },
    { id: `separator-${book.id}`, separator: true },
    {
      id: `remove-${book.id}`,
      icon: faTrash,
      label: t('delete'),
      onClick: requestBookDeletion,
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
        showNeverAskAgain
        onNeverAskAgainChange={handleNeverAskBeforeDeletingBook}
      />
      <ContextMenu items={menuItems} />
    </>
  )
}
