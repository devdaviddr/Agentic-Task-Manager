export const BACKGROUND_OPTIONS = [
  { value: 'bg-page', label: 'Page' },
  { value: 'bg-panel', label: 'Panel' },
  { value: 'bg-primary/10', label: 'Primary' },
  { value: 'bg-secondary/10', label: 'Secondary' },
  { value: 'bg-tertiary/10', label: 'Tertiary' }
]

export const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' }
]

export const validateEffort = (effort: string): number | undefined => {
  const parsed = parseInt(effort)
  if (isNaN(parsed) || parsed < 1 || parsed > 10) return undefined
  return parsed
}

export const validateDate = (date: string): boolean => {
  return !date || !isNaN(new Date(date).getTime())
}