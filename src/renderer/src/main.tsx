import { AppRouter } from '@ipc-routes/routes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n/i18n'
import { RouterProvider } from '@tanstack/react-router'
import { createTRPCReact } from '@trpc/react-query'
import { ipcLink } from 'electron-trpc/renderer'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './assets/fonts.css'
import './assets/index.css'
import { router } from './routes/routes'

const trpcReact = createTRPCReact<AppRouter>()

const Main = () => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
    })
  )

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>
      </QueryClientProvider>
    </trpcReact.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Main />)
