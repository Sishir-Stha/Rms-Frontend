const ADMIN_DEPARTMENT = 'Admin'

const ADMIN_ALLOWED_NAV_PATHS = ['/', '/requests', '/request-kanban', '/reports'] as const
const ADMIN_ALLOWED_ROUTE_PREFIXES = [
  '/',
  '/requests',
  '/request-kanban',
  '/reports',
] as const

export const isAdminDepartment = (department: string | null | undefined): boolean =>
  department?.trim() === ADMIN_DEPARTMENT

export const isAdminAllowedNavPath = (path: string): boolean =>
  ADMIN_ALLOWED_NAV_PATHS.includes(path as (typeof ADMIN_ALLOWED_NAV_PATHS)[number])

export const canAccessPathForDepartment = (
  department: string | null | undefined,
  pathname: string,
): boolean => {
  if (!isAdminDepartment(department)) {
    return true
  }

  return ADMIN_ALLOWED_ROUTE_PREFIXES.some((allowedPrefix) =>
    allowedPrefix === '/'
      ? pathname === '/'
      : pathname === allowedPrefix || pathname.startsWith(`${allowedPrefix}/`),
  )
}

export const canCreateDeviceRequestForDepartment = (
  department: string | null | undefined,
): boolean => !isAdminDepartment(department)
