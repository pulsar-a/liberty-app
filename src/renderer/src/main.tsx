import React from 'react'
import ReactDOM from 'react-dom/client'
import '@radix-ui/themes/styles.css'
import './assets/fonts.css'
import './assets/index.css'
import { Theme } from '@radix-ui/themes'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <App />
    </Theme>
  </React.StrictMode>
)
