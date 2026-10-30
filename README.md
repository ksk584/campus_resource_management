# Smart Campus Resource Booking & Management System

A full-stack, enterprise-grade resource booking platform designed for colleges and universities to manage lecture halls, laboratories, seminar auditoriums, and campus equipment with automated conflict prevention, role-based workflows, and utilization analytics.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons, React Router DOM v6
- **Backend**: Node.js, Express.js, `pg` (PostgreSQL Client Driver with parameterized SQL queries), JSON Web Tokens (JWT), Bcrypt
- **Database**: PostgreSQL 18 (utilizing Raw SQL: Constraints, Triggers, Views, and Stored Procedures)
- **ORM**: None — Pure raw SQL to highlight relational database concepts

---

## 🏗️ Project Architecture

```
campus_resource_booking/
├── backend/
│   ├── .env
│   ├── package.json
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # pg Pool client connection
│   │   │   ├── setup.js          # Automated database creator & migration runner
│   │   │   ├── schema.sql        # Full schema: tables, triggers, views, procedures
│   │   │   └── seed.sql          # Seed departments, users, resources, bookings
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication & requireRole RBAC guard
│   │   ├── routes/
│   │   │   ├── auth.js           # /api/auth (register, login, me)
│   │   │   ├── resources.js      # /api/resources (search, list, CRUD)
│   │   │   ├── bookings.js       # /api/bookings (reserve, cancel, approve, reject)
│   │   │   ├── waitlist.js       # /api/waitlist (join, view, leave waitlist)
│   │   │   ├── maintenance.js    # /api/maintenance (schedules, cancellations)
│   │   │   ├── analytics.js      # /api/analytics (utilization, user reliability)
│   │   │   ├── notifications.js  # /api/notifications (paginated, unread count)
│   │   │   └── departments.js    # /api/departments, resource-types, features
│   │   └── server.js             # Express application & error handling
│
├── database/
│   ├── schema.sql                # Relational tables & check constraints
│   ├── triggers.sql              # Conflict detection & notification triggers
│   ├── views.sql                 # Aggregated analytics & scheduling views
│   ├── procedures.sql            # Stored procedures (search, create, decide, report)
│   ├── seed.sql                  # Initial seed dataset
│   └── init.sql                  # psql master initialization script
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── api/                  # API client & endpoint abstractions
        ├── components/           # Reusable UI (Navbar, Sidebar, Modals, Badges)
        ├── context/              # AuthContext (JWT session & RBAC)
        └── pages/                # Dashboard, Search, Details, Bookings, Approvals,
                                  # Maintenance, Analytics, Waitlist, Login, Register
```

---

## 🗄️ Database Concepts Implemented

### 1. Triggers (`database/triggers.sql`)
1. **`trg_check_booking_conflict`**: Runs `BEFORE INSERT OR UPDATE` on `bookings` to ensure no two approved/pending bookings overlap on the same resource.
2. **`trg_check_maintenance_conflict`**: Runs `BEFORE INSERT OR UPDATE` to prevent reservations from being made while a resource is under scheduled maintenance.
3. **`trg_create_booking_approval`**: Runs `AFTER INSERT` on `bookings` to auto-create a linked approval record in `booking_approvals`.
4. **`trg_sync_approval_to_booking`**: Runs `AFTER UPDATE` on `booking_approvals` to automatically synchronize the status (`approved` or `rejected`) to the master booking record.
5. **`trg_booking_status_notification`**: Runs `AFTER UPDATE` on `bookings` to automatically generate in-app user notifications when a booking is approved, rejected, or cancelled.
6. **`trg_notify_waitlist_on_cancel`**: Automatically queries active waitlisted users when a booking is cancelled and sends them high-priority availability notifications.
7. **`trg_update_user_stats_insert` / `trg_update_user_stats_update`**: Keeps running totals of user bookings and no-show occurrences for academic reliability scoring.

### 2. Stored Procedures (`database/procedures.sql`)
1. **`sp_search_available_resources`**: Multi-criteria search (type, capacity, location, feature tags) with conflict detection against both bookings and maintenance windows.
2. **`sp_create_booking`**: Creates a reservation, checks capacity, evaluates the user's historical no-show rate (downgrading priority to `low` if > 30%), and dispatches confirmation notifications.
3. **`sp_cancel_booking`**: Verifies booking ownership or admin privileges before cancelling and releasing the slot.
4. **`sp_decide_booking`**: Admin procedure to approve or reject a reservation with review comments.
5. **`sp_resource_utilization_report`**: Calculates total hours utilized, completion rate, no-show rate, and percentage utilization over any date range.

### 3. Views (`database/views.sql`)
- **`vw_resource_overview`**: Real-time snapshot of resources, active bookings today, and equipped features.
- **`vw_upcoming_bookings`**: Enriched join of upcoming bookings with user and room specs.
- **`vw_resource_utilization`**: Lifetime utilization and attendance statistics per resource.
- **`vw_user_booking_summary`**: User booking stats with flag for high no-show risk.
- **`vw_today_schedule`**: Live daily schedule per resource.
- **`vw_maintenance_overview`**: Scheduled maintenance blackout windows.

---

## ⚡ Quick Start Guide

### Step 1: Initialize the Database
Make sure PostgreSQL is running on `localhost:5432`. Verify your connection credentials in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campus_booking
JWT_SECRET=campus_booking_secret_key_2026
JWT_EXPIRES_IN=24h
PORT=5000
```

Run the automated setup script to create the database, tables, constraints, triggers, views, stored procedures, and seed data:
```bash
cd backend
npm run db:setup
```

*(Alternatively, run `psql -U postgres -f database/init.sql`)*

---

### Step 2: Start the Backend Server
```bash
cd backend
npm run dev
```
The API server will run at `http://localhost:5000`.

---

### Step 3: Start the Frontend Application
```bash
cd frontend
npm run dev
```
The client app will launch at `http://localhost:5173`.

---

## 🔑 Demo User Credentials

The system comes pre-seeded with test accounts for each role (all passwords are `password123`):

| Role | Email | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rvce.edu.in` | `password123` | Full access, Approvals Queue, Maintenance Manager, Facility Analytics, Resource Management |
| **Faculty** | `ramesh@rvce.edu.in` | `password123` | Search & Book, Department Schedules, Utilization Reports, Booking History |
| **Faculty** | `meena@rvce.edu.in` | `password123` | Search & Book, Department Schedules, Utilization Reports, Booking History |
| **Student** | `kiran@rvce.edu.in` | `password123` | Search & Book, My Bookings, Waitlists, In-App Notifications |
| **Student** | `pranav@rvce.edu.in` | `password123` | Search & Book, My Bookings, Waitlists, In-App Notifications |

*Tip: The login page includes 1-click demo buttons to sign in instantly as any role.*

