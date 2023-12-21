import { Link, Outlet } from '@tanstack/react-router'
import React from 'react'

type Props = {
  children?: React.ReactNode
}

export const MainLayout: React.FC<Props> = () => {
  return (
    <div>
      <div>Liberty E-Book App</div>
      <div>
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
