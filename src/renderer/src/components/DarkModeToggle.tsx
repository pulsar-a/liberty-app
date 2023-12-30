import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { Toggle } from './Toggle'

export const DarkModeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const { getSetting, setSetting } = useSettings()

  useEffect(() => {
    handleModeChange(getSetting('theme') === 'dark')
  }, [])

  const handleModeChange = async (value: boolean) => {
    if (value) {
      document.querySelector('html')?.classList.add('dark')
    } else {
      document.querySelector('html')?.classList.remove('dark')
    }
    setIsDarkMode(value)
    setSetting('theme', value ? 'dark' : 'light')
  }

  return (
    <Toggle
      value={isDarkMode}
      iconOn={<FontAwesomeIcon icon={faMoon} className="h-2 w-2 text-indigo-600" />}
      iconOff={<FontAwesomeIcon icon={faSun} className="h-2 w-2 text-yellow-500" />}
      onChange={handleModeChange}
    />
  )
}
