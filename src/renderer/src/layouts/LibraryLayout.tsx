import { Outlet } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faHome,
  faUser,
  faCog,
  faBookOpen,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'

const navigation = [
  { name: 'All', to: '/', icon: <FontAwesomeIcon icon={faHome} />, current: true },
  { name: 'Author', to: '/by-author', icon: <FontAwesomeIcon icon={faUser} />, current: false },
  {
    name: 'My Collections',
    to: '/my-collections',
    icon: <FontAwesomeIcon icon={faFolder} />,
    current: false,
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: <FontAwesomeIcon icon={faCog} />,
    current: false,
  },
]
// const userNavigation = [
//   { name: 'settings', to: '/settings' },
//   { name: 'Quit', to: '/' },
// ]

export const LibraryLayout = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div>
        <div className="fixed inset-y-0 left-0 z-50 block w-20 overflow-y-auto bg-gray-900 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-center">
            <FontAwesomeIcon icon={faBookOpen} className="h-8 w-auto" aria-hidden="true" />
          </div>
          <nav className="mt-8">
            <ul role="list" className="flex flex-col items-center space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.to}
                    className={clsx(
                      item.current
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold'
                    )}
                  >
                    {item.icon}
                    <span className="sr-only">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pl-20">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 md:px-8">
            {/*<button*/}
            {/*  type="button"*/}
            {/*  className="-m-2.5 p-2.5 text-gray-700 md:hidden"*/}
            {/*  onClick={() => setSidebarOpen(true)}*/}
            {/*>*/}
            {/*  <span className="sr-only">Open sidebar</span>*/}
            {/*  <FontAwesomeIcon icon={faBars} className="h-6 w-6" aria-hidden="true" />*/}
            {/*</button>*/}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-900/10 md:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
              <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder="Search..."
                  type="search"
                  name="search"
                />
              </form>
              <div className="flex items-center gap-x-4 md:gap-x-6">
                {/* Notification button */}
                {/*<button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">*/}
                {/*  <span className="sr-only">View notifications</span>*/}
                {/*  <FontAwesomeIcon icon={faBell} className="h-6 w-6" aria-hidden="true" />*/}
                {/*</button>*/}

                {/* Separator */}
                <div className="block h-6 w-px bg-gray-900/10" aria-hidden="true" />

                {/* Profile dropdown */}
                {/*<Menu as="div" className="relative">*/}
                {/*  <Menu.Button className="-m-1.5 flex items-center p-1.5">*/}
                {/*    <span className="sr-only">Open user menu</span>*/}
                {/*    <img*/}
                {/*      className="h-8 w-8 rounded-full bg-gray-50"*/}
                {/*      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"*/}
                {/*      alt=""*/}
                {/*    />*/}
                {/*    <span className="hidden md:flex md:items-center">*/}
                {/*      <span*/}
                {/*        className="ml-4 text-sm font-semibold leading-6 text-gray-900"*/}
                {/*        aria-hidden="true"*/}
                {/*      >*/}
                {/*        Tom Cook*/}
                {/*      </span>*/}
                {/*      <FontAwesomeIcon*/}
                {/*        icon={faChevronDown}*/}
                {/*        className="ml-2 h-5 w-5 text-gray-400"*/}
                {/*        aria-hidden="true"*/}
                {/*      />*/}
                {/*    </span>*/}
                {/*  </Menu.Button>*/}
                {/*  <Transition*/}
                {/*    as={Fragment}*/}
                {/*    enter="transition ease-out duration-100"*/}
                {/*    enterFrom="transform opacity-0 scale-95"*/}
                {/*    enterTo="transform opacity-100 scale-100"*/}
                {/*    leave="transition ease-in duration-75"*/}
                {/*    leaveFrom="transform opacity-100 scale-100"*/}
                {/*    leaveTo="transform opacity-0 scale-95"*/}
                {/*  >*/}
                {/*    <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">*/}
                {/*      {userNavigation.map((item) => (*/}
                {/*        <Menu.Item key={item.name}>*/}
                {/*          {({ active }) => (*/}
                {/*            <a*/}
                {/*              href={item.to}*/}
                {/*              className={clsx(*/}
                {/*                active ? 'bg-gray-50' : '',*/}
                {/*                'block px-3 py-1 text-sm leading-6 text-gray-900'*/}
                {/*              )}*/}
                {/*            >*/}
                {/*              {item.name}*/}
                {/*            </a>*/}
                {/*          )}*/}
                {/*        </Menu.Item>*/}
                {/*      ))}*/}
                {/*    </Menu.Items>*/}
                {/*  </Transition>*/}
                {/*</Menu>*/}
              </div>
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </>
  )
}
