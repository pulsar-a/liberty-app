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
      <aside className="fixed inset-y-0 left-60 mt-16 flex h-[calc(100dvh-65px)] w-56 flex-col border-r border-gray-200 bg-indigo-100 dark:border-gray-700 dark:bg-slate-800">
        {sidebarTop && (
          <div className="sticky left-0 right-0 top-0 z-10 bg-indigo-100 py-2 shadow dark:bg-slate-800">
            {sidebarTop}
          </div>
        )}
        <div className="shrink grow overflow-y-auto">{sidebar}</div>
      </aside>
      <main className="pl-56 pt-16">
        <div className="pl-60">
          <div className="relative h-[calc(100dvh-65px)] overflow-y-auto bg-slate-300 pt-8 dark:bg-slate-900">
            {content}
          </div>
        </div>
      </main>
    </>
  )
}
