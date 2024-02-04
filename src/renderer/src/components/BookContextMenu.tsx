import { useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BookEntity from '../../../main/entities/book.entity'
import { ConfirmationDialog } from './ConfirmationDialog'
import { ContextMenu } from './ContextMenu'

type BookContextMenuProps = {
  book: BookEntity
}

export const BookContextMenu: React.FC<BookContextMenuProps> = ({ book }) => {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/' })

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)

  const openBookDetails = async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
    await navigate({
      to: '/book/$bookId',
      params: { bookId: book.id },
      search: { flyout: true },
      mask: { to: '/' },
    })
      .then()
      .catch(console.error)
  }

  const removeBook = async () => {
    console.log('Removing book', book)
  }

  const menuItems = [
    {
      id: `view-details-${book.id}`,
      label: 'View Details',
      onClick: openBookDetails,
    },
    {
      id: `remove-${book.id}`,
      label: 'Remove',
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
