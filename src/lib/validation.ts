/**
 * Validates a person's full name.
 * Rules:
 *  - No numbers
 *  - At least two words separated by a space (first + last name)
 *  - Each word ≥ 2 characters
 *  - Each word must start with a capital letter
 *  - No uppercase letters after the first character of each word (no "FEmi", no "FEMI")
 *  - Only letters, spaces, hyphens, and apostrophes allowed
 *  - Max 60 characters
 */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Please enter your full name'
  if (/[0-9]/.test(trimmed)) return 'Full name cannot contain numbers'
  if (/[^A-Za-zÀ-ÖØ-öø-ÿ\s'\-]/.test(trimmed)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes'
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2) return 'Please enter your first and last name — e.g. Oluwafemi Olaoye'
  for (const word of words) {
    if (word.length < 2) return 'Each name must be at least 2 characters'
    if (!/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜ]/.test(word)) {
      return 'Each name must start with a capital letter — e.g. Oluwafemi Olaoye'
    }
    if (/[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜ]/.test(word.slice(1))) {
      return 'Please write your name normally — e.g. Oluwafemi Olaoye'
    }
  }
  if (trimmed.length > 60) return 'Name is too long (max 60 characters)'
  return null
}
