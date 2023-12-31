// import { EmptyLayout } from '@/layouts/EmptyLayout'
import { App } from '@/App'
// import { MainLayout } from '@/layouts/MainLayout'
import { LibraryLayout } from '@/layouts/LibraryLayout'
import { LibraryView } from '@/views/LibraryView'
import { SettingsAboutView } from '@/views/SettingsAboutView'
import { SettingsAppearanceView } from '@/views/SettingsAppearanceView'
import { SettingsGeneralView } from '@/views/SettingsGeneralView'
import { SettingsView } from '@/views/SettingsView'
import { RootRoute, Route, Router } from '@tanstack/react-router'

// Devtools
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

// const TanStackRouterDevtools =
//   process.env.NODE_ENV === 'production'
//     ? () => null // Render nothing in production
//     : React.lazy(() =>
//         // Lazy load in development
//         import('@tanstack/router-devtools').then((res) => ({
//           default: res.TanStackRouterDevtools,
//           // For Embedded Mode
//           // default: res.TanStackRouterDevtoolsPanel
//         }))
//       )

const rootRoute = new RootRoute({
  component: () => <App />,
})

// const mainLayoutRoute = new Route({
//   getParentRoute: () => rootRoute,
//   component: () => <MainLayout />,
//   id: 'main-layout',
// })

const libraryLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  component: () => <LibraryLayout />,
  id: 'library-layout',
})
//
// const emptyLayoutRoute = new Route({
//   getParentRoute: () => rootRoute,
//   component: () => <EmptyLayout />,
//   id: 'empty-layout',
// })

const indexRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/',
  component: () => <LibraryView />,
})

const byAuthorsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/by-author',
  component: () => <LibraryView />,
})

const myCollectionsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/my-collections',
  component: () => <LibraryView />,
})

// const settingsRoute = new Route({
//   getParentRoute: () => libraryLayoutRoute,
//   path: '/settings',
//   component: () => <SettingsView />,
// })

/*
{
      name: 'Appearance',
      to: '/settings/appearance',
      current: false,
      id: 'appearance',
    },
    {
      name: 'Reading',
      to: '/settings/reading',
      current: false,
      id: 'reading',
    },
    {
      name: 'Formats',
      to: '/settings/formats',
      current: false,
      id: 'formats',
    },
    {
      name: 'Plugins',
      to: '/settings/plugins',
      current: false,
      id: 'plugins',
    },
    { name: 'About', to: '/settings/about', current: false, id: 'about' },
 */

const settingsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  id: 'settings',
  component: () => <SettingsView />,
})
const settingsGeneralRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings',
  component: () => <SettingsGeneralView />,
})
const settingsAppearanceRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/appearance',
  component: () => <SettingsAppearanceView />,
})
const settingsReadingRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/reading',
  component: () => <SettingsAboutView />,
})
const settingsPluginsRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/plugins',
  component: () => <SettingsAboutView />,
})
const settingsAboutRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/about',
  component: () => <SettingsAboutView />,
})

const routeTree = rootRoute.addChildren([
  libraryLayoutRoute.addChildren([
    indexRoute,
    byAuthorsRoute,
    myCollectionsRoute,
    settingsRoute.addChildren([
      settingsGeneralRoute,
      settingsAppearanceRoute,
      settingsReadingRoute,
      settingsPluginsRoute,
      settingsAboutRoute,
    ]),
  ]),
  // mainLayoutRoute.addChildren([settingsRoute]),
  // emptyLayoutRoute.addChildren([]),
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface AppRoutes {
    router: typeof router
  }
}
