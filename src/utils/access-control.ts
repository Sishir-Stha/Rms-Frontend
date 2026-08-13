type UserEmail = string

export interface UserAccessConfig {
  canCreateRequest: boolean
  allowedRoutes: string[]
  canViewRequested: boolean
  canViewRecommended: boolean
  canViewRejected: boolean
  canViewFulfilled: boolean
  canDeleteRequest: boolean
  canEditDeviceDetails: boolean
  canEditRequesterInformation: boolean
}

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? ''

const REQUEST_VIEWER_ONLY_EMAILS = new Set<string>([])

const STANDARD_USER_ACCESS: UserAccessConfig = {
  canCreateRequest: true,
  allowedRoutes: ['*'],
  canViewRequested: true,
  canViewRecommended: true,
  canViewRejected: true,
  canViewFulfilled: true,
  canDeleteRequest: false,
  canEditDeviceDetails: true,
  canEditRequesterInformation: false,
}

const USER_ACCESS: Record<UserEmail, UserAccessConfig> = {
  'anjana@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],
    canViewRequested: false,
    canViewRecommended: false,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: false,
    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'sudharshan@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],
    canViewRequested: false,
    canViewRecommended: true,
    canViewRejected: true,
    canViewFulfilled: false,
    canDeleteRequest: false,
    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'umesh.acharya@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],
    canViewRequested: true,
    canViewRecommended: true,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: false,
    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  
  'sishir@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],
    canViewRequested: true,
    canViewRecommended: true,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: true,              
    canEditDeviceDetails: true,
    canEditRequesterInformation: true,  
  },
}

export const getUserAccess = (email?: string | null) => {
  const key = normalizeEmail(email)
  const config = USER_ACCESS[key]

  if (!config) {
    return {
      ...STANDARD_USER_ACCESS,
      isRestricted: false,
      isRequestViewerOnly: REQUEST_VIEWER_ONLY_EMAILS.has(key),
    }
  }

  return {
    ...config,
    isRestricted: true,
    isRequestViewerOnly: REQUEST_VIEWER_ONLY_EMAILS.has(key),
  }
}

export const canCreateDeviceRequestForUser = (email?: string | null) => getUserAccess(email).canCreateRequest
export const isRestrictedUser = (email?: string | null) => getUserAccess(email).isRestricted
export const isRequestViewerOnly = (email?: string | null) => getUserAccess(email).isRequestViewerOnly

export const canAccessPathForUser = (email?: string | null, pathname?: string) => {
  if (!pathname) return false
  const access = getUserAccess(email)
  if (!access.isRestricted || access.allowedRoutes.includes('*')) return true
  return access.allowedRoutes.some((route) => route === '/' ? pathname === '/' : pathname.startsWith(route))
}

export const canManageKanban = (email?: string | null) => {
  const user = normalizeEmail(email)
  if (REQUEST_VIEWER_ONLY_EMAILS.has(user)) return false
  return true
}

export const canMoveKanbanStatus = (email?: string | null, from?: string, to?: string) => {
  const user = normalizeEmail(email)

  if (REQUEST_VIEWER_ONLY_EMAILS.has(user)) return false

  if (user === 'sishir@yetiairlines.com') {
    return true 
  }

  if (user === 'anjana@yetiairlines.com') {
    const allowed: Array<[string, string]> = [['Approved', 'Fulfilled'], ['Fulfilled', 'Approved']]
    return allowed.some(([f, t]) => f === from && t === to)
  }

  if (user === 'umesh.acharya@yetiairlines.com') {
    const allowed: Array<[string, string]> = [
      ['Requested', 'Pending'], ['Requested', 'Rejected'],
      ['Pending', 'Requested'], ['Pending', 'Rejected'],
      ['Rejected', 'Requested'], ['Rejected', 'Pending'],
    ]
    return allowed.some(([f, t]) => f === from && t === to)
  }

  if (user === 'sudharshan@yetiairlines.com') {
    const allowed: Array<[string, string]> = [
      ['Pending', 'Approved'], ['Approved', 'Pending'],
      ['Pending', 'Rejected'], ['Rejected', 'Pending'],
      ['Approved', 'Rejected'], ['Rejected', 'Approved'],
    ]
    return allowed.some(([f, t]) => f === from && t === to)
  }

  const defaultAllowed: Array<[string, string]> = [['Approved', 'Fulfilled'], ['Fulfilled', 'Approved']]
  return defaultAllowed.some(([f, t]) => f === from && t === to)
}


export const canViewRequestedStatus = (email?: string | null) => getUserAccess(email).canViewRequested
export const canViewRecommendedStatus = (email?: string | null) => getUserAccess(email).canViewRecommended
export const canViewRejectedStatus = (email?: string | null) => getUserAccess(email).canViewRejected
export const canViewFulfilledStatus = (email?: string | null) => getUserAccess(email).canViewFulfilled
export const canDeleteDeviceRequest = (email?: string | null) => getUserAccess(email).canDeleteRequest
export const canEditDeviceDetails = (email?: string | null) => getUserAccess(email).canEditDeviceDetails
export const canEditRequesterInformation = (email?: string | null) => getUserAccess(email).canEditRequesterInformation