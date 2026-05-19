import type { RecurrenceRule } from '@/types/database'

function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date | null {
  const first = new Date(year, month, 1)
  const offset = (dayOfWeek - first.getDay() + 7) % 7
  const day = 1 + offset + (n - 1) * 7
  if (day > new Date(year, month + 1, 0).getDate()) return null
  return new Date(year, month, day)
}

export function generateOccurrenceDates(rule: RecurrenceRule, baseDate: Date): Date[] {
  const max = Math.min(rule.occurrences ?? 52, 52)
  const endDate = rule.end_date ? new Date(rule.end_date + 'T23:59:59') : null
  const dates: Date[] = [new Date(baseDate)]

  let monthCursor = baseDate.getFullYear() * 12 + baseDate.getMonth()
  let weekCursor  = new Date(baseDate)

  while (dates.length < max) {
    let next: Date

    if (rule.frequency === 'weekly') {
      weekCursor = new Date(weekCursor.getTime() + rule.interval * 7 * 24 * 60 * 60 * 1000)
      next = new Date(weekCursor)
    } else {
      monthCursor += rule.interval
      const year  = Math.floor(monthCursor / 12)
      const month = monthCursor % 12

      if (rule.week_of_month) {
        const nthDay = getNthWeekdayOfMonth(year, month, rule.day_of_week, rule.week_of_month)
        if (!nthDay) break
        next = nthDay
      } else {
        const targetDay = baseDate.getUTCDate()
        const lastDay   = new Date(year, month + 1, 0).getDate()
        next = new Date(year, month, Math.min(targetDay, lastDay))
      }
      next.setUTCHours(baseDate.getUTCHours(), baseDate.getUTCMinutes(), baseDate.getUTCSeconds(), 0)
    }

    if (endDate && next > endDate) break
    dates.push(next)
  }

  return dates
}
