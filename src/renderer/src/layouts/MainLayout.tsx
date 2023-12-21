import { Outlet } from '@tanstack/react-router'
import React from 'react'
import { Header } from './parts/Header'

type Props = {
  children?: React.ReactNode
}

export const MainLayout: React.FC<Props> = () => {
  return (
    <div>
      <Header />
      <div>
        <Outlet />
      </div>
    </div>
  )
}
