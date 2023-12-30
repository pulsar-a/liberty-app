// import { LanguageSelector } from '@/components/LanguageSelector'
// import { useTranslation } from 'react-i18next'

import { clsx } from 'clsx'
import { LanguageSelector } from '../components/LanguageSelector'
import { LayoutThreeSections } from '../layouts/parts/LayoutThreeSections'

export const SettingsView: React.FC = () => {
  // const { t } = useTranslation()

  const sections = [
    { name: 'General', href: '#', current: true },
    { name: 'Appearance', href: '#', current: false },
    { name: 'Reading', href: '#', current: false },
    { name: 'Formats', href: '#', current: false },
    { name: 'Plugins', href: '#', current: false },
    { name: 'About', href: '#', current: false },
  ]

  return (
    <>
      <LayoutThreeSections
        content={
          <main>
            <div className="divide-y divide-white/5">
              <div className="grid gap-x-8 gap-y-10 py-16 grid-cols-3 px-8">
                <form className="col-span-2">
                  <div className="grid gap-x-6 gap-y-8 grid-cols-6">
                    <div className="col-span-3">
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        First name
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="first-name"
                          id="first-name"
                          autoComplete="given-name"
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="col-span-3">
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Last name
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="last-name"
                          id="last-name"
                          autoComplete="family-name"
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Email address
                      </label>
                      <div className="mt-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Username
                      </label>
                      <div className="mt-2">
                        <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                          <span className="flex select-none items-center pl-3 text-gray-400 sm:text-sm">
                            example.com/
                          </span>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            autoComplete="username"
                            className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                            placeholder="janesmith"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <div className="mt-2">
                        <LanguageSelector />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </main>
        }
        sidebar={
          <ul>
            {sections.map((section) => (
              <li
                key={section.name}
                className={clsx(
                  'py-3 px-4 hover:bg-white/15 text-white rounded-md text-sm font-medium',
                  section.current && 'font-semibold bg-white/5 drop-shadow-xl'
                )}
              >
                {section.name}
              </li>
            ))}
          </ul>
        }
      />
    </>
  )
}
