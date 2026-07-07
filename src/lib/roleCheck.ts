/**
 * Role-Based Access Control Utilities
 * Provides functions to check user permissions and roles
 */

import { Profile } from './supabase'

export type UserRole = 'admin' | 'user' | null

/**
 * Check if a user profile has admin role
 * @param profile - User profile to check
 * @returns true if user is admin
 */
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}

/**
 * Check if a user profile has a specific role
 * @param profile - User profile to check
 * @param role - Role to check for
 * @returns true if user has the specified role
 */
export function hasRole(profile: Profile | null, role: UserRole): boolean {
  return profile?.role === role
}

/**
 * Throw an error if user is not admin
 * @param profile - User profile to check
 * @throws Error if user is not admin
 */
export function requireAdmin(profile: Profile | null): void {
  if (!isAdmin(profile)) {
    throw new Error('Admin access required')
  }
}

/**
 * Get display label for a role
 * @param role - Role to get label for
 * @returns Human-readable role label
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'user':
      return 'User'
    default:
      return 'Unknown'
  }
}
