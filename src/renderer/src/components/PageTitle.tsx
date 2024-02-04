type PageTitleProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex items-center justify-between pb-2">
      <h2 className="flex gap-4 text-2xl font-semibold">
        {title}
        <span>.</span>
        {subtitle && (
          <>
            <div className="text-indigo-900/80 dark:text-indigo-300/50">{subtitle}</div>
          </>
        )}
      </h2>
      {actions && <div>{actions}</div>}
    </div>
  )
}

// <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
//   <h3 className="text-base font-semibold leading-6 text-gray-900">Job Postings</h3>
//   <div className="mt-3 sm:ml-4 sm:mt-0">
//     <button
//       type="button"
//       className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//     >
//       Create new job
//     </button>
//   </div>
// </div>
