import { clsx } from 'clsx'

type LoadingSpinnerProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 'md' }) => {
  return (
    <div
      className={clsx(
        'text-primary inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        size === 'sm' && 'h-4 w-4 border-2',
        size === 'md' && 'h-8 w-8 border-4',
        size === 'lg' && 'h-16 w-16 border-8',
        className
      )}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  )
}
