import { App } from '@/App'
import { LibraryLayout } from '@/layouts/LibraryLayout'
import { LibraryView } from '@/views/LibraryView'
import { SettingsAboutView } from '@/views/SettingsAboutView'
import { SettingsAppearanceView } from '@/views/SettingsAppearanceView'
import { SettingsGeneralView } from '@/views/SettingsGeneralView'
import { SettingsView } from '@/views/SettingsView'
import { RootRoute, Route, Router } from '@tanstack/react-router'
import { z } from 'zod'
import { MyCollectionsView } from '../views/MyCollectionsView'

// Devtools
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

// export const TanStackRouterDevtools =
//   process.env.NODE_ENV === 'production'
//     ? () => null // Render nothing in production
//     : React.lazy(() =>
//         // Lazy load in development
//         import('@tanstack/router-devtools').then((res) => ({
//           default: res.TanStackRouterDevtools,
//           // For Embedded Mode
//           // default: res.TanStackRouterDevtoolsPanel,
//         }))
//       )

const rootRoute = new RootRoute({
  component: () => (
    <>
      <App />
      {/*<TanStackRouterDevtools initialIsOpen={false} />*/}
    </>
  ),
  pendingComponent: () => <div>Loading...</div>,
})

const libraryLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  component: () => <LibraryLayout />,
  pendingComponent: () => <div>Loading...</div>,
  id: 'library-layout',
})

const authorSearchSchema = z.object({
  authorId: z.number().optional(),
})

const collectionsSearchSchema = z.object({
  collectionId: z.number().optional(),
})

export const libraryRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/',
  component: () => <LibraryView />,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: authorSearchSchema,
})

export const myCollectionsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/my-collections',
  component: () => <MyCollectionsView />,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: collectionsSearchSchema,
})

const settingsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  id: 'settings',
  component: () => <SettingsView />,
  pendingComponent: () => <div>Loading...</div>,
})
const settingsGeneralRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings',
  component: () => <SettingsGeneralView />,
  pendingComponent: () => <div>Loading...</div>,
})
const settingsAppearanceRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/appearance',
  component: () => <SettingsAppearanceView />,
  pendingComponent: () => <div>Loading...</div>,
})
const settingsReadingRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/reading',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
})
const settingsPluginsRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/plugins',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
})
const settingsAboutRoute = new Route({
  getParentRoute: () => settingsRoute,
  path: '/settings/about',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
})

const routeTree = rootRoute.addChildren([
  libraryLayoutRoute.addChildren([
    libraryRoute,
    myCollectionsRoute,
    settingsRoute.addChildren([
      settingsGeneralRoute,
      settingsAppearanceRoute,
      settingsReadingRoute,
      settingsPluginsRoute,
      settingsAboutRoute,
    ]),
  ]),
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface AppRoutes {
    router: typeof router
  }
}
