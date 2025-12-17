import { BookReference } from '@app-types/reader.types'
import { faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useReaderStore } from '../../store/useReaderStore'

interface ReferencesPanelProps {
  className?: string
  highlightedReferenceId?: string
}

export const ReferencesPanel: React.FC<ReferencesPanelProps> = ({
  className,
  highlightedReferenceId,
}) => {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)

  const { isReferencesPanelOpen, closeReferencesPanel, getCurrentPageReferences } = useReaderStore()

  const references = getCurrentPageReferences()

  // Scroll to highlighted reference when panel opens
  useEffect(() => {
    if (isReferencesPanelOpen && highlightedReferenceId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isReferencesPanelOpen, highlightedReferenceId])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReferencesPanelOpen) {
        closeReferencesPanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isReferencesPanelOpen, closeReferencesPanel])

  if (references.length === 0 && !isReferencesPanelOpen) {
    return null
  }

  return (
    <div
      ref={panelRef}
      className={clsx(
        'references-panel',
        isReferencesPanelOpen && 'references-panel--open',
        className
      )}
      role="complementary"
      aria-label={t('reader_references_panel', 'References')}
    >
      {/* Header */}
      <div className="references-panel__header">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 text-gray-400" />
          <span>
            {t('reader_references_title', 'References')} ({references.length})
          </span>
        </div>
        <button
          onClick={closeReferencesPanel}
          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label={t('close', 'Close')}
        >
          <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="references-panel__content">
        {references.length === 0 ? (
          <p className="py-4 text-center text-gray-500">
            {t('reader_no_references', 'No references on this page')}
          </p>
        ) : (
          <div className="space-y-1">
            {references.map((reference) => (
              <ReferenceItem
                key={reference.id}
                reference={reference}
                isHighlighted={reference.id === highlightedReferenceId}
                ref={reference.id === highlightedReferenceId ? highlightedRef : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ReferenceItemProps {
  reference: BookReference
  isHighlighted?: boolean
}

const ReferenceItem = React.forwardRef<HTMLDivElement, ReferenceItemProps>(
  ({ reference, isHighlighted }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'reference-item',
          isHighlighted && 'rounded-md bg-yellow-100 dark:bg-yellow-900/30'
        )}
      >
        <span className="reference-item__marker">{reference.marker}</span>
        <span className="reference-item__content">{reference.content}</span>
      </div>
    )
  }
)

ReferenceItem.displayName = 'ReferenceItem'

