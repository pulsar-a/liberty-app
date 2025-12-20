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
// Devtools
import { z } from 'zod'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { MyCollectionsView } from '../views/MyCollectionsView'
import { ReaderView } from '../views/ReaderView'
import { SearchView } from '../views/SearchView'
import { WasmReaderView } from '../views/WasmReaderView'
import { SettingsFilesView } from '../views/SettingsFilesView'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    flyout: boolean
    flyoutSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }
}

// Global search schema with bookId for the flyout
const globalSearchSchema = z.object({
  bookId: z.number().optional(),
})
//
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
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})

export const libraryLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: () => <LibraryLayout />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  id: 'library-layout',
  validateSearch: globalSearchSchema,
  staticData: {
    flyout: false,
  },
})

const authorSearchSchema = z.object({
  authorId: z.number().optional().nullable(),
})

const collectionsSearchSchema = z.object({
  collectionId: z.union([z.number(), z.literal('favorites')]).optional(),
})

export const libraryRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/',
  component: () => <LibraryView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  validateSearch: authorSearchSchema,
  staticData: {
    flyout: false,
  },
})

export const myCollectionsRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/my-collections',
  component: () => <MyCollectionsView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  validateSearch: collectionsSearchSchema,
  staticData: {
    flyout: false,
  },
})

export const searchRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/search',
  component: () => <SearchView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})

export const readerRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/reader/$bookId',
  component: () => <ReaderView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})

// WASM-based reader route (experimental)
export const wasmReaderRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  path: '/reader-wasm/$bookId',
  component: () => <WasmReaderView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})

const settingsRoute = createRoute({
  getParentRoute: () => libraryLayoutRoute,
  id: 'settings',
  component: () => <SettingsView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsGeneralRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings',
  component: () => <SettingsGeneralView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsAppearanceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/appearance',
  component: () => <SettingsAppearanceView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsReadingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/reading',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsPluginsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/plugins',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsFilesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/files',
  component: () => <SettingsFilesView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})
const settingsAboutRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/settings/about',
  component: () => <SettingsAboutView />,
  pendingComponent: () => <LoadingSpinner size="lg" block full spacing="lg" />,
  staticData: {
    flyout: false,
  },
})

const routeTree = rootRoute.addChildren([
  libraryLayoutRoute.addChildren([
    libraryRoute,
    myCollectionsRoute,
    searchRoute,
    readerRoute,
    wasmReaderRoute,
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

export const router = createRouter({
  routeTree,
  history,
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface AppRoutes {
    router: typeof router
  }
}
