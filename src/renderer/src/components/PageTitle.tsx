type PageTitleProps = {
  title: string
  subtitle?: string
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle }) => {
  return (
    <h2 className="flex gap-4 pb-8 text-2xl font-semibold">
      {title}
      <span>.</span>
      {subtitle && (
        <>
          <span className="text-gray-600 dark:text-indigo-300/50">{subtitle}</span>
        </>
      )}
    </h2>
  )
}
