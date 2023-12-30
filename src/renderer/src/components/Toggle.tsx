import { clsx } from 'clsx'
import { Switch } from '@headlessui/react'

type ToggleProps = {
  label?: string
  sublabel?: string
  iconOn?: React.ReactNode
  iconOff?: React.ReactNode
  value: boolean
  onChange: (value: boolean) => void
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  sublabel,
  value,
  iconOn,
  iconOff,
  onChange,
}) => {
  return (
    <Switch.Group as="div" className="flex items-center">
      <Switch
        checked={value}
        onChange={onChange}
        className={clsx(
          value ? 'bg-indigo-600' : 'bg-gray-400',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
        )}
      >
        <span
          className={clsx(
            value ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        >
          <span
            className={clsx(
              value ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            {iconOff || null}
          </span>
          <span
            className={clsx(
              value ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
            )}
            aria-hidden="true"
          >
            {iconOn || null}
          </span>
        </span>
      </Switch>
      {label && sublabel && (
        <Switch.Label as="span" className="ml-3 text-sm">
          {label && (
            <span className="font-medium text-gray-900 dark:text-white">Annual billing</span>
          )}{' '}
          {sublabel && <span className="text-gray-500 dark:text-gray-400">(Save 10%)</span>}
        </Switch.Label>
      )}
    </Switch.Group>
  )
}
