type UserEmail = string

export interface UserAccessConfig {
  canCreateRequest: boolean
  allowedRoutes: string[]
  canViewRequested: boolean
  canViewRecommended: boolean
  canViewApproved: boolean
  canViewRejected: boolean
  canViewFulfilled: boolean
  canDeleteRequest: boolean
  canEditDeviceDetails: boolean
  canEditRequesterInformation: boolean
  canActOnRequested: boolean       // STRICT: Can approve/reject/recommend 'Requested'
  canActOnRecommended: boolean     // STRICT: Can approve/reject 'Pending'/'Recommended'
  canFulfillRequest: boolean       // STRICT: Can fulfill 'Approved'
  requestedActionLabel: 'Approve' | 'Recommend'
}

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? ''
const REQUEST_VIEWER_ONLY_EMAILS = new Set<string>([])

// DEFAULT FOR ALL USERS NOT EXPLICITLY LISTED (e.g., raj, aayush, etc.)
const STANDARD_USER_ACCESS: UserAccessConfig = {
  canCreateRequest: true,
  allowedRoutes: ['*'],
  canViewRequested: true,
  canViewRecommended: true,
  canViewApproved: true,
  canViewRejected: true,
  canViewFulfilled: true,
  canDeleteRequest: false,
  canEditDeviceDetails: true,
  canEditRequesterInformation: false,
  canActOnRequested: false,          // STRICT: Cannot approve/reject requested
  canActOnRecommended: false,        // STRICT: Cannot approve/reject recommended/pending
  canFulfillRequest: true,           // Can fulfill approved requests
  requestedActionLabel: 'Approve',
}

const USER_ACCESS: Record<UserEmail, UserAccessConfig> = {
  'anjana@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],
    canViewRequested: false,
    canViewRecommended: false,
    canViewApproved: true,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: false,
    canEditDeviceDetails: false,
    canEditRequesterInformation: false,
    canActOnRequested: false,
    canActOnRecommended: false,
    canFulfillRequest: true,
    requestedActionLabel: 'Approve',
  },
  'sudharshan@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],
    canViewRequested: false,
    canViewRecommended: true,
    canViewApproved: true,
    canViewRejected: true,
    canViewFulfilled: false,
    canDeleteRequest: false,
    canEditDeviceDetails: false,
    canEditRequesterInformation: false,
    canActOnRequested: false,
    canActOnRecommended: true,
    canFulfillRequest: false,
    requestedActionLabel: 'Approve',
  },
  'umesh.acharya@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],
    canViewRequested: true,
    canViewRecommended: true,
    canViewApproved: true,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: false,
    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
    canActOnRequested: true,         // Can "Recommend" (sets to Pending)
    canActOnRecommended: false,      // Cannot act on Pending/Recommended
    canFulfillRequest: false,
    requestedActionLabel: 'Recommend',
  },
  'sishir@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],
    canViewRequested: true,
    canViewRecommended: true,
    canViewApproved: true,
    canViewRejected: true,
    canViewFulfilled: true,
    canDeleteRequest: true,              
    canEditDeviceDetails: true,
    canEditRequesterInformation: true,  
    canActOnRequested: true,
    canActOnRecommended: true,
    canFulfillRequest: true,
    requestedActionLabel: 'Approve',
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

  if (user === 'sishir@yetiairlines.com') return true 

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
export const canViewApprovedStatus = (email?: string | null) => getUserAccess(email).canViewApproved
export const canFulfillRequestStatus = (email?: string | null) => getUserAccess(email).canFulfillRequest
export const canActOnRequested = (email?: string | null) => getUserAccess(email).canActOnRequested
export const canActOnRecommended = (email?: string | null) => getUserAccess(email).canActOnRecommended
export const getRequestedActionLabel = (email?: string | null) => getUserAccess(email).requestedActionLabel