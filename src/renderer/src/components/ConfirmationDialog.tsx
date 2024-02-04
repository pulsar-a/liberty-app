import { faCircleCheck, faClose } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { DialogWindow } from './DialogWindow'

type ConfirmationDialogProps = {
  open: boolean
  onClose: () => void | Promise<void>
  onConfirm: () => void | Promise<void>
  persistent?: boolean
  title: string
  message: string
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  persistent,
  title,
  message,
}) => {
  const { t } = useTranslation()
  const assertPersistentClose = async () => {
    if (persistent) {
      return
    }

    await onClose()
  }

  return (
    <DialogWindow open={open} persistent={persistent} onClose={assertPersistentClose}>
      <div className="flex flex-col space-y-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
        <div className="flex w-full justify-end space-x-4">
          <Button
            label={t('no')}
            variant="ghost"
            onClick={onClose}
            shape="rounded"
            size="lg"
            leadingIcon={faClose}
            className="min-w-24"
          />
          <Button
            label={t('yes')}
            variant="danger"
            onClick={onConfirm}
            shape="rounded"
            size="lg"
            leadingIcon={faCircleCheck}
            className="min-w-24"
          />
        </div>
      </div>
    </DialogWindow>
  )
}
