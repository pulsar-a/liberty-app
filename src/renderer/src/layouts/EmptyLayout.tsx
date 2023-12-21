import { Outlet } from '@tanstack/react-router'
import React from 'react'

type Props = {
  children?: React.ReactNode
}

export const EmptyLayout: React.FC<Props> = () => {
  return (
    <div>
      <Outlet />
    </div>
  )
}
