type LayoutThreeSectionsProps = {
  content: React.ReactNode
  sidebar: React.ReactNode
}

export const LayoutThreeSections: React.FC<LayoutThreeSectionsProps> = ({ content, sidebar }) => {
  return (
    <>
      <main className="pl-56">
        <div className="pl-56">
          <div className="px-8 py-6 bg-white h-dvh -mt-16 pt-24 dark:bg-slate-900">{content}</div>
        </div>
      </main>

      <aside className="fixed bg-white inset-y-0 left-56 w-56 overflow-y-auto border-r border-gray-200 dark:border-gray-700 px-4 py-6 block dark:bg-slate-900">
        {sidebar}
        {/* Secondary column */}
      </aside>
    </>
  )
}
