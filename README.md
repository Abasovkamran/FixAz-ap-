# FixAz Backend API

**Stack:** Node.js · Express · MySQL · Nodemailer · JWT  
**Endpoints:** 23 | **Modules:** 7

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Fill in DB credentials and SMTP settings

# 3. Create database & run schema
mysql -u root -p -e "CREATE DATABASE fixaz_db CHARACTER SET utf8mb4;"
mysql -u root -p fixaz_db < schema.sql

# 4. Run
npm run dev        # development (nodemon)
npm start          # production
```

---

## Project Structure

```
src/
├── config/
│   ├── db.js              # MySQL pool (mysql2)
│   └── mailer.js          # Nodemailer SMTP + OTP email template
├── middleware/
│   ├── auth.js            # authenticate + authorize(...roles)
│   └── validate.js        # express-validator error handler
├── modules/
│   ├── auth/              # Module 1 — 5 endpoints
│   ├── users/             # Module 2 — 3 endpoints
│   ├── catalog/           # Module 3 — 2 endpoints
│   ├── orders/            # Module 4 — 5 endpoints
│   ├── payments/          # Module 5 — 3 endpoints
│   ├── reviews/           # Module 6 — 2 endpoints
│   └── admin/             # Module 7 — 3 endpoints
└── app.js
```

---

## Authentication

Protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## All 23 Endpoints

### Module 1 — Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/user` | — | Customer registration |
| POST | `/api/auth/register/repairman` | — | Repairman registration |
| POST | `/api/auth/verify-otp` | — | Verify email OTP |
| POST | `/api/auth/login` | — | Login → returns JWT |
| POST | `/api/auth/reset-password` | — | Reset password (2-step) |

**Register User:**
```json
{ "full_name": "Nigar Məmmədova", "phone": "+994501234567",
  "email": "nigar@example.com", "password": "SecurePass1" }
```

**Login:**
```json
{ "email": "nigar@example.com", "password": "SecurePass1" }
```
Response: `{ "token": "eyJ...", "user": { ... } }`

**Reset Password — Step 1:** `{ "email": "..." }`  
**Reset Password — Step 2:** `{ "email": "...", "code": "123456", "new_password": "NewPass1" }`

---

### Module 2 — Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | 🔒 | View own profile |
| PUT | `/api/users/profile` | 🔒 | Update own profile |
| GET | `/api/repairmen/:id` | — | Public repairman profile |

---

### Module 3 — Catalog & Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | — | List all service categories |
| GET | `/api/repairmen` | — | Search repairmen with filters |

**Search query params:**
```
?location=Nəsimi&min_price=10&max_price=50&min_rating=4&category_id=1&sort_by=price_asc&page=1&per_page=10
```
`sort_by` values: `rating` | `price_asc` | `price_desc`

---

### Module 4 — Orders

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/orders` | 🔒 | user | Create order |
| GET | `/api/orders` | 🔒 | any | List my orders |
| GET | `/api/orders/:id` | 🔒 | any | Order detail |
| PUT | `/api/orders/:id/accept` | 🔒 | repairman | Accept + set price |
| PUT | `/api/orders/:id/status` | 🔒 | user/repairman | Update status |

**Create Order:**
```json
{ "repairman_id": 3, "category_id": 1, "title": "Su borusu sızır",
  "address": "Nəsimi r., Bakı", "scheduled_at": "2025-07-15T10:00:00Z" }
```

**Status Transitions:**

| Role | From | Allowed |
|------|------|---------|
| repairman | pending | cancelled |
| repairman | accepted | in_progress, cancelled |
| repairman | in_progress | completed |
| user | pending | cancelled |
| user | accepted | cancelled |

---

### Module 5 — Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/init` | 🔒 | Initialise payment → SMARTPAY URL |
| POST | `/api/payments/webhook` | — | SMARTPAY callback (no JWT) |
| POST | `/api/payments/top-up` | 🔒 | Top up balance |

**Init Payment:**
```json
{ "order_id": 5, "method": "card", "amount": 50.00 }
```
Response includes `redirect_url` to redirect the user to SMARTPAY checkout.

**Webhook (called by SMARTPAY):**
```json
{ "provider_ref": "SP-1234", "status": "success", "amount": 50.00 }
```

**Top Up:**
```json
{ "amount": 100.00 }
```

---

### Module 6 — Reviews

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/reviews` | 🔒 | user | Submit review |
| GET | `/api/reviews/repairman/:id` | — | — | Get repairman reviews |

**Submit Review:**
```json
{ "order_id": 5, "rating": 5, "comment": "Əla iş çıxardı!" }
```
- Only for `completed` orders
- One review per order (enforced at DB and service level)
- Automatically recalculates repairman's `rating_avg` and `review_count`

---

### Module 7 — Admin

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/users` | 🔒 | admin | List all users |
| PUT | `/api/admin/repairmen/:id/approve` | 🔒 | admin | Approve repairman |
| GET | `/api/admin/statistics` | 🔒 | admin | Platform statistics |

**List Users query params:**
```
?role=repairman&search=Əli&page=1&per_page=20
```

**Statistics response includes:**
- User counts (total, by role, verified, pending approvals)
- Order counts by status
- Payment revenue totals
- Review average rating
- Last 5 orders
- Top 5 repairmen by rating

---

## Error Response Format

```json
{
  "success": false,
  "message": "Xətanın izahı",
  "errors": [
    { "field": "email", "message": "Yanlış e-poçt formatı." }
  ]
}
```
`errors` array only appears on `400 Validation` responses.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation / Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role / unverified) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Internal server error |
