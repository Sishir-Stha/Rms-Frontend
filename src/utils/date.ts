/**
 * Safe date utilities to prevent timezone shifting 
 * (e.g., dates showing up as one day before).
 */

export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTodayLocal = (): string => {
  return toLocalDateString(new Date())
}

export const formatDateOnly = (value?: string | null): string => {
  if (!value) return ''
  const stringValue = String(value).trim()
  if (stringValue === '') return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }

  const date = new Date(stringValue)
  if (Number.isNaN(date.getTime())) return ''

  return toLocalDateString(date)
}

export const toBackendDate = (value?: string | null): string | null => {
  if (!value) return null
  const stringValue = String(value).trim()
  if (stringValue === '') return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }

  const date = new Date(stringValue)
  if (Number.isNaN(date.getTime())) return null

  return toLocalDateString(date)
}