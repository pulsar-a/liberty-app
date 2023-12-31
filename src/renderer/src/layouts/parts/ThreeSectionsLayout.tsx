type LayoutThreeSectionsProps = {
  content: React.ReactNode
  sidebar: React.ReactNode
}

export const ThreeSectionsLayout: React.FC<LayoutThreeSectionsProps> = ({ content, sidebar }) => {
  return (
    <>
      <aside className="fixed inset-y-0 left-60 block w-56 overflow-y-auto border-r border-gray-200 bg-indigo-100 px-2 pb-6 pt-28 dark:border-gray-700 dark:bg-slate-800">
        {sidebar}
      </aside>
      <main className="pl-56">
        <div className="pl-60">
          <div className="pt-18 h-dvh bg-gray-100 py-28 dark:bg-slate-900">{content}</div>
        </div>
      </main>
    </>
  )
}
