# Propeers API — Test Data & cURL Examples

> Base URL: `http://localhost:3000/api/v1`  
> Replace `{{TOKEN}}` with the `accessToken` from login/register response.  
> Replace `{{REFRESH_TOKEN}}` with the `refreshToken` from cookie or response.

---

## 0. Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

---

## 1. REGISTER

### ✅ Register Student (Valid)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ravi Kumar",
    "email": "ravi.student@gmail.com",
    "password": "Student@1234",
    "role": "student"
  }'
```

### ✅ Register Mentor (Valid)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya.mentor@gmail.com",
    "password": "Mentor@5678",
    "role": "mentor"
  }'
```

### ✅ Register without role (defaults to student)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amit Singh",
    "email": "amit.default@gmail.com",
    "password": "Amit@9999"
  }'
```

### ❌ Duplicate Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ravi Kumar",
    "email": "ravi.student@gmail.com",
    "password": "Student@1234",
    "role": "student"
  }'
```
**Expected:** `409 Conflict` — `Email already registered`

### ❌ Weak Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.weak@gmail.com",
    "password": "12345678"
  }'
```
**Expected:** `400 Bad Request` — `Password must include uppercase, lowercase, number, and special character`

### ❌ Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "notanemail",
    "password": "Test@1234"
  }'
```
**Expected:** `400 Bad Request` — `Invalid email format`

### ❌ Missing Fields
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "missing@gmail.com"
  }'
```
**Expected:** `400 Bad Request` — name/password required errors

### ❌ Invalid Role
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hack User",
    "email": "hack@gmail.com",
    "password": "Hack@1234",
    "role": "admin"
  }'
```
**Expected:** `400 Bad Request` — `Role must be student or mentor`

---

## 2. LOGIN

### ✅ Valid Student Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "ravi.student@gmail.com",
    "password": "Student@1234"
  }'
```
> `-c cookies.txt` saves the refreshToken cookie for later use.

### ✅ Valid Mentor Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "priya.mentor@gmail.com",
    "password": "Mentor@5678"
  }'
```

### ❌ Wrong Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ravi.student@gmail.com",
    "password": "WrongPass@99"
  }'
```
**Expected:** `401 Unauthorized` — `Invalid credentials`

### ❌ Non-existent Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ghost@gmail.com",
    "password": "Ghost@1234"
  }'
```
**Expected:** `401 Unauthorized` — `Invalid credentials`

### ❌ Missing Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ravi.student@gmail.com"
  }'
```
**Expected:** `400 Bad Request` — `Password is required`

### ❌ Brute Force (run 6 times to trigger lockout)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ravi.student@gmail.com","password":"Wrong@Pass'$i'"}'
  echo ""
done
```
**Expected on 6th attempt:** `401` — `Account temporarily locked due to too many failed attempts`

---

## 3. GET ME (Protected)

### ✅ Valid Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {{TOKEN}}"
```

### ❌ No Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me
```
**Expected:** `401 Unauthorized` — `Access token required`

### ❌ Malformed Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer thisisnotavalidtoken"
```
**Expected:** `401 Unauthorized` — `Invalid access token`

### ❌ Expired Token (manually set a past-expired token)
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2IiwicmlhZiI6InN0dWRlbnQiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.fake"
```
**Expected:** `401 Unauthorized` — `Access token expired`

---

## 4. REFRESH TOKEN

### ✅ Using Cookie (from login with -c flag)
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt
```

### ✅ Using Body
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{{REFRESH_TOKEN}}"
  }'
```

### ❌ Invalid Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalidrefreshtoken"
  }'
```
**Expected:** `401 Unauthorized` — `Invalid refresh token`

### ❌ No Token Provided
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** `401 Unauthorized` — `Refresh token required`

---

## 5. VERIFY EMAIL

### ✅ Valid Token (copy from registration email or DB)
```bash
curl -X GET http://localhost:3000/api/v1/auth/verify-email/{{EMAIL_VERIFICATION_TOKEN}}
```
> Get the raw token from the email link or check MongoDB:  
> `db.users.findOne({email:"ravi.student@gmail.com"}, {emailVerificationToken:1})`  
> Note: DB stores hashed token; raw token is in the email link.

### ❌ Invalid / Already Used Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/verify-email/thisisafaketoken1234567890abcdef
```
**Expected:** `400 Bad Request` — `Invalid or expired verification token`

---

## 6. FORGOT PASSWORD

### ✅ Valid Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ravi.student@gmail.com"
  }'
```
**Expected:** `200 OK` — `If an account exists with that email, a reset link has been sent`

### ✅ Non-existent Email (still 200 — prevents enumeration)
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nobody@nowhere.com"
  }'
```
**Expected:** `200 OK` — same generic message (security by design)

### ❌ Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notvalid"
  }'
```
**Expected:** `400 Bad Request` — `Invalid email format`

### ❌ Rate Limit (run 4 times — limit is 3/hr)
```bash
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"ravi.student@gmail.com"}'
  echo ""
done
```
**Expected on 4th:** `429 Too Many Requests`

---

## 7. RESET PASSWORD

### ✅ Valid Reset (get token from email link)
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password/{{RESET_TOKEN}} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPass@9999"
  }'
```

### ❌ Invalid Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password/faketoken123 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPass@9999"
  }'
```
**Expected:** `400 Bad Request` — `Invalid or expired reset token`

### ❌ Weak New Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password/{{RESET_TOKEN}} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "weakpass"
  }'
```
**Expected:** `400 Bad Request` — password strength error

### ❌ Reuse Same Token (after successful reset)
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password/{{SAME_USED_TOKEN}} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "AnotherNew@999"
  }'
```
**Expected:** `400 Bad Request` — token already consumed

---

## 8. CHANGE PASSWORD (Protected)

### ✅ Valid Change
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Student@1234",
    "newPassword": "Changed@5678"
  }'
```

### ❌ Wrong Current Password
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "WrongOld@111",
    "newPassword": "Changed@5678"
  }'
```
**Expected:** `400 Bad Request` — `Current password is incorrect`

### ❌ New Password Same as Current
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer {{TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Student@1234",
    "newPassword": "Student@1234"
  }'
```
**Expected:** `400 Bad Request` — `New password must differ from current`

### ❌ Unauthenticated
```bash
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Student@1234",
    "newPassword": "Changed@5678"
  }'
```
**Expected:** `401 Unauthorized`

---

## 9. LOGOUT (Protected)

### ✅ Valid Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer {{TOKEN}}" \
  -b cookies.txt
```

### ✅ Use Old Token After Logout (should fail)
```bash
# After logging out, use the same token
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {{SAME_OLD_TOKEN}}"
```
**Expected:** `401 Unauthorized` — `Token has been revoked`

### ✅ Use Old Refresh Token After Logout (should fail)
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{{SAME_OLD_REFRESH_TOKEN}}"
  }'
```
**Expected:** `401 Unauthorized` — `Invalid refresh token`

---

## 10. NOSQL INJECTION TESTS

### ❌ NoSQL Injection in Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$gt": ""},
    "password": {"$gt": ""}
  }'
```
**Expected:** `400` or `401` — sanitized, not exploited

### ❌ NoSQL Injection in Email Field
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null}
  }'
```
**Expected:** `400 Bad Request` — sanitized

---

## 11. RATE LIMIT TEST

### ❌ Trigger General API Rate Limit (101 requests)
```bash
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:3000/api/v1/auth/me
done
```
**Expected:** First 100 → `401`, 101st → `429 Too Many Requests`

---

## 12. SECURITY HEADER CHECK

```bash
curl -I http://localhost:3000/health
```
**Expected headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: ...  (in production)
```

---

## 13. OVERSIZED BODY TEST

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json; print(json.dumps({'email':'a@b.com','password':'x','junk':'A'*20000}))")"
```
**Expected:** `413 Payload Too Large`

---

## 14. UNKNOWN ROUTE TEST

```bash
curl -X GET http://localhost:3000/api/v1/doesnotexist
curl -X DELETE http://localhost:3000/api/v1/auth/hack
```
**Expected:** `404 Not Found` — `Route GET /api/v1/doesnotexist not found`

---

## 🗒️ Test Accounts Summary

| Role    | Email                        | Password        | Notes                  |
|---------|------------------------------|-----------------|------------------------|
| Student | ravi.student@gmail.com       | Student@1234    | Primary student        |
| Student | amit.default@gmail.com       | Amit@9999       | No role specified      |
| Mentor  | priya.mentor@gmail.com       | Mentor@5678     | Primary mentor         |

---

## 🛠️ Useful MongoDB Queries for Testing

```js
// Find user and their verification token hash
db.users.findOne({ email: "ravi.student@gmail.com" }, {
  emailVerificationToken: 1,
  emailVerificationExpires: 1,
  passwordResetToken: 1,
  isEmailVerified: 1,
  status: 1,
  loginAttempts: 1,
  lockUntil: 1
})

// Manually verify a user (skip email)
db.users.updateOne(
  { email: "ravi.student@gmail.com" },
  { $set: { isEmailVerified: true, status: "active" } }
)

// Unlock a locked account
db.users.updateOne(
  { email: "ravi.student@gmail.com" },
  { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
)

// Suspend a user (test suspended error)
db.users.updateOne(
  { email: "ravi.student@gmail.com" },
  { $set: { status: "suspended" } }
)

// Check student profile was created
db.students.findOne({}).populate ? 
  db.students.findOne({}) : 
  db.students.findOne({})

// Check mentor profile
db.mentors.findOne({})
```

---

## 🔁 Full Happy Path Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Test User","email":"full.flow@gmail.com","password":"Flow@1234","role":"student"}'

# 2. Manually verify email in MongoDB
# db.users.updateOne({email:"full.flow@gmail.com"},{$set:{isEmailVerified:true,status:"active"}})

# 3. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"full.flow@gmail.com","password":"Flow@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token: $TOKEN"

# 4. Get Me
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Refresh
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -b cookies.txt

# 6. Change Password
curl -X PATCH http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Flow@1234","newPassword":"NewFlow@9999"}'

# 7. Login again with new password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"full.flow@gmail.com","password":"NewFlow@9999"}'

# 8. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt
```