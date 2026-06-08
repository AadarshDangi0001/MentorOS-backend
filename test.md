# Propeers Backend API Testing Guide

This document lists all available endpoints with URL, method, headers, query parameters, and example request payloads to make testing direct and production-ready.

---

## 1. Authentication APIs

### Register User (Public)

Creates a new `student` or `mentor` account.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/register`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "Password123!",
  "role": "student"
}
```

_(Use role `"mentor"` to register as a mentor)_

---

### Login User (Public)

Logs in a user and returns an `accessToken` along with a HTTP-only cookie for the `refreshToken`.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "email": "jane.doe@example.com",
  "password": "Password123!"
}
```

---

### Refresh Token (Public)

Obtains a new Access Token using the Refresh Token.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/refresh`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

_(If cookies are used, the refresh token cookie is automatically read by the backend)_

---

### Verify Email (Public)

Verifies the user's email address.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/public/auth/verify-email/:token`
- **URL Parameters**:
  - `token`: The random token sent in the welcome email.

---

### Resend Verification Email (Public)

Triggers a fresh verification email link.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/resend-verification`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "email": "jane.doe@example.com"
}
```

---

### Forgot Password (Public)

Requests a password reset link.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/forgot-password`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "email": "jane.doe@example.com"
}
```

---

### Reset Password (Public)

Resets the password using the token sent via email.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/auth/reset-password/:token`
- **URL Parameters**:
  - `token`: The reset token sent in the email.
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "password": "NewSecurePassword123!"
}
```

---

### Get Authenticated User Profile (Private)

Fetches profile details of the currently logged-in user.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/auth/me`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Logout (Private)

Blacklists the access token and deletes the refresh token session from the database.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/auth/logout`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Change Password (Private)

Updates the authenticated user's password.

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/auth/change-password`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "currentPassword": "Password123!",
  "newPassword": "AnotherSecurePassword99!"
}
```

---

### Google OAuth Login Initiator (Public)

Redirects the client to Google Consent Page.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/public/auth/google`

---

## 2. Mentor Exploration (Explore)

### Get Mentors (Public)

Browse all approved mentors with filters and sorting options.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/public/mentors`
- **Query Parameters**:
  - `skill` (string, optional): Filter by expertise, e.g. `Node.js`
  - `company` (string, optional): Filter by current/past company, e.g. `Google`
  - `minExperience` (number, optional)
  - `maxExperience` (number, optional)
  - `minRating` (number, optional)
  - `page` (number, defaults to 1)
  - `limit` (number, defaults to 12)
  - `sort` (defaults to `"rating"`, options: `"rating"`, `"experience"`, `"price"`)
  - `order` (defaults to `"desc"`, options: `"asc"`, `"desc"`)

---

### Get Mentor Details by User ID (Public)

Gets full details of an approved mentor profile.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/public/mentors/:mentorId`

---

### Get Mentor Reviews (Public)

Gets historical ratings/reviews for a specific mentor.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/public/mentors/:mentorId/reviews`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10)

---

## 3. Mentor Availability & Profile Management

### Update Mentor Profile (Private - Mentor)

Updates or registers the current user's mentor specific properties.

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/v1/private/mentor/profile`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "company": "Google",
  "currentRole": "Senior Software Engineer",
  "experience": 8,
  "expertise": ["TypeScript", "NestJS", "Node.js"],
  "linkedIn": "https://linkedin.com/in/mentor-handle",
  "github": "https://github.com/mentor-handle",
  "hourlyRate": 1500,
  "languages": ["English", "Hindi"]
}
```

---

### Get My Mentor Profile (Private - Mentor)

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/mentor/profile`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Get Mentor Availability Slots (Public under private prefix)

Gets calendar time slots for a mentor.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/availability/:mentorId`
- **Query Parameters**:
  - `available` (boolean): `true` to only fetch unbooked/future slots.

---

### Create Availability Slot (Private - Mentor)

Adds a calendar availability interval.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/availability`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "startTime": "2026-06-15T09:00:00.000Z",
  "endTime": "2026-06-15T10:00:00.000Z"
}
```

---

### Delete Availability Slot (Private - Mentor)

Removes a future availability interval.

- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/v1/private/availability/:slotId`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

## 4. Mentor Packages

### Get Mentor Packages (Public under private prefix)

Gets pricing packages for bookings.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/packages/:mentorId`

---

### Create Package (Private - Mentor)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/packages`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "title": "System Design Prep Package",
  "duration": 45,
  "price": 2000,
  "description": "45-minute structured mock interview on high-level system design."
}
```

---

### Update Package (Private - Mentor)

- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/v1/private/packages/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "price": 2500,
  "isActive": true
}
```

---

### Delete Package (Private - Mentor)

- **Method**: `DELETE`
- **URL**: `http://localhost:3000/api/v1/private/packages/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

## 5. Bookings & Rescheduling

### Get My Bookings (Private - Student)

Lists student bookings.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/bookings/my`
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Query Parameters**:
  - `status` (string, optional): e.g. `confirmed`, `pending`, `completed`

---

### Get Mentor Bookings (Private - Mentor)

Lists mentor bookings.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/bookings/mentor`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Get Booking Details by ID (Private - Shared)

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/bookings/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Mentor Requests Reschedule (Private - Mentor)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/bookings/:bookingId/reschedule`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "newAvailabilityId": "65b9fc0e514f7b2c9d2f0a12",
  "reason": "Family emergency, need to move the slot back"
}
```

---

### Student Accepts Reschedule (Private - Student)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/bookings/:bookingId/accept-reschedule`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Student Rejects Reschedule (Private - Student)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/bookings/:bookingId/reject-reschedule`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

## 6. Payments & Webhooks

### Create Payment Order & Booking (Private - Student)

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/payments/create-order`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "mentorId": "65b8fa0d514f7b2c9d2f0001",
  "packageId": "65b9eb0d514f7b2c9d2f01a3",
  "availabilityId": "65b9fc0e514f7b2c9d2f0a12"
}
```

---

### Verify Payment Signature (Private - Student)

Verifies signature and confirms booking with meeting details.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/payments/verify`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "razorpayOrderId": "order_Nz1Sfdj93kfldK",
  "razorpayPaymentId": "pay_Nz1Thjd94kdlsL",
  "razorpaySignature": "dfd59f3bdff5b8e90a5df971b4028cf...",
  "meetingData": {
    "roomId": "room-1234",
    "provider": "google-meet",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "hostLink": "https://meet.google.com/abc-defg-hij?authuser=1"
  }
}
```

---

### Razorpay Webhook Event Handler (Public)

Receives captured/failed payment callbacks directly from Razorpay.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/public/payments/webhook`
- **Headers**:
  - `x-razorpay-signature`: Signature token computed using Razorpay Webhook Secret.
- **Request Body**:
  _(Automatic payload generated by Razorpay events system)_

---

## 7. Meetings & Reviews

### Fetch Meeting Details (Private - Shared)

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/meetings/:bookingId`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Submit Review (Private - Student)

Submit ratings/review feedback for completed mentor sessions.

- **Method**: `POST`
- **URL**: `http://localhost:3000/api/v1/private/reviews`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "bookingId": "65b9fa0d514f7b2c9d2f0001",
  "rating": 5,
  "review": "Excellent guidance, helped me clear my NestJS concepts."
}
```

---

## 8. Admin & Super Admin APIs

### Fetch System Statistics (Private - Admin/Super Admin)

Returns aggregate metadata charts.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/admin/stats`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Fetch All Users (Private - Admin/Super Admin)

Lists all system user accounts.

- **Method**: `GET`
- **URL**: `http://localhost:3000/api/v1/private/admin/users`
- **Headers**:
  - `Authorization: Bearer <access_token>`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)

---

### Block User (Private - Admin/Super Admin)

Sets role to `blocked` and status to `suspended`.

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/users/:id/block`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Unblock User (Private - Admin/Super Admin)

Sets role to specified target (defaults to `student`) and status to `active`.

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/users/:id/unblock`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "role": "student"
}
```

---

### Soft Delete User (Private - Admin/Super Admin)

Sets role to `deleted` and status to `inactive`.

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/users/:id/delete`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Approve Mentor Application (Private - Admin/Super Admin)

Sets application status to `approved` and isVerified to `true`.

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/mentors/:id/approve`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Reject Mentor Application (Private - Admin/Super Admin)

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/mentors/:id/reject`
- **Headers**:
  - `Authorization: Bearer <access_token>`

---

### Change User Role (Private - Super Admin Only)

Modifies a user's role to any available system role (e.g. promoting a user to admin or super_admin).

- **Method**: `PATCH`
- **URL**: `http://localhost:3000/api/v1/private/admin/users/:id/role`
- **Headers**:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Request Body**:

```json
{
  "role": "admin"
}
```

_(Valid roles: `"student"`, `"mentor"`, `"admin"`, `"super_admin"`, `"blocked"`, `"deleted"`)_
