import { faCircleCheck, faClose } from '@fortawesome/free-solid-svg-icons'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { DialogWindow } from './DialogWindow'

type ConfirmationDialogProps = {
  open: boolean
  onClose: () => void | Promise<void>
  onConfirm: () => void | Promise<void>
  persistent?: boolean
  title: string
  message: string | React.ReactNode
  showNeverAskAgain?: boolean
  onNeverAskAgainChange?: (value: boolean) => void
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  persistent,
  title,
  message,
  showNeverAskAgain = false,
  onNeverAskAgainChange,
}) => {
  const { t } = useTranslation()
  const [neverAskAgain, setNeverAskAgain] = useState(false)

  const assertPersistentClose = async () => {
    if (persistent) {
      return
    }

    await onClose()
  }

  const handleConfirm = async () => {
    if (neverAskAgain && onNeverAskAgainChange) {
      onNeverAskAgainChange(true)
    }
    await onConfirm()
    setNeverAskAgain(false)
  }

  const handleClose = async () => {
    setNeverAskAgain(false)
    await onClose()
  }

  return (
    <DialogWindow open={open} persistent={persistent} onClose={assertPersistentClose}>
      <div className="flex flex-col space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
        
        {showNeverAskAgain && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={neverAskAgain}
              onChange={(e) => setNeverAskAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            {t('confirmationDialog_neverAskAgain', 'Never ask again')}
          </label>
        )}

        <div className="flex w-full justify-end space-x-4">
          <Button
            label={t('no')}
            variant="ghost"
            onClick={handleClose}
            shape="rounded"
            size="lg"
            leadingIcon={faClose}
            className="min-w-24"
          />
          <Button
            label={t('yes')}
            variant="danger"
            onClick={handleConfirm}
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
