type LayoutThreeSectionsProps = {
  content: React.ReactNode
  sidebar: React.ReactNode
}

export const LayoutThreeSections: React.FC<LayoutThreeSectionsProps> = ({ content, sidebar }) => {
  return (
    <>
      <aside className="fixed inset-y-0 left-60 w-56 pt-28 overflow-y-auto border-r border-gray-200 dark:border-gray-700 px-4 pb-6 block bg-indigo-100 dark:bg-slate-800">
        {sidebar}
      </aside>
      <main className="pl-56">
        <div className="pl-60">
          <div className="py-28 h-dvh pt-18 bg-gray-100 dark:bg-slate-900">{content}</div>
        </div>
      </main>
    </>
  )
}
