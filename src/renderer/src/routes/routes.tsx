import { Router, Route, RootRoute } from '@tanstack/react-router'
import { EmptyLayout } from '../layouts/EmptyLayout'
import { MainLayout } from '../layouts/MainLayout'

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

const rootRoute = new RootRoute()

const mainLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  component: () => <MainLayout />,
  id: 'main-layout',
})

const emptyLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  component: () => <EmptyLayout />,
  id: 'empty-layout',
})

const indexRoute = new Route({
  getParentRoute: () => mainLayoutRoute,
  path: '/',
  component: function Index() {
    return (
      <div className="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})

const aboutRoute = new Route({
  getParentRoute: () => emptyLayoutRoute,
  path: '/about',
  component: function About() {
    return <div className="p-2">Hello from About!</div>
  },
})

const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([indexRoute]),
  emptyLayoutRoute.addChildren([aboutRoute]),
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
