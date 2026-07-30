type UserEmail = string

export interface UserAccessConfig {
  canCreateRequest: boolean
  allowedRoutes: string[]

  canViewRecommended: boolean
  canViewRejected: boolean
  canDeleteRequest: boolean

  canEditDeviceDetails: boolean
  canEditRequesterInformation: boolean
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() ?? ''

// Users whose Device Request & Request Kanban access mirrors Anjana
// (can navigate to those routes but are view-only, cannot create/edit/drag)
const REQUEST_VIEWER_ONLY_EMAILS = new Set([
  'bhupal@yetiairlines.com',
  'ajita@yetiairlines.com',
  'roshan@yetiairlines.com',
  'aayush@yetiairlines.com',
  'raj@yetiairlines.com',
])

// ─────────────────────────────────────────────
// Explicit per-user config
// (only users with RESTRICTIONS need an entry)
// ─────────────────────────────────────────────
const USER_ACCESS: Record<UserEmail, UserAccessConfig> = {
  // ── Anjana: restricted to a small route subset, view-only on requests ──
  'anjana@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },

  // ── Sudharshan: restricted route list, view-only on requests ──
  'sudharshan@yetiairlines.com': {
    canCreateRequest: false,
    allowedRoutes: ['/', '/requests', '/request-kanban', '/reports'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },

  // ── Umesh: full routes, can edit, cannot delete ──
  'umesh.acharya@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],

    canViewRecommended: true,
    canViewRejected: true,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },

  // ── bhupal / ajita / roshan / aayush / raj
  //    Full access to all routes, but view-only on /requests & /request-kanban ──
  'bhupal@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],   // all routes allowed

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'ajita@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'roshan@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'aayush@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
  'raj@yetiairlines.com': {
    canCreateRequest: true,
    allowedRoutes: ['*'],

    canViewRecommended: false,
    canViewRejected: false,
    canDeleteRequest: false,

    canEditDeviceDetails: true,
    canEditRequesterInformation: false,
  },
}

// ─────────────────────────────────────────────
// Resolver
// ─────────────────────────────────────────────
export const getUserAccess = (email?: string | null) => {
  const key = normalizeEmail(email)
  const config = USER_ACCESS[key]

  if (!config) {
    // Unknown / unlisted user  →  full unrestricted access
    return {
      canCreateRequest: true,
      allowedRoutes: ['*'],

      canViewRecommended: true,
      canViewRejected: true,
      canDeleteRequest: true,

      canEditDeviceDetails: true,
      canEditRequesterInformation: true,

      isRestricted: false,
      isRequestViewerOnly: false,
    }
  }

  return {
    ...config,
    isRestricted: true,
    // true  →  can navigate to request routes but is purely view-only there
    isRequestViewerOnly: REQUEST_VIEWER_ONLY_EMAILS.has(key),
  }
}

// ─────────────────────────────────────────────
// Named permission helpers
// ─────────────────────────────────────────────

export const canCreateDeviceRequestForUser = (email?: string | null) =>
  getUserAccess(email).canCreateRequest

export const isRestrictedUser = (email?: string | null) =>
  getUserAccess(email).isRestricted

/** True for bhupal/ajita/roshan/aayush/raj — full nav, view-only on requests */
export const isRequestViewerOnly = (email?: string | null) =>
  getUserAccess(email).isRequestViewerOnly

export const canAccessPathForUser = (
  email?: string | null,
  pathname?: string,
) => {
  if (!pathname) return false

  const access = getUserAccess(email)

  if (!access.isRestricted || access.allowedRoutes.includes('*')) {
    return true
  }

  return access.allowedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route),
  )
}

// ─────────────────────────────────────────────
// Kanban permissions
// ─────────────────────────────────────────────

/**
 * Who can drag cards at all.
 * Anjana + request-viewer-only users = no drag.
 */
export const canManageKanban = (email?: string | null) => {
  const user = normalizeEmail(email)

  if (user === 'anjana@yetiairlines.com') return false
  if (REQUEST_VIEWER_ONLY_EMAILS.has(user)) return false

  return true
}

/**
 * Strict per-user transition rules.
 *
 * sishir            : full access (falls through to the bottom)
 * umesh             : free among Requested / Pending / Rejected, no Approved
 * sudharshan        : Pending → Approved only
 * anjana            : no movement
 * request-viewer-only (bhupal/ajita/roshan/aayush/raj) : no movement
 * others            : full access
 */
export const canMoveKanbanStatus = (
  email?: string | null,
  from?: string,
  to?: string,
) => {
  const user = normalizeEmail(email)

  if (user === 'anjana@yetiairlines.com') return false
  if (REQUEST_VIEWER_ONLY_EMAILS.has(user)) return false

  if (user === 'umesh.acharya@yetiairlines.com') {
    const allowed: Array<[string, string]> = [
      ['Requested', 'Pending'],
      ['Requested', 'Rejected'],
      ['Pending',   'Requested'],
      ['Pending',   'Rejected'],
      ['Rejected',  'Requested'],
      ['Rejected',  'Pending'],
    ]
    return allowed.some(([f, t]) => f === from && t === to)
  }

  if (user === 'sudharshan@yetiairlines.com') {
    return from === 'Pending' && to === 'Approved'
  }

  return true
}

// ─────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────

export const canViewRecommendedStatus = (email?: string | null) =>
  getUserAccess(email).canViewRecommended

export const canViewRejectedStatus = (email?: string | null) =>
  getUserAccess(email).canViewRejected

export const canDeleteDeviceRequest = (email?: string | null) =>
  getUserAccess(email).canDeleteRequest

export const canEditDeviceDetails = (email?: string | null) =>
  getUserAccess(email).canEditDeviceDetails

export const canEditRequesterInformation = (email?: string | null) =>
  getUserAccess(email).canEditRequesterInformation