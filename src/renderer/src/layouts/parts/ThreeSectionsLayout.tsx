import { Outlet, useMatches, useRouter } from '@tanstack/react-router'
import React, { Suspense, useEffect, useState } from 'react'
import { Flyout } from '../../components/Flyout'
import { LoadingSpinner } from '../../components/LoadingSpinner'

type LayoutThreeSectionsProps = {
  content: React.ReactNode
  sidebar: React.ReactNode
  sidebarTop?: React.ReactNode
}

export const ThreeSectionsLayout: React.FC<LayoutThreeSectionsProps> = ({
  content,
  sidebar,
  sidebarTop,
}) => {
  const router = useRouter()
  const onBack = () => router.history.back()

  const shouldBeFlyout = useMatches({
    select: (matches) => {
      return matches[matches.length - 1]?.staticData?.flyout || false
    },
  })

  const flyoutSize = useMatches({
    select: (matches) => {
      return matches[matches.length - 1]?.staticData?.flyoutSize
    },
  })

  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false)

  useEffect(() => {
    setFlyoutOpen(!!shouldBeFlyout)
  }, [shouldBeFlyout])
  // navigate({ to: '/posts/$postId', params: { postId } })
  return (
    <>
      <Flyout open={isFlyoutOpen} size={flyoutSize} onClose={() => onBack()}>
        <Suspense fallback={<LoadingSpinner size="lg" block full spacing="lg" />}>
          <Outlet />
        </Suspense>
      </Flyout>
      <aside className="fixed bottom-7 left-60 top-16 flex w-56 flex-col border-r border-gray-300 bg-indigo-100 dark:border-gray-800 dark:bg-bright-gray-950">
        {sidebarTop && (
          <div className="sticky left-0 right-0 top-0 z-10 bg-indigo-100 py-2 shadow dark:bg-bright-gray-950">
            {sidebarTop}
          </div>
        )}
        <div className="shrink grow overflow-y-auto">{sidebar}</div>
      </aside>
      <main className="fixed bottom-7 left-[calc(15rem+14rem)] right-0 top-16 overflow-hidden">
        <div className="relative h-full max-w-full overflow-y-auto bg-indigo-200/30 pt-8 shadow-inner dark:bg-indigo-400/10">
          {content}
        </div>
      </main>
    </>
  )
}
