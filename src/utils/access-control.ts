type UserEmail = string

export interface UserAccessConfig {
  canCreateRequest: boolean
  allowedRoutes: string[]
}

const USER_ACCESS: Record<UserEmail, UserAccessConfig> = {
  'anjana@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: [
      '/',
      '/requests',
      '/request-kanban',
      '/reports',
    ],
  },
}

const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() ?? ''

export const getUserAccess = (email?: string | null) => {
  const config = USER_ACCESS[normalizeEmail(email)]

  if (!config) {
    return {
      canCreateRequest: true,
      allowedRoutes: ['*'],
      isRestricted: false,
    }
  }

  return {
    ...config,
    isRestricted: true,
  }
}

export const canCreateDeviceRequestForUser = (
  email?: string | null,
) => getUserAccess(email).canCreateRequest

export const isRestrictedUser = (
  email?: string | null,
) => getUserAccess(email).isRestricted

export const canAccessPathForUser = (
  email?: string | null,
  pathname?: string,
) => {
  if (!pathname) return false

  const access = getUserAccess(email)

  if (
    !access.isRestricted ||
    access.allowedRoutes.includes('*')
  ) {
    return true
  }

  return access.allowedRoutes.some((route) =>
    route === '/'
      ? pathname === '/'
      : pathname.startsWith(route),
  )
}

/**
 * Request Kanban status change permission
 * Anjana = view only
 * Everyone else = allowed
 */
export const canUpdateRequestKanbanStatus = (
  email?: string | null,
) => {
  const normalized = normalizeEmail(email)

  return normalized !== 'anjana@yetiairlines.com'
}

export const isAllowedNavPath = (_path: string) => true