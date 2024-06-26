import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../components/LanguageSelector'
import { PageTitle } from '../components/PageTitle'

export const SettingsGeneralView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main>
      <div className="px-8">
        <PageTitle
          title={t('settingsView_title')}
          subtitle={t('settings_subsection_general_title')}
        />
      </div>
      <div className="divide-y divide-white/5">
        <div className="grid grid-cols-3 gap-x-8 gap-y-10 px-8">
          <form className="col-span-2">
            <div className="grid grid-cols-6 gap-x-6 gap-y-8">
              {/*<div className="col-span-3">*/}
              {/*  <TextInput*/}
              {/*    id="first-name"*/}
              {/*    name="first-name"*/}
              {/*    label="First Name"*/}
              {/*    placeholder="Manne"*/}
              {/*    prefix={<FontAwesomeIcon icon={faUser} className="h-4 w-4" />}*/}
              {/*    value=""*/}
              {/*    onChange={() => {}}*/}
              {/*  />*/}
              {/*</div>*/}

              {/*<div className="col-span-3">*/}
              {/*  <TextInput*/}
              {/*    id="last-name"*/}
              {/*    name="last-name"*/}
              {/*    label="Last Name"*/}
              {/*    placeholder="Quinn"*/}
              {/*    value=""*/}
              {/*    onChange={() => {}}*/}
              {/*  />*/}
              {/*</div>*/}

              {/*<div className="col-span-full">*/}
              {/*  <TextInput*/}
              {/*    id="email"*/}
              {/*    name="email"*/}
              {/*    label="Email address"*/}
              {/*    prefix={<FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />}*/}
              {/*    placeholder="janesmith"*/}
              {/*    value="info@example.com"*/}
              {/*    onChange={() => {}}*/}
              {/*  />*/}
              {/*</div>*/}

              {/*<div className="col-span-full">*/}
              {/*  <TextInput*/}
              {/*    id="username"*/}
              {/*    name="username"*/}
              {/*    label="Username"*/}
              {/*    prefix="$"*/}
              {/*    placeholder="janesmith"*/}
              {/*    value="HELLO"*/}
              {/*    onChange={() => {}}*/}
              {/*  />*/}
              {/*</div>*/}

              <div className="col-span-full">
                <LanguageSelector />
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
