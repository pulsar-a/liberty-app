import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { LanguageSelector } from '../components/LanguageSelector'
import { TextInput } from '../components/TextInput'
import { LayoutThreeSections } from '../layouts/parts/LayoutThreeSections'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'

export const SettingsView: React.FC = () => {
  // const { t } = useTranslation()

  const sections = [
    { name: 'General', to: '#', current: true, id: 'general' },
    { name: 'Appearance', to: '#', current: false, id: 'appearance' },
    { name: 'Reading', to: '#', current: false, id: 'reading' },
    { name: 'Formats', to: '#', current: false, id: 'formats' },
    { name: 'Plugins', to: '#', current: false, id: 'plugins' },
    { name: 'About', to: '#', current: false, id: 'about' },
  ]

  return (
    <>
      <LayoutThreeSections
        content={
          <main>
            <div className="divide-y divide-white/5">
              <div className="grid gap-x-8 gap-y-10 grid-cols-3 px-8">
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
        sidebar={<SubmenuEntries items={sections} />}
      />
    </>
  )
}
