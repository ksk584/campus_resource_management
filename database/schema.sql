-- ============================================================
-- Smart Campus Resource Booking & Management System
-- Database Schema for PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    department_id   SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    code            VARCHAR(10)  NOT NULL UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. USERS  (students, faculty, admins)
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');

CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            user_role     NOT NULL DEFAULT 'student',
    department_id   INT           REFERENCES departments(department_id) ON DELETE SET NULL,
    phone           VARCHAR(20),
    is_active       BOOLEAN       DEFAULT TRUE,
    no_show_count   INT           DEFAULT 0,
    total_bookings  INT           DEFAULT 0,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- 3. RESOURCE TYPES
-- ============================================================
CREATE TABLE resource_types (
    type_id     SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,   -- classroom, laboratory, seminar_hall, equipment
    description TEXT
);

-- ============================================================
-- 4. RESOURCES
-- ============================================================
CREATE TYPE resource_status AS ENUM ('available', 'maintenance', 'retired');

CREATE TABLE resources (
    resource_id     SERIAL PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    type_id         INT             NOT NULL REFERENCES resource_types(type_id) ON DELETE RESTRICT,
    department_id   INT             REFERENCES departments(department_id) ON DELETE SET NULL,
    location        VARCHAR(200),
    building        VARCHAR(100),
    floor           INT,
    capacity        INT             DEFAULT 0,
    status          resource_status DEFAULT 'available',
    description     TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_type   ON resources(type_id);
CREATE INDEX idx_resources_status ON resources(status);

-- ============================================================
-- 5. FEATURES  (projector, whiteboard, computers, AC, etc.)
-- ============================================================
CREATE TABLE features (
    feature_id  SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    icon        VARCHAR(50)  -- for UI icon reference
);

-- ============================================================
-- 6. RESOURCE_FEATURES  (M:N junction)
-- ============================================================
CREATE TABLE resource_features (
    resource_id INT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    feature_id  INT NOT NULL REFERENCES features(feature_id)   ON DELETE CASCADE,
    quantity    INT DEFAULT 1,
    PRIMARY KEY (resource_id, feature_id)
);

-- ============================================================
-- 7. BOOKINGS
-- ============================================================
CREATE TYPE booking_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'
);

CREATE TYPE booking_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE bookings (
    booking_id      SERIAL PRIMARY KEY,
    user_id         INT             NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    resource_id     INT             NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    start_time      TIMESTAMP       NOT NULL,
    end_time        TIMESTAMP       NOT NULL,
    status          booking_status  DEFAULT 'pending',
    priority        booking_priority DEFAULT 'normal',
    attendees_count INT             DEFAULT 1,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    -- Ensure end_time > start_time
    CONSTRAINT chk_booking_times CHECK (end_time > start_time),
    -- Ensure booking is at least 15 minutes
    CONSTRAINT chk_min_duration CHECK (end_time - start_time >= INTERVAL '15 minutes'),
    -- Ensure booking is at most 8 hours
    CONSTRAINT chk_max_duration CHECK (end_time - start_time <= INTERVAL '8 hours')
);

CREATE INDEX idx_bookings_user     ON bookings(user_id);
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_times    ON bookings(start_time, end_time);

-- ============================================================
-- 8. BOOKING APPROVALS
-- ============================================================
CREATE TABLE booking_approvals (
    approval_id     SERIAL PRIMARY KEY,
    booking_id      INT         NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    approved_by     INT         REFERENCES users(user_id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    comments        TEXT,
    decided_at      TIMESTAMP,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approvals_booking ON booking_approvals(booking_id);

-- ============================================================
-- 9. MAINTENANCE SCHEDULES
-- ============================================================
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE maintenance_schedules (
    maintenance_id  SERIAL PRIMARY KEY,
    resource_id     INT                NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    scheduled_by    INT                REFERENCES users(user_id) ON DELETE SET NULL,
    title           VARCHAR(200)       NOT NULL,
    description     TEXT,
    start_time      TIMESTAMP          NOT NULL,
    end_time        TIMESTAMP          NOT NULL,
    status          maintenance_status DEFAULT 'scheduled',
    created_at      TIMESTAMP          DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_maintenance_times CHECK (end_time > start_time)
);

CREATE INDEX idx_maintenance_resource ON maintenance_schedules(resource_id);
CREATE INDEX idx_maintenance_times    ON maintenance_schedules(start_time, end_time);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
    'booking_created', 'booking_approved', 'booking_rejected',
    'booking_cancelled', 'maintenance_scheduled', 'waitlist_available',
    'reminder', 'no_show'
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT               NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(200)      NOT NULL,
    message         TEXT              NOT NULL,
    is_read         BOOLEAN           DEFAULT FALSE,
    related_booking INT               REFERENCES bookings(booking_id) ON DELETE SET NULL,
    created_at      TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user   ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 11. WAITLIST
-- ============================================================
CREATE TABLE waitlist (
    waitlist_id     SERIAL PRIMARY KEY,
    user_id         INT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    resource_id     INT       NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
    desired_start   TIMESTAMP NOT NULL,
    desired_end     TIMESTAMP NOT NULL,
    priority        INT       DEFAULT 0,   -- higher = more priority
    is_active       BOOLEAN   DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_waitlist_times CHECK (desired_end > desired_start)
);

CREATE INDEX idx_waitlist_resource ON waitlist(resource_id);
CREATE INDEX idx_waitlist_active   ON waitlist(is_active) WHERE is_active = TRUE;

