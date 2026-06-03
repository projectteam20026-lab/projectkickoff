# ⚽ KickOff Jordan — Football Field Booking & Tournament Management System

A complete full-stack Arabic football platform built with **React + TypeScript** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## ✅ Features

| Feature | Status |
|---|---|
| JWT Authentication (login / register) | ✅ |
| Forgot Password — email reset link | ✅ |
| Reset Password — token verification | ✅ |
| Live Availability — booked slots blocked in real-time | ✅ |
| Field Booking System | ✅ |
| Reviews & Ratings (1–5 stars) | ✅ |
| Teams Management | ✅ |
| Tournaments / Leagues | ✅ |
| Admin Dashboard (users, bookings, fields) | ✅ |
| Role-based access (لاعب / مالك ملعب / مسؤول) | ✅ |
| Notifications System | ✅ |
| Bilingual UI (Arabic / English) | ✅ |
| MongoDB Atlas Integration | ✅ |

---

## 🗂️ Project Structure

```
kickoff-final/
├── backend/
│   ├── .env                          ← Environment variables (configure this)
│   ├── config/db.js                  ← MongoDB connection
│   ├── src/
│   │   ├── server.js                 ← Express app entry point
│   │   ├── controllers/              ← Business logic
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── fieldController.js
│   │   │   ├── adminController.js
│   │   │   ├── reviewController.js   ← NEW: Reviews
│   │   │   └── ...
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Booking.js
│   │   │   ├── Field.js
│   │   │   ├── Review.js             ← NEW: Reviews model
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── auth.js               ← /api/auth/*
│   │   │   ├── bookings.js           ← /api/bookings/* (+ /slots availability)
│   │   │   ├── fields.js             ← /api/fields/*
│   │   │   ├── reviews.js            ← NEW: /api/reviews/*
│   │   │   ├── admin.js              ← /api/admin/*
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.js               ← JWT protect + authorize
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── sendEmail.js          ← Nodemailer Gmail
│   │       └── seed.js               ← Seed database with sample data
│   └── package.json
│
└── frontend/
    ├── index.html                    ← Tailwind CDN + Font Awesome
    ├── index.tsx
    ├── App.tsx                       ← All routes defined here
    ├── types.ts                      ← TypeScript interfaces
    ├── pages/
    │   ├── Home.tsx
    │   ├── Login.tsx / LoginPage.tsx
    │   ├── ForgotPassword.tsx        ← Email form
    │   ├── ResetPassword.tsx         ← New password form
    │   ├── ExplorePage.tsx           ← Fields list + booking + reviews
    │   ├── DashboardPage.tsx
    │   ├── Leagues.tsx               ← Tournaments
    │   └── Settings.tsx
    ├── admin/
    │   ├── AdminLayout.tsx           ← Sidebar layout
    │   ├── AdminOverview.tsx         ← Stats dashboard
    │   ├── AdminUsers.tsx            ← User management
    │   ├── AdminBookings.tsx         ← Booking management
    │   └── AdminFields.tsx           ← Field management
    ├── components/
    │   ├── BookingModal.tsx          ← FIXED: live availability slots
    │   ├── FieldReviews.tsx          ← NEW: Stars + comments
    │   ├── Navbar.tsx
    │   ├── MainLayout.tsx
    │   └── guards/
    │       ├── PrivateRoute.tsx
    │       └── AdminRoute.tsx
    ├── services/
    │   ├── api.ts                    ← All Axios calls (+ reviews API)
    │   └── backend.ts                ← BackendService class
    └── contexts/
        ├── AuthContext.tsx
        └── LanguageContext.tsx
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password for email

### 1. Configure Backend `.env`

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kickoff_jordan
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # 16-char Gmail App Password
EMAIL_FROM=KickOff Jordan <your@gmail.com>
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. (Optional) Seed the Database

```bash
cd backend
npm run seed
```

This creates sample fields, users (including an admin), and bookings.

**Admin credentials after seeding:**
- Email: `admin@kickoff.jo`
- Password: `admin123`

### 4. Run Backend

```bash
cd backend
npm run dev      # development with nodemon
# or
npm start        # production
```

Backend runs on: `http://localhost:5000`

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/me` | ✅ | Update profile |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| POST | `/api/auth/reset-password/:token` | — | Reset password |

### Fields
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fields` | — | List all fields |
| POST | `/api/fields` | ✅ Owner | Create field |
| PUT | `/api/fields/:id` | ✅ Owner | Update field |
| DELETE | `/api/fields/:id` | ✅ Owner | Delete field |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/bookings/slots?fieldId=&date=` | — | **Live availability** |
| GET | `/api/bookings` | ✅ | My bookings |
| POST | `/api/bookings` | ✅ | Create booking |
| PUT | `/api/bookings/:id/cancel` | ✅ | Cancel booking |

### Reviews (NEW)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews?fieldId=` | — | Get field reviews |
| GET | `/api/reviews/my?fieldId=` | ✅ | Get my review |
| POST | `/api/reviews` | ✅ | Create/update review |
| DELETE | `/api/reviews/:id` | ✅ | Delete review |

### Admin (مسؤول only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET/DELETE/PUT | `/api/admin/users/*` | User management |
| GET/PUT/DELETE | `/api/admin/bookings/*` | Booking management |
| GET/POST/PUT/DELETE | `/api/admin/fields/*` | Field management |
| GET/POST/PUT/DELETE | `/api/admin/tournaments/*` | Tournament management |

---

## 🔑 Admin Access

1. Register a user
2. In MongoDB Atlas, find the user document and change `role` to `"مسؤول"`
3. Login — you will be redirected to `/admin/dashboard`

Or seed the database (`npm run seed`) which creates the admin automatically.

---

## 🛠️ What Was Fixed & Added

### Backend
- ✅ Added `Review` model with automatic average rating calculation
- ✅ Added `reviewController.js` with create/update/delete/get
- ✅ Added `/api/reviews` routes
- ✅ Registered reviews routes in `server.js`
- ✅ All existing routes were already complete and working

### Frontend
- ✅ `BookingModal.tsx` — **completely rewired** to use live `/api/bookings/slots` endpoint. Booked slots show in red with "محجوز" label and are disabled. Only available slots are clickable.
- ✅ `FieldReviews.tsx` — **new component**: star rating widget, submit/edit/delete review, distribution chart, average rating display
- ✅ `ExplorePage.tsx` — added ⭐ review button on each field card; clicking opens a slide-in reviews panel
- ✅ `services/api.ts` — added `getReviewsAPI`, `createReviewAPI`, `deleteReviewAPI`, `getMyReviewAPI`
- ✅ `Explore.tsx` — added optional `onReview` prop, review button next to book button

### Already Working (No Changes Needed)
- Auth (login, register, JWT)
- Forgot password / Reset password (full email flow)
- Admin dashboard (users, bookings, fields, stats)
- Teams and Tournaments
- Notifications
- Role-based routing (PrivateRoute, AdminRoute)
- MongoDB connection
- CORS, error handling
