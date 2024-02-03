import { clsx } from 'clsx'
import { GridLoader } from 'react-spinners'

type LoadingSpinnerProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  full?: boolean
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  block,
  full,
  size = 'sm',
  spacing = 'none',
}) => {
  const sizesMap = {
    sm: 4,
    md: 8,
    lg: 16,
  }
  return (
    <div
      className={clsx(
        block ? 'flex w-full items-center justify-center' : 'inline-block',
        size === 'sm' && 'h-4 w-4',
        size === 'md' && 'h-8 w-8',
        size === 'lg' && 'h-16 w-16',
        spacing === 'none' && 'py-0',
        spacing === 'sm' && 'py-1',
        spacing === 'md' && 'py-2',
        spacing === 'lg' && 'py-4',
        full && 'h-full',
        className
      )}
      role="status"
    >
      <GridLoader color="#1E90FF" size={sizesMap[size]} />
    </div>
  )
}
