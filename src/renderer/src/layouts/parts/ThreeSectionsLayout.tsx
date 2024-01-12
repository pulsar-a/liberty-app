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
  return (
    <>
      <aside className="fixed inset-y-0 left-60 mt-16 flex h-[calc(100dvh-65px)] w-56 flex-col border-r border-gray-300 bg-indigo-100 dark:border-gray-800 dark:bg-bright-gray-950">
        {sidebarTop && (
          <div className="sticky left-0 right-0 top-0 z-10 bg-indigo-100 py-2 shadow dark:bg-bright-gray-950">
            {sidebarTop}
          </div>
        )}
        <div className="shrink grow overflow-y-auto">{sidebar}</div>
      </aside>
      <main className="pl-56 pt-14">
        <div className="pl-60">
          <div className="relative h-[calc(100dvh-65px)] max-w-full overflow-y-auto bg-indigo-200/30 pt-8 shadow-inner dark:bg-indigo-400/10">
            {content}
          </div>
        </div>
      </main>
    </>
  )
}
