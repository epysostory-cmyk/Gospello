import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).substring(2, 7)
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Lagos',
    ...options,
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  })
}

export function isThisWeekend(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  friday.setHours(0, 0, 0, 0)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)
  sunday.setHours(23, 59, 59, 999)
  return date >= friday && date <= sunday
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(now.getDate() + 7)
  return date >= now && date <= weekFromNow
}

export const CATEGORY_LABELS: Record<string, string> = {
  worship:    'Worship Nights',
  prayer:     'Prayer Events',
  conference: 'Conferences',
  youth:      'Youth Programs',
  training:   'Training',
  concerts:   'Concerts',
  crusades:   'Crusades',
  podcasts:   'Podcasts',
  other:      'Other',
}

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
]

export const COUNTRY_LIST = [
  // Africa
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Cameroon',
  'Zimbabwe',
  'Zambia',
  'Botswana',
  'Ivory Coast',
  'Ethiopia',
  'Egypt',
  'Morocco',
  'Senegal',
  // Europe
  'United Kingdom',
  'France',
  'Germany',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Norway',
  'Denmark',
  'Spain',
  'Italy',
  'Ireland',
  'Portugal',
  // Americas
  'United States',
  'Canada',
  'Brazil',
  'Jamaica',
  'Trinidad & Tobago',
  'Barbados',
  // Middle East
  'United Arab Emirates',
  'Saudi Arabia',
  'Israel',
  // Asia
  'Singapore',
  'Malaysia',
  'India',
  // Oceania
  'Australia',
  'New Zealand',
] as const

export type Country = typeof COUNTRY_LIST[number]

export const CATEGORY_COLORS: Record<string, string> = {
  worship:    'bg-purple-100 text-purple-800',
  prayer:     'bg-blue-100 text-blue-800',
  conference: 'bg-amber-100 text-amber-800',
  youth:      'bg-green-100 text-green-800',
  training:   'bg-cyan-100 text-cyan-800',
  concerts:   'bg-red-100 text-red-800',
  crusades:   'bg-orange-100 text-orange-800',
  podcasts:   'bg-violet-100 text-violet-800',
  other:      'bg-gray-100 text-gray-800',
}
