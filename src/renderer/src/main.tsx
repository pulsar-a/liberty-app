import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/fonts.css'
import './assets/index.css'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n/i18n.ts'
import { router } from './routes/routes'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </QueryClientProvider>
)
