import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface ReaderLoadingProgressProps {
  percent: number
  stage: string
  className?: string
}

/**
 * Circular progress indicator for book loading.
 * Shows the loading percentage in the center with the current stage below.
 */
export const ReaderLoadingProgress: React.FC<ReaderLoadingProgressProps> = ({
  percent,
  stage,
  className,
}) => {
  const { t } = useTranslation()

  // SVG circle parameters
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, percent))
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Translate the stage key if provided
  const stageText = stage ? t(stage, stage) : t('reader_loading', 'Loading book...')

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      {/* Circular progress */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-indigo-500 transition-all duration-300 ease-out dark:text-indigo-400"
          />
        </svg>

        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Stage text */}
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {stageText}
      </p>
    </div>
  )
}

