import { clsx } from 'clsx'
import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

type ButtonProps = {
  label?: string | React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'link'
  shape?: 'tile' | 'rounded' | 'pill' | 'circle'
  disabled?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  isLoading?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  className?: string
  onClick?: () => void
}

export const Button: React.FC<ButtonProps> = ({
  label,
  size = 'md',
  variant = 'primary',
  disabled = false,
  shape = 'tile',
  leadingIcon,
  trailingIcon,
  isLoading = false,
  type = 'button',
  block = false,
  className,
  onClick,
}) => {
  return (
    <>
      <button
        type={type}
        disabled={disabled}
        onClick={!disabled && onClick ? onClick : undefined}
        className={clsx(
          'flex cursor-default justify-center gap-x-1 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
          {
            'rounded-md': shape === 'rounded',
            'rounded-full': ['pill', 'circle'].includes(shape),
            'w-full': block,
          },
          size === 'xs' && (shape === 'circle' ? 'px-1.5 py-1 text-xs' : 'px-2 py-1 text-xs'),
          size === 'sm' && (shape === 'circle' ? 'px-1.5 py-1 text-sm' : 'px-2 py-1 text-sm'),
          size === 'md' && (shape === 'circle' ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-1.5 text-sm'),
          size === 'lg' && (shape === 'circle' ? 'px-2.5 py-2 text-sm' : 'px-3 py-2 text-sm'),
          size === 'xl' && (shape === 'circle' ? 'px-3 py-2.5 text-sm' : 'px-3.5 py-2.5 text-sm'),
          variant === 'primary' &&
            'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500 dark:bg-indigo-500/30 dark:hover:bg-indigo-500/60',
          variant === 'secondary' &&
            'bg-white text-gray-700 hover:bg-gray-200 focus-visible:ring-indigo-500',
          variant === 'danger' &&
            'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
          variant === 'warning' &&
            'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:ring-yellow-500',
          variant === 'success' &&
            'bg-green-600 text-white hover:bg-green-500 focus-visible:ring-green-500',
          variant === 'link' && 'bg-transparent hover:underline focus-visible:ring-indigo-500',
          (isLoading || disabled) &&
            '!hover:bg-gray-300 cursor-not-allowed !bg-gray-400 opacity-80',
          className
        )}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" className={clsx('text-white')} />
        ) : (
          <>
            {leadingIcon && <span className="-ml-0.5 h-5 w-5">{leadingIcon}</span>}
            {label}
            {trailingIcon && <span className="-ml-0.5 h-5 w-5">{trailingIcon}</span>}
          </>
        )}
      </button>
    </>
  )
}
