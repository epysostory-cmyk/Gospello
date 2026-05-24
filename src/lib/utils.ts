import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[^\x00-\x7F]/g, '')
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

interface ServiceEntry { day: string; name: string; time: string }

/** Converts "08:00" → "8AM", "14:30" → "2:30PM" */
function fmt12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h)) return t
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')}${ampm}` : `${h12}${ampm}`
}

const DAY_LABEL: Record<string, string> = {
  sunday: 'Sundays', monday: 'Mondays', tuesday: 'Tuesdays',
  wednesday: 'Wednesdays', thursday: 'Thursdays', friday: 'Fridays', saturday: 'Saturdays',
}

/**
 * Parses service_times regardless of whether it is plain text or the
 * structured JSON saved by ServiceScheduleBuilder.
 *
 * JSON example: [{"day":"sunday","name":"Morning Service","time":"08:00"}]
 * Plain text:   "Sundays 8AM, Wednesdays 6PM"
 *
 * Returns a clean human-readable string in all cases.
 */
export function formatServiceTimes(raw: string | null | undefined): string {
  if (!raw) return ''
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as ServiceEntry[])
        .map(e => {
          const day  = DAY_LABEL[e.day?.toLowerCase()] ?? e.day
          const time = e.time ? fmt12h(e.time) : ''
          const name = e.name?.trim() ? ` · ${e.name.trim()}` : ''
          return [day, time].filter(Boolean).join(' ') + name
        })
        .join(', ')
    }
  } catch { /* plain text — fall through */ }
  return raw
}

/**
 * Same as formatServiceTimes but only returns entries matching a specific day.
 * dayIndex: 0=Sun, 1=Mon … 6=Sat
 */
export function formatServiceTimesForDay(raw: string | null | undefined, dayIndex: number): string {
  if (!raw) return ''
  const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const targetDay = DAY_KEYS[dayIndex]

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const todayEntries = (parsed as ServiceEntry[]).filter(
        e => e.day?.toLowerCase() === targetDay
      )
      if (todayEntries.length > 0) {
        return todayEntries
          .map(e => {
            const time = e.time ? fmt12h(e.time) : ''
            const name = e.name?.trim() ? `${e.name.trim()} ` : ''
            return `${name}${time}`.trim()
          })
          .join(', ')
      }
      // No entry for today — return all formatted (fallback)
      return formatServiceTimes(raw)
    }
  } catch { /* plain text */ }

  // Plain text — use the existing regex approach
  const lower = raw.toLowerCase()
  const dayShort = targetDay.slice(0, 3)
  const regex = new RegExp(`(${dayShort}[a-z]*|${targetDay})s?[:\\s]*([^,\\n]+)`, 'i')
  const match = lower.match(regex)
  if (match) {
    const idx = lower.indexOf(match[0])
    const original = raw.substring(idx, idx + match[0].length).trim()
    return original.length < 60 ? original : raw
  }
  return raw
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
