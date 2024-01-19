export type LoadingStatusItem = {
  id: string | number
  label: string
  subLabel?: string
  status: 'loading' | 'success' | 'error'
}
