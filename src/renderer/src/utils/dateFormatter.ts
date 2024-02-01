import { format, formatDistanceToNowStrict } from 'date-fns'
//Formats date with date-fns
export const formatDateShort = (date: Date): string => {
  return format(date, 'PP')
}

export const formatDateDistance = (date: Date): string => {
  return formatDistanceToNowStrict(date, { addSuffix: true })
}
