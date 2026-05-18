/**
 * Validates a display name / stage name.
 * Accepts real names, stage names, ministry names, and artist names.
 * Rules: not empty, at least 2 characters, max 60 characters, no special symbols.
 */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Please enter your name or stage name'
  if (trimmed.length < 2) return 'Name must be at least 2 characters'
  if (trimmed.length > 60) return 'Name is too long (max 60 characters)'
  if (/[<>{}[\]\\|^`~]/.test(trimmed)) return 'Name contains invalid characters'
  return null
}
