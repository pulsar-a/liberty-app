import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { clsx } from 'clsx'
import { LanguageSelector } from '../components/LanguageSelector'
import { TextInput } from '../components/TextInput'
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
                      <TextInput
                        id="first-name"
                        name="first-name"
                        label="First Name"
                        placeholder="Manne"
                        prefix={<FontAwesomeIcon icon={faUser} className="w-4 h-4" />}
                        value=""
                        onChange={() => {}}
                      />
                    </div>

                    <div className="col-span-3">
                      <TextInput
                        id="last-name"
                        name="last-name"
                        label="Last Name"
                        placeholder="Quinn"
                        value=""
                        onChange={() => {}}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="email"
                        name="email"
                        label="Email address"
                        prefix={<FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
                        placeholder="janesmith"
                        value="info@example.com"
                        onChange={() => {}}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="username"
                        name="username"
                        label="Username"
                        prefix="$"
                        placeholder="janesmith"
                        value="HELLO"
                        onChange={() => {}}
                      />
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
