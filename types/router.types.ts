import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type RouteEntry = {
  id: string | number
  to?: string
  fn?: () => void
  params?: Record<string, string>
  search?: Record<string, string | number>
  name: string
  disabled?: boolean
  icon?: IconDefinition
  hash?: string
  children?: RouteEntry[]
}
