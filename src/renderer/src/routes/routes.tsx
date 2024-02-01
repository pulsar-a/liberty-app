import { App } from '@/App'
import { LibraryLayout } from '@/layouts/LibraryLayout'
import { LibraryView } from '@/views/LibraryView'
import { SettingsAboutView } from '@/views/SettingsAboutView'
import { SettingsAppearanceView } from '@/views/SettingsAppearanceView'
import { SettingsGeneralView } from '@/views/SettingsGeneralView'
import { SettingsView } from '@/views/SettingsView'
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { z } from 'zod'
import { BookDetailsView } from '../views/BookDetailsView'
import { MyCollectionsView } from '../views/MyCollectionsView'
import { ReaderView } from '../views/ReaderView'
import { SettingsFilesView } from '../views/SettingsFilesView'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    flyout: boolean
    flyoutSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }
}

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

const rootRoute = createRootRoute({
  component: () => (
    <>
      <App />
      {/*<TanStackRouterDevtools initialIsOpen={false} />*/}
    </>
  ),
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})

const libraryLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: () => <LibraryLayout />,
  pendingComponent: () => <div>Loading...</div>,
  id: 'library-layout',
  staticData: {
    flyout: false,
  },
})

const authorSearchSchema = z.object({
  authorId: z.number().optional().nullable(),
})

const collectionsSearchSchema = z.object({
  collectionId: z.number().optional(),
})

export const libraryRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/',
  component: () => <LibraryView />,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: authorSearchSchema,
  staticData: {
    flyout: false,
  },
})

export const bookDetailsRoute = createRoute({
  getParentRoute: () => libraryRoute,
  path: '/book/$bookId',
  component: () => <BookDetailsView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: true,
    flyoutSize: 'md',
  },
})

export const myCollectionsRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/my-collections',
  component: () => <MyCollectionsView />,
  pendingComponent: () => <div>Loading...</div>,
  validateSearch: collectionsSearchSchema,
  staticData: {
    flyout: false,
  },
})

const readerRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/reader',
  component: () => <ReaderView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  id: 'settings',
  component: () => <SettingsView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsGeneralRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings',
  component: () => <SettingsGeneralView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsAppearanceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/appearance',
  component: () => <SettingsAppearanceView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsReadingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/reading',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsPluginsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/plugins',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsFilesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/files',
  component: () => <SettingsFilesView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})
const settingsAboutRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/about',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <div>Loading...</div>,
  staticData: {
    flyout: false,
  },
})

const routeTree = rootRoute.addChildren([
  libraryLayoutRoute.addChildren([
    libraryRoute.addChildren([bookDetailsRoute]),
    myCollectionsRoute,
    readerRoute,
    settingsRoute.addChildren([
      settingsGeneralRoute,
      settingsAppearanceRoute,
      settingsReadingRoute,
      settingsFilesRoute,
      settingsPluginsRoute,
      settingsAboutRoute,
    ]),
  ]),
])

const history = createHashHistory()

export const router = createRouter({ routeTree, history })

declare module '@tanstack/react-router' {
  interface AppRoutes {
    router: typeof router
  }
}
