import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'true':
      return 'text-green-500'
    case 'false':
      return 'text-red-500'
    case 'misleading':
      return 'text-yellow-500'
    case 'unverified':
      return 'text-gray-500'
    case 'satire':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

export function getVerdictBadgeColor(verdict: string) {
  switch (verdict) {
    case 'true':
      return 'bg-green-500/20 text-green-500'
    case 'false':
      return 'bg-red-500/20 text-red-500'
    case 'misleading':
      return 'bg-yellow-500/20 text-yellow-500'
    case 'unverified':
      return 'bg-gray-500/20 text-gray-500'
    case 'satire':
      return 'bg-purple-500/20 text-purple-500'
    default:
      return 'bg-gray-500/20 text-gray-500'
  }
}

export function getRiskLevelColor(level: string) {
  switch (level) {
    case 'critical':
      return 'text-red-600'
    case 'high':
      return 'text-orange-500'
    case 'medium':
      return 'text-yellow-500'
    case 'low':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}
