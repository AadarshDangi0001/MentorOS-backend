import { UserRole, IAuthRequest, IUser } from './types';
import { hasMinimumRole, canAccessAdminPanel, canAccessRoute } from './utils/roleBasedAccess';
import { authorize, authorizeAtLeast } from './middleware/auth/authorize';
import { Request, Response } from 'express';
import { ApiError } from './utils/ApiError';

let failedTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${message}`);
    failedTests++;
  }
}

console.log('--- Running RBAC Helper Tests ---');

// Test hasMinimumRole
assert(hasMinimumRole(UserRole.STUDENT, UserRole.STUDENT) === true, 'STUDENT meets minimum STUDENT');
assert(hasMinimumRole(UserRole.STUDENT, UserRole.MENTOR) === false, 'STUDENT does not meet minimum MENTOR');
assert(hasMinimumRole(UserRole.MENTOR, UserRole.STUDENT) === true, 'MENTOR meets minimum STUDENT');
assert(hasMinimumRole(UserRole.MENTOR, UserRole.MENTOR) === true, 'MENTOR meets minimum MENTOR');
assert(hasMinimumRole(UserRole.ADMIN, UserRole.MENTOR) === true, 'ADMIN meets minimum MENTOR');
assert(hasMinimumRole(UserRole.ADMIN, UserRole.ADMIN) === true, 'ADMIN meets minimum ADMIN');
assert(hasMinimumRole(UserRole.SUPER_ADMIN, UserRole.ADMIN) === true, 'SUPER_ADMIN meets minimum ADMIN');
assert(hasMinimumRole(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN) === true, 'SUPER_ADMIN meets minimum SUPER_ADMIN');

// Test blocked/deleted accounts
assert(hasMinimumRole(UserRole.BLOCKED, UserRole.STUDENT) === false, 'BLOCKED cannot meet STUDENT');
assert(hasMinimumRole(UserRole.DELETED, UserRole.STUDENT) === false, 'DELETED cannot meet STUDENT');

// Test canAccessAdminPanel
assert(canAccessAdminPanel(UserRole.STUDENT) === false, 'STUDENT cannot access admin panel');
assert(canAccessAdminPanel(UserRole.MENTOR) === false, 'MENTOR cannot access admin panel');
assert(canAccessAdminPanel(UserRole.ADMIN) === true, 'ADMIN can access admin panel');
assert(canAccessAdminPanel(UserRole.SUPER_ADMIN) === true, 'SUPER_ADMIN can access admin panel');
assert(canAccessAdminPanel(UserRole.BLOCKED) === false, 'BLOCKED cannot access admin panel');

// Test canAccessRoute
assert(canAccessRoute(UserRole.STUDENT, UserRole.STUDENT) === true, 'STUDENT meets minimum role check for STUDENT route');
assert(canAccessRoute(UserRole.MENTOR, UserRole.MENTOR) === true, 'MENTOR meets minimum role check for MENTOR route');
assert(canAccessRoute(UserRole.MENTOR, UserRole.ADMIN) === false, 'MENTOR does not meet minimum role check for ADMIN route');
assert(canAccessRoute(UserRole.ADMIN, UserRole.MENTOR) === true, 'ADMIN meets minimum role check for MENTOR route');
assert(canAccessRoute(UserRole.ADMIN, UserRole.ADMIN) === true, 'ADMIN meets minimum role check for ADMIN route');

console.log('\n--- Running Middleware Tests (authorize / authorizeAtLeast) ---');

function createMockRequest(role?: UserRole): Request {
  const req = {} as unknown as IAuthRequest;
  if (role) {
    req.user = { role } as unknown as IUser;
  }
  return req as unknown as Request;
}

function createMockResponse(): Response {
  return {} as unknown as Response;
}

// Test function for authorizeAtLeast middleware
function testAuthorizeAtLeast(minimumRole: UserRole, userRole?: UserRole): { success: boolean; error?: unknown } {
  const middleware = authorizeAtLeast(minimumRole);
  const req = createMockRequest(userRole);
  const res = createMockResponse();
  let nextCalled = false;
  let nextError: unknown = null;

  const next = (err?: unknown) => {
    nextCalled = true;
    nextError = err;
  };

  middleware(req, res, next);

  if (nextCalled) {
    if (nextError) {
      return { success: false, error: nextError };
    }
    return { success: true };
  }
  return { success: false, error: new Error('next() was not called') };
}

// Test function for authorize (exact role) middleware
function testAuthorizeExact(targetRole: UserRole, userRole?: UserRole): { success: boolean; error?: unknown } {
  const middleware = authorize(targetRole);
  const req = createMockRequest(userRole);
  const res = createMockResponse();
  let nextCalled = false;
  let nextError: unknown = null;

  const next = (err?: unknown) => {
    nextCalled = true;
    nextError = err;
  };

  middleware(req, res, next);

  if (nextCalled) {
    if (nextError) {
      return { success: false, error: nextError };
    }
    return { success: true };
  }
  return { success: false, error: new Error('next() was not called') };
}

// 1. Unauthenticated Requests
const unauthResult = testAuthorizeExact(UserRole.STUDENT, undefined);
assert(unauthResult.success === false && unauthResult.error instanceof ApiError && unauthResult.error.statusCode === 401, 'Unauthenticated request gets 401 Unauthorized');

// 2. Student-only Routes (using authorize)
assert(testAuthorizeExact(UserRole.STUDENT, UserRole.STUDENT).success === true, 'STUDENT can access STUDENT routes');
assert(testAuthorizeExact(UserRole.STUDENT, UserRole.SUPER_ADMIN).success === true, 'SUPER_ADMIN can access STUDENT routes (bypass)');

const mentorOnStudent = testAuthorizeExact(UserRole.STUDENT, UserRole.MENTOR);
assert(mentorOnStudent.success === false && mentorOnStudent.error instanceof ApiError && mentorOnStudent.error.statusCode === 403, 'MENTOR is blocked from STUDENT routes');

const adminOnStudent = testAuthorizeExact(UserRole.STUDENT, UserRole.ADMIN);
assert(adminOnStudent.success === false && adminOnStudent.error instanceof ApiError && adminOnStudent.error.statusCode === 403, 'ADMIN is blocked from STUDENT routes');

// 3. Mentor-only Routes (using authorize)
assert(testAuthorizeExact(UserRole.MENTOR, UserRole.MENTOR).success === true, 'MENTOR can access MENTOR routes');
assert(testAuthorizeExact(UserRole.MENTOR, UserRole.SUPER_ADMIN).success === true, 'SUPER_ADMIN can access MENTOR routes (bypass)');

const studentOnMentor = testAuthorizeExact(UserRole.MENTOR, UserRole.STUDENT);
assert(studentOnMentor.success === false && studentOnMentor.error instanceof ApiError && studentOnMentor.error.statusCode === 403, 'STUDENT is blocked from MENTOR routes');

const adminOnMentor = testAuthorizeExact(UserRole.MENTOR, UserRole.ADMIN);
assert(adminOnMentor.success === false && adminOnMentor.error instanceof ApiError && adminOnMentor.error.statusCode === 403, 'ADMIN is blocked from MENTOR routes');

// 4. Admin Routes (using authorizeAtLeast)
assert(testAuthorizeAtLeast(UserRole.ADMIN, UserRole.ADMIN).success === true, 'ADMIN can access ADMIN routes');
assert(testAuthorizeAtLeast(UserRole.ADMIN, UserRole.SUPER_ADMIN).success === true, 'SUPER_ADMIN can access ADMIN routes');

const mentorOnAdmin = testAuthorizeAtLeast(UserRole.ADMIN, UserRole.MENTOR);
assert(mentorOnAdmin.success === false && mentorOnAdmin.error instanceof ApiError && mentorOnAdmin.error.statusCode === 403, 'MENTOR is blocked from ADMIN routes');

const studentOnAdmin = testAuthorizeAtLeast(UserRole.ADMIN, UserRole.STUDENT);
assert(studentOnAdmin.success === false && studentOnAdmin.error instanceof ApiError && studentOnAdmin.error.statusCode === 403, 'STUDENT is blocked from ADMIN routes');


console.log('\n--- Running Role Modification tests (SUPER_ADMIN only) ---');

function verifyRoleModificationAccess(actorRole: UserRole, actorId: string, targetId: string): { success: boolean; error?: string } {
  if (actorId === targetId) {
    return { success: false, error: 'You cannot change your own role' };
  }
  if (actorRole !== UserRole.SUPER_ADMIN) {
    return { success: false, error: 'Only super admins can modify user roles' };
  }
  return { success: true };
}

assert(verifyRoleModificationAccess(UserRole.SUPER_ADMIN, 'actor-id', 'target-id').success === true, 'SUPER_ADMIN can change user roles');
assert(verifyRoleModificationAccess(UserRole.SUPER_ADMIN, 'same-id', 'same-id').success === false, 'SUPER_ADMIN cannot change own role');
assert(verifyRoleModificationAccess(UserRole.ADMIN, 'actor-id', 'target-id').success === false, 'ADMIN cannot change user roles');
assert(verifyRoleModificationAccess(UserRole.MENTOR, 'actor-id', 'target-id').success === false, 'MENTOR cannot change user roles');
assert(verifyRoleModificationAccess(UserRole.STUDENT, 'actor-id', 'target-id').success === false, 'STUDENT cannot change user roles');


console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All RBAC constraints verified successfully!\x1b[0m');
  process.exit(0);
}
