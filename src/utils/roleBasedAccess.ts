import { UserRole, RoleHierarchy } from '../types';

/**
 * Check if a user role meets or exceeds a minimum role requirement
 */
export const hasMinimumRole = (
  userRole: UserRole | undefined,
  minimumRole: UserRole
): boolean => {
  if (!userRole) return false;
  const userRoleValue = RoleHierarchy[userRole];
  const minimumRoleValue = RoleHierarchy[minimumRole];
  if (userRoleValue === undefined || minimumRoleValue === undefined) return false;
  if (userRoleValue < 0) return false; // blocked or deleted
  return userRoleValue >= minimumRoleValue;
};

/**
 * Check if user can access the admin panel (ADMIN or higher)
 */
export const canAccessAdminPanel = (userRole: UserRole | undefined): boolean => {
  return hasMinimumRole(userRole, UserRole.ADMIN);
};


/**
 * Check if user can access a specific route based on minimum role
 */
export const canAccessRoute = (
  userRole: UserRole | undefined,
  minimumRole: UserRole
): boolean => {
  return hasMinimumRole(userRole, minimumRole);
};
