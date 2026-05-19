export interface SupportedCountry {
  name: string
  flag: string
  code: string
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
  { name: 'United States', flag: '🇺🇸', code: 'US' },
  { name: 'Canada', flag: '🇨🇦', code: 'CA' },
  { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
  { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
]

export const COUNTRY_NAMES = SUPPORTED_COUNTRIES.map(c => c.name)

export function getCountryFlag(name: string): string {
  return SUPPORTED_COUNTRIES.find(c => c.name === name)?.flag ?? '🌍'
}
