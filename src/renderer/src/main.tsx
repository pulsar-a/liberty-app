import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/fonts.css'
import './assets/index.css'
import { RouterProvider } from '@tanstack/react-router'
import './i18n/i18n.ts'
import { router } from './routes/routes'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

window.api.setTitle('HOHOHO')
