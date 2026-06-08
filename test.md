# MentorOS Marketplace — API Test Guide

> **Base URL:** `http://localhost:3000/api/v1`  
> **Auth:** `Authorization: Bearer {{ACCESS_TOKEN}}`  
> **Cookie jar:** use `-c cookies.txt` on login, `-b cookies.txt` on protected calls.

---

## Test Accounts to Register First

| Role    | Name           | Email                    | Password       |
|---------|----------------|--------------------------|----------------|
| Student | Ravi Kumar     | ravi@test.com            | Student@1234   |
| Mentor  | Priya Sharma   | priya@test.com           | Mentor@5678    |
| Admin   | (create via DB)| admin@test.com           | Admin@9999     |

**Manually verify + activate users in MongoDB:**
```js
db.users.updateMany({}, { $set: { isEmailVerified: true, status: "active" } })

// Promote to admin
db.users.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } })
```

**Create and approve mentor profile in MongoDB:**
```js
// After registering priya@test.com, get her userId, then:
db.mentors.updateOne(
  { user: ObjectId("PRIYA_USER_ID") },
  { $set: { 
    mentorStatus: "approved",
    isVerified: true,
    company: "Google",
    currentRole: "Senior SDE",
    expertise: ["JavaScript", "Node.js", "System Design"],
    experience: 5,
    hourlyRate: 1500,
    rating: 0,
    totalReviews: 0
  }}
)
```

---

## 0. Health Check

```bash
curl -X GET http://localhost:3000/health
```
**Expected:** `200 { status: "ok" }`

---

## 1. AUTH — Login & Get Tokens

### Login as Student
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"ravi@test.com","password":"Student@1234"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('STUDENT_TOKEN:', d['data']['accessToken'])"
```

### Login as Mentor
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c mentor_cookies.txt \
  -d '{"email":"priya@test.com","password":"Mentor@5678"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('MENTOR_TOKEN:', d['data']['accessToken'])"
```

### Login as Admin
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@9999"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('ADMIN_TOKEN:', d['data']['accessToken'])"
```

---

## 2. EXPLORE — Browse Mentors (Public)

### ✅ Get All Approved Mentors
```bash
curl -X GET "http://localhost:3000/api/v1/mentors"
```
**Expected:** `200` with `mentors[]` array + `meta` pagination.

### ✅ Filter by Company
```bash
curl -X GET "http://localhost:3000/api/v1/mentors?company=Google"
```

### ✅ Filter by Skill
```bash
curl -X GET "http://localhost:3000/api/v1/mentors?skill=Node.js"
```

### ✅ Filter by Experience
```bash
curl -X GET "http://localhost:3000/api/v1/mentors?minExperience=3&maxExperience=10"
```

### ✅ Filter by Rating
```bash
curl -X GET "http://localhost:3000/api/v1/mentors?minRating=4"
```

### ✅ Pagination + Sort
```bash
curl -X GET "http://localhost:3000/api/v1/mentors?page=1&limit=5&sort=experience&order=desc"
```

### ✅ Get Single Mentor Profile
```bash
# Replace MENTOR_USER_ID with priya's _id from User collection
curl -X GET "http://localhost:3000/api/v1/mentors/{{MENTOR_USER_ID}}"
```
**Expected:** `200` with mentor profile + populated user name/avatar.

### ❌ Non-existent Mentor
```bash
curl -X GET "http://localhost:3000/api/v1/mentors/000000000000000000000000"
```
**Expected:** `404 Mentor not found`

### ✅ Get Mentor Reviews (empty initially)
```bash
curl -X GET "http://localhost:3000/api/v1/mentors/{{MENTOR_USER_ID}}/reviews"
```

---

## 3. PACKAGES — Mentor manages session plans

> Use `{{MENTOR_TOKEN}}` for all package writes.

### ✅ Create Package — 30 min
```bash
curl -X POST http://localhost:3000/api/v1/packages \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "30 Minute Career Guidance",
    "duration": 30,
    "price": 999,
    "description": "Quick career advice session"
  }'
```
**Expected:** `201` with `package._id` — **save as `{{PACKAGE_ID_30}}`**

### ✅ Create Package — 60 min
```bash
curl -X POST http://localhost:3000/api/v1/packages \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1 Hour Deep Dive",
    "duration": 60,
    "price": 1799,
    "description": "In-depth technical session"
  }'
```
**Expected:** `201` — save as `{{PACKAGE_ID_60}}`

### ❌ Package by Unauthenticated
```bash
curl -X POST http://localhost:3000/api/v1/packages \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","duration":30,"price":999}'
```
**Expected:** `401 Access token required`

### ❌ Package by Student (wrong role)
```bash
curl -X POST http://localhost:3000/api/v1/packages \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","duration":30,"price":999}'
```
**Expected:** `403 Access denied`

### ❌ Invalid duration (below minimum)
```bash
curl -X POST http://localhost:3000/api/v1/packages \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Too Short","duration":5,"price":100}'
```
**Expected:** `400` — duration validation error

### ✅ Get Mentor's Packages (Public)
```bash
curl -X GET "http://localhost:3000/api/v1/packages/{{MENTOR_USER_ID}}"
```
**Expected:** `200` with 2 packages.

### ✅ Update Package
```bash
curl -X PUT http://localhost:3000/api/v1/packages/{{PACKAGE_ID_30}} \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"price": 1099, "description": "Updated description"}'
```

### ✅ Deactivate Package
```bash
curl -X PUT http://localhost:3000/api/v1/packages/{{PACKAGE_ID_30}} \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### ✅ Delete Package
```bash
# Delete the 60 min one to keep for booking test
curl -X DELETE http://localhost:3000/api/v1/packages/{{PACKAGE_ID_60}} \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}"
```
**Re-create a 60 min package if needed for booking tests.**

---

## 4. AVAILABILITY — Mentor creates bookable slots

> All slots must be future dates. Adjust dates accordingly.

### ✅ Create Slot 1 (tomorrow 7 PM - 8 PM)
```bash
# Set tomorrow's date
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v +1d +%Y-%m-%d)

curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"startTime\": \"${TOMORROW}T13:30:00.000Z\",
    \"endTime\": \"${TOMORROW}T14:30:00.000Z\"
  }"
```
**Expected:** `201` — save `_id` as `{{SLOT_ID_1}}`

### ✅ Create Slot 2 (day after tomorrow 8 PM - 9 PM)
```bash
DAY_AFTER=$(date -d "+2 days" +%Y-%m-%d 2>/dev/null || date -v +2d +%Y-%m-%d)

curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"startTime\": \"${DAY_AFTER}T14:30:00.000Z\",
    \"endTime\": \"${DAY_AFTER}T15:30:00.000Z\"
  }"
```
**Expected:** `201` — save as `{{SLOT_ID_2}}`

### ❌ Slot in the Past
```bash
curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{"startTime":"2020-01-01T10:00:00.000Z","endTime":"2020-01-01T11:00:00.000Z"}'
```
**Expected:** `400 Slot must be in the future`

### ❌ End before Start
```bash
curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"startTime\":\"${TOMORROW}T15:00:00.000Z\",\"endTime\":\"${TOMORROW}T14:00:00.000Z\"}"
```
**Expected:** `400 End time must be after start time`

### ❌ Overlapping Slot
```bash
# Try to create a slot that overlaps with SLOT_ID_1
curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"startTime\":\"${TOMORROW}T14:00:00.000Z\",\"endTime\":\"${TOMORROW}T15:00:00.000Z\"}"
```
**Expected:** `409 Slot overlaps with an existing slot`

### ✅ Get Mentor Available Slots (Public)
```bash
curl -X GET "http://localhost:3000/api/v1/availability/{{MENTOR_USER_ID}}?available=true"
```
**Expected:** `200` with 2 slots, both `isBooked: false`

### ✅ Get All Slots (including booked)
```bash
curl -X GET "http://localhost:3000/api/v1/availability/{{MENTOR_USER_ID}}"
```

### ✅ Delete a Slot (mentor only, before booking)
```bash
curl -X DELETE http://localhost:3000/api/v1/availability/{{SLOT_ID_2}} \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}"
```
**Re-create SLOT_ID_2 after this test.**

---

## 5. PAYMENT — Create Order (Student Booking Flow)

> This is the core booking initiation. Student picks mentor + package + slot.

### ✅ Create Payment Order
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"mentorId\":       \"{{MENTOR_USER_ID}}\",
    \"packageId\":      \"{{PACKAGE_ID_30}}\",
    \"availabilityId\": \"{{SLOT_ID_1}}\"
  }"
```
**Expected:** `201` with:
```json
{
  "orderId": "order_xxx",
  "amount": 99900,
  "currency": "INR",
  "bookingId": "...",
  "paymentId": "...",
  "keyId": "rzp_test_xxx"
}
```
Save `bookingId` as `{{BOOKING_ID}}`, `orderId` as `{{RZP_ORDER_ID}}`

### ❌ Book same slot again (slot now locked)
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"mentorId\":       \"{{MENTOR_USER_ID}}\",
    \"packageId\":      \"{{PACKAGE_ID_30}}\",
    \"availabilityId\": \"{{SLOT_ID_1}}\"
  }"
```
**Expected:** `409 Slot is no longer available`

### ❌ Book with wrong package (doesn't belong to mentor)
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"mentorId\":       \"{{MENTOR_USER_ID}}\",
    \"packageId\":      \"000000000000000000000000\",
    \"availabilityId\": \"{{SLOT_ID_2}}\"
  }"
```
**Expected:** `404 Package not found or inactive`

### ❌ Mentor tries to book (wrong role)
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"mentorId\":\"{{MENTOR_USER_ID}}\",\"packageId\":\"{{PACKAGE_ID_30}}\",\"availabilityId\":\"{{SLOT_ID_2}}\"}"
```
**Expected:** `403 Access denied`

---

## 6. PAYMENT — Verify (Simulate Payment Success)

> In test mode: generate a fake-but-valid signature using your RAZORPAY_KEY_SECRET.

### Generate Test Signature (Node.js)
```js
const crypto = require('crypto');
const keySecret = 'your_razorpay_key_secret';
const razorpayOrderId  = '{{RZP_ORDER_ID}}';
const razorpayPaymentId = 'pay_test_' + Date.now();

const sig = crypto
  .createHmac('sha256', keySecret)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

console.log({ razorpayOrderId, razorpayPaymentId, signature: sig });
```

### ✅ Verify Payment + Provide Meeting Data
```bash
curl -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayOrderId":  "{{RZP_ORDER_ID}}",
    "razorpayPaymentId":"{{RZP_PAYMENT_ID}}",
    "razorpaySignature":"{{COMPUTED_SIGNATURE}}",
    "meetingData": {
      "roomId":      "room_abc123",
      "provider":    "livekit",
      "meetingLink": "https://meet.yourdomain.com/room_abc123?token=student_jwt",
      "hostLink":    "https://meet.yourdomain.com/room_abc123?token=mentor_jwt"
    }
  }'
```
**Expected:** `200` with `{ bookingId, meetingLink }`  
Booking status → `confirmed`  
Slot `isBooked` → `true`

### ❌ Invalid Signature
```bash
curl -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpayOrderId":"order_fake",
    "razorpayPaymentId":"pay_fake",
    "razorpaySignature":"invalidsignature",
    "meetingData":{"roomId":"r","provider":"lk","meetingLink":"https://x.com"}
  }'
```
**Expected:** `400 Payment verification failed: invalid signature`

---

## 7. BOOKINGS — Dashboard Queries

### ✅ Student: Get My Bookings
```bash
curl -X GET http://localhost:3000/api/v1/bookings/my \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```
**Expected:** `200` with booking list showing `status: "confirmed"` + `meetingLink`

### ✅ Student: Filter by Status
```bash
curl -X GET "http://localhost:3000/api/v1/bookings/my?status=confirmed" \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```

### ✅ Mentor: Get My Bookings
```bash
curl -X GET http://localhost:3000/api/v1/bookings/mentor \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}"
```
**Expected:** `200` with student name, date, time, duration, meetingLink

### ✅ Get Single Booking Detail
```bash
curl -X GET http://localhost:3000/api/v1/bookings/{{BOOKING_ID}} \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```

### ❌ Access another user's booking
```bash
# Login as a different student and try to access this booking
curl -X GET http://localhost:3000/api/v1/bookings/{{BOOKING_ID}} \
  -H "Authorization: Bearer {{OTHER_STUDENT_TOKEN}}"
```
**Expected:** `403 Access denied`

---

## 8. MEETINGS — Get Meeting Details

### ✅ Student gets meeting link
```bash
curl -X GET http://localhost:3000/api/v1/meetings/{{BOOKING_ID}} \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```
**Expected:** `200` with `meetingLink` (student join URL)

### ✅ Mentor gets meeting link (gets hostLink)
```bash
curl -X GET http://localhost:3000/api/v1/meetings/{{BOOKING_ID}} \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}"
```
**Expected:** `200` with both `meetingLink` and `hostLink`

### ❌ Unauthenticated
```bash
curl -X GET http://localhost:3000/api/v1/meetings/{{BOOKING_ID}}
```
**Expected:** `401`

---

## 9. RESCHEDULE FLOW

> Mentor requests → Student accepts or rejects.  
> First, create a new available slot for the mentor.

### Step 1: Mentor Creates New Slot for Reschedule
```bash
NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d 2>/dev/null || date -v +7d +%Y-%m-%d)

curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"startTime\":\"${NEXT_WEEK}T14:30:00.000Z\",\"endTime\":\"${NEXT_WEEK}T15:30:00.000Z\"}"
```
Save new `_id` as `{{NEW_SLOT_ID}}`

### Step 2: Mentor Requests Reschedule
```bash
curl -X POST http://localhost:3000/api/v1/bookings/{{BOOKING_ID}}/reschedule \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"newAvailabilityId\": \"{{NEW_SLOT_ID}}\",
    \"reason\": \"Emergency meeting conflict\"
  }"
```
**Expected:** `200` — booking `status: "reschedule_requested"`

### ❌ Mentor tries to reschedule already-pending-reschedule booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings/{{BOOKING_ID}}/reschedule \
  -H "Authorization: Bearer {{MENTOR_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"newAvailabilityId\":\"{{NEW_SLOT_ID}}\"}"
```
**Expected:** `400 Only confirmed bookings can be rescheduled`

### Step 3A: Student Accepts Reschedule
```bash
curl -X POST http://localhost:3000/api/v1/bookings/{{BOOKING_ID}}/accept-reschedule \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```
**Expected:** `200` — booking `status: "rescheduled"`, old slot freed, new slot booked.

### Step 3B: (Alternative) Student Rejects Reschedule
> Reset booking to `reschedule_requested` in DB first, then:
```bash
curl -X POST http://localhost:3000/api/v1/bookings/{{BOOKING_ID}}/reject-reschedule \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```
**Expected:** `200` — booking `status: "confirmed"` again, reschedule fields cleared.

### ❌ Student tries to request reschedule (wrong role)
```bash
curl -X POST http://localhost:3000/api/v1/bookings/{{BOOKING_ID}}/reschedule \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"newAvailabilityId\":\"{{NEW_SLOT_ID}}\"}"
```
**Expected:** `403 Access denied`

---

## 10. REVIEWS — After Session Completes

> Reviews can only be submitted for `completed` bookings. Manually mark as complete:
```js
db.bookings.updateOne(
  { _id: ObjectId("{{BOOKING_ID}}") },
  { $set: { status: "completed" } }
)
```

### ✅ Submit Review
```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookingId\": \"{{BOOKING_ID}}\",
    \"rating\": 5,
    \"review\": \"Excellent session! Very clear explanations.\"
  }"
```
**Expected:** `201` with review. Mentor's `rating` and `totalReviews` auto-updated.

### ❌ Submit Again (duplicate)
```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"{{BOOKING_ID}}\",\"rating\":3}"
```
**Expected:** `409 Review already submitted for this booking`

### ❌ Review non-completed booking
```bash
# Create a new confirmed booking, then try to review it
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"{{CONFIRMED_BOOKING_ID}}\",\"rating\":4}"
```
**Expected:** `400 Can only review completed sessions`

### ✅ Get Mentor Reviews (now has 1 review)
```bash
curl -X GET "http://localhost:3000/api/v1/reviews/{{MENTOR_USER_ID}}"
```
**Expected:** `200` with review + updated `total`

### ✅ Get Mentor Reviews Paginated
```bash
curl -X GET "http://localhost:3000/api/v1/reviews/{{MENTOR_USER_ID}}?page=1&limit=5"
```

---

## 11. ADMIN APIs

> Use `{{ADMIN_TOKEN}}`

### ✅ List All Users
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### ✅ Block User
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/{{STUDENT_USER_ID}}/block \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```
**Expected:** `200` — user `status: "suspended"`

### ✅ Verify Blocked User Can't Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ravi@test.com","password":"Student@1234"}'
```
**Expected:** `403 Your account has been suspended`

### ✅ Soft Delete User
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/{{SOME_USER_ID}}/delete \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### ✅ Approve Mentor
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/mentors/{{MENTOR_USER_ID}}/approve \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```
**Expected:** `200` — `mentorStatus: "approved"`, `isVerified: true`

### ✅ Reject Mentor
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/mentors/{{MENTOR_USER_ID}}/reject \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```
**Expected:** `200` — `mentorStatus: "rejected"`

### ✅ List All Bookings
```bash
curl -X GET "http://localhost:3000/api/v1/admin/bookings?page=1&limit=20" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### ✅ List All Payments
```bash
curl -X GET "http://localhost:3000/api/v1/admin/payments?page=1&limit=20" \
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

### ❌ Non-admin Accessing Admin Route
```bash
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer {{STUDENT_TOKEN}}"
```
**Expected:** `403 Access denied. Required role: admin`

---

## 12. PAYMENT WEBHOOK (Razorpay Simulation)

> Simulate what Razorpay sends after `payment.captured` event.

### Generate Webhook Signature (Node.js)
```js
const crypto = require('crypto');
const webhookSecret = 'your_razorpay_webhook_secret';
const body = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_test_webhook',
        order_id: '{{RZP_ORDER_ID}}',
        amount: 99900,
        currency: 'INR'
      }
    }
  }
});

const sig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
console.log('Signature:', sig);
console.log('Body:', body);
```

### ✅ Send Webhook
```bash
curl -X POST http://localhost:3000/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: {{WEBHOOK_SIGNATURE}}" \
  -d '{{WEBHOOK_BODY}}'
```
**Expected:** `200 { "received": true }`

### ❌ Invalid Webhook Signature
```bash
curl -X POST http://localhost:3000/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: invalidsig" \
  -d '{"event":"payment.captured"}'
```
**Expected:** `401 Invalid webhook signature`

---

## 13. FULL HAPPY PATH — End to End

```bash
#!/bin/bash
BASE="http://localhost:3000/api/v1"

# 1. Login student
STUDENT_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ravi@test.com","password":"Student@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Student Token: $STUDENT_TOKEN"

# 2. Login mentor
MENTOR_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya@test.com","password":"Mentor@5678"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
echo "Mentor Token: $MENTOR_TOKEN"

# 3. Mentor: Get user ID
MENTOR_ID=$(curl -s $BASE/auth/me -H "Authorization: Bearer $MENTOR_TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['_id'])")
echo "Mentor ID: $MENTOR_ID"

# 4. Mentor: Create package
PKG_ID=$(curl -s -X POST $BASE/packages \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"E2E Session","duration":30,"price":500}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['package']['_id'])")
echo "Package ID: $PKG_ID"

# 5. Mentor: Create availability slot
TOMORROW=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v +1d +%Y-%m-%d)
SLOT_ID=$(curl -s -X POST $BASE/availability \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"startTime\":\"${TOMORROW}T10:00:00.000Z\",\"endTime\":\"${TOMORROW}T10:30:00.000Z\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['slot']['_id'])")
echo "Slot ID: $SLOT_ID"

# 6. Student: Create payment order
ORDER=$(curl -s -X POST $BASE/payments/create-order \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"mentorId\":\"$MENTOR_ID\",\"packageId\":\"$PKG_ID\",\"availabilityId\":\"$SLOT_ID\"}")
ORDER_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['orderId'])")
BOOKING_ID=$(echo $ORDER | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['bookingId'])")
echo "Razorpay Order: $ORDER_ID | Booking: $BOOKING_ID"

# 7. Generate valid signature (requires RAZORPAY_KEY_SECRET env var)
PAY_ID="pay_e2e_$(date +%s)"
SIG=$(node -e "
  const c=require('crypto'),s=process.env.RAZORPAY_KEY_SECRET||'test_secret';
  console.log(c.createHmac('sha256',s).update('$ORDER_ID|$PAY_ID').digest('hex'))
")

# 8. Verify payment
curl -s -X POST $BASE/payments/verify \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"razorpayOrderId\":\"$ORDER_ID\",
    \"razorpayPaymentId\":\"$PAY_ID\",
    \"razorpaySignature\":\"$SIG\",
    \"meetingData\":{
      \"roomId\":\"room_e2e\",
      \"provider\":\"livekit\",
      \"meetingLink\":\"https://meet.test/room_e2e?t=student\",
      \"hostLink\":\"https://meet.test/room_e2e?t=mentor\"
    }
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Meeting Link:', d.get('data',{}).get('meetingLink','N/A'))"

# 9. Student: View booking
curl -s $BASE/bookings/$BOOKING_ID -H "Authorization: Bearer $STUDENT_TOKEN" \
  | python3 -c "import sys,json; b=json.load(sys.stdin)['data']['booking']; print('Status:', b['status'])"

echo "E2E test complete!"
```

---

## 🗒️ MongoDB Validation Queries

```js
// Verify booking flow state
db.bookings.findOne({ _id: ObjectId("{{BOOKING_ID}}") }, {
  status: 1, scheduledAt: 1, duration: 1, payment: 1, meeting: 1
})

// Verify slot is marked booked
db.availabilities.findOne({ _id: ObjectId("{{SLOT_ID_1}}") }, { isBooked: 1 })

// Check payment was created
db.payments.findOne({ booking: ObjectId("{{BOOKING_ID}}") })

// Check meeting was created
db.meetings.findOne({ booking: ObjectId("{{BOOKING_ID}}") }, { meetingLink: 1, status: 1 })

// Check mentor rating after review
db.mentors.findOne({ user: ObjectId("{{MENTOR_USER_ID}}") }, { rating: 1, totalReviews: 1 })

// Verify reschedule fields cleared after rejection
db.bookings.findOne({ _id: ObjectId("{{BOOKING_ID}}") }, {
  status: 1, rescheduleRequestedBy: 1, rescheduleReason: 1
})
```

---

## 📊 Test Status Checklist

| # | Test | Status |
|---|------|--------|
| 1 | Student/Mentor/Admin login | ⬜ |
| 2 | Explore: list, filter, single mentor | ⬜ |
| 3 | Package: CRUD + role guard | ⬜ |
| 4 | Availability: create, overlap check, delete | ⬜ |
| 5 | Payment: create order + slot lock | ⬜ |
| 6 | Payment: verify + booking confirmed | ⬜ |
| 7 | Booking: student/mentor dashboard | ⬜ |
| 8 | Meeting: get link (access control) | ⬜ |
| 9 | Reschedule: request → accept → reject | ⬜ |
| 10 | Review: submit, duplicate guard, rating update | ⬜ |
| 11 | Admin: users, block, approve mentor | ⬜ |
| 12 | Webhook simulation | ⬜ |
| 13 | Full E2E happy path | ⬜ |
