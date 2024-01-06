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
      <aside className="dark:bg-bright-gray-950 fixed inset-y-0 left-60 mt-16 flex h-[calc(100dvh-65px)] w-56 flex-col border-r border-gray-300 bg-indigo-100 dark:border-gray-800">
        {sidebarTop && (
          <div className="sticky left-0 right-0 top-0 z-10 bg-indigo-100 py-2 shadow dark:bg-indigo-950/25">
            {sidebarTop}
          </div>
        )}
        <div className="shrink grow overflow-y-auto">{sidebar}</div>
      </aside>
      <main className="pl-56 pt-16">
        <div className="pl-60">
          <div className="relative h-[calc(100dvh-65px)] overflow-y-auto bg-indigo-200/30 pt-8 shadow-inner dark:bg-indigo-400/10">
            {content}
          </div>
        </div>
      </main>
    </>
  )
}
