import { Router, Route, RootRoute } from '@tanstack/react-router'
// import { EmptyLayout } from '@/layouts/EmptyLayout'
// import { MainLayout } from '@/layouts/MainLayout'
import { LibraryLayout } from '@/layouts/LibraryLayout'
import { LibraryView } from '@/views/LibraryView'
import { SettingsView } from '@/views/SettingsView'
import { App } from '../App'

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

const settingsRoute = new Route({
  getParentRoute: () => libraryLayoutRoute,
  path: '/settings',
  component: () => <SettingsView />,
})

const routeTree = rootRoute.addChildren([
  libraryLayoutRoute.addChildren([indexRoute, byAuthorsRoute, myCollectionsRoute, settingsRoute]),
  // mainLayoutRoute.addChildren([settingsRoute]),
  // emptyLayoutRoute.addChildren([]),
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface AppRoutes {
    router: typeof router
  }
}
