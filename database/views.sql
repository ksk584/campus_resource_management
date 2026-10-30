-- ============================================================
-- VIEWS for Smart Campus Resource Booking System
-- ============================================================

-- ============================================================
-- 1. Resource availability overview
-- ============================================================
CREATE OR REPLACE VIEW vw_resource_overview AS
SELECT
    r.resource_id,
    r.name AS resource_name,
    rt.name AS resource_type,
    r.location,
    r.building,
    r.floor,
    r.capacity,
    r.status,
    d.name AS department_name,
    COALESCE(
        (SELECT COUNT(*) FROM bookings b
         WHERE b.resource_id = r.resource_id
           AND b.status IN ('pending', 'approved')
           AND b.start_time <= CURRENT_TIMESTAMP
           AND b.end_time   >= CURRENT_TIMESTAMP),
        0
    ) AS current_bookings,
    COALESCE(
        (SELECT COUNT(*) FROM bookings b
         WHERE b.resource_id = r.resource_id
           AND b.status IN ('pending', 'approved')
           AND b.start_time >= CURRENT_DATE
           AND b.start_time <  CURRENT_DATE + INTERVAL '1 day'),
        0
    ) AS today_bookings,
    ARRAY(
        SELECT f.name FROM features f
        JOIN resource_features rf ON rf.feature_id = f.feature_id
        WHERE rf.resource_id = r.resource_id
    ) AS features
FROM resources r
JOIN resource_types rt ON rt.type_id = r.type_id
LEFT JOIN departments d ON d.department_id = r.department_id;

-- ============================================================
-- 2. Upcoming bookings with user and resource details
-- ============================================================
CREATE OR REPLACE VIEW vw_upcoming_bookings AS
SELECT
    b.booking_id,
    b.title,
    b.description,
    b.start_time,
    b.end_time,
    b.status,
    b.priority,
    b.attendees_count,
    b.created_at,
    u.user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.role AS user_role,
    r.resource_id,
    r.name AS resource_name,
    rt.name AS resource_type,
    r.location,
    r.building,
    ba.status AS approval_status,
    ba.comments AS approval_comments
FROM bookings b
JOIN users u     ON u.user_id = b.user_id
JOIN resources r ON r.resource_id = b.resource_id
JOIN resource_types rt ON rt.type_id = r.type_id
LEFT JOIN booking_approvals ba ON ba.booking_id = b.booking_id
WHERE b.start_time >= CURRENT_TIMESTAMP
ORDER BY b.start_time ASC;

-- ============================================================
-- 3. Resource utilization analytics
-- ============================================================
CREATE OR REPLACE VIEW vw_resource_utilization AS
SELECT
    r.resource_id,
    r.name AS resource_name,
    rt.name AS resource_type,
    r.capacity,
    COUNT(b.booking_id) AS total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS completed_bookings,
    COUNT(CASE WHEN b.status = 'no_show'   THEN 1 END) AS no_show_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) AS cancelled_bookings,
    ROUND(
        COALESCE(
            COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::NUMERIC /
            NULLIF(COUNT(CASE WHEN b.status IN ('completed','no_show') THEN 1 END), 0) * 100,
            0
        ), 1
    ) AS attendance_rate,
    COALESCE(
        SUM(
            CASE WHEN b.status = 'completed'
            THEN EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
            ELSE 0 END
        ), 0
    )::NUMERIC(10,1) AS total_hours_used
FROM resources r
JOIN resource_types rt ON rt.type_id = r.type_id
LEFT JOIN bookings b ON b.resource_id = r.resource_id
GROUP BY r.resource_id, r.name, rt.name, r.capacity;

-- ============================================================
-- 4. User booking history summary
-- ============================================================
CREATE OR REPLACE VIEW vw_user_booking_summary AS
SELECT
    u.user_id,
    u.name,
    u.email,
    u.role,
    d.name AS department_name,
    u.total_bookings,
    u.no_show_count,
    CASE
        WHEN u.total_bookings > 0
        THEN ROUND(u.no_show_count::NUMERIC / u.total_bookings * 100, 1)
        ELSE 0
    END AS no_show_rate,
    CASE
        WHEN u.total_bookings > 0 AND
             (u.no_show_count::NUMERIC / u.total_bookings) > 0.3
        THEN TRUE
        ELSE FALSE
    END AS is_high_no_show
FROM users u
LEFT JOIN departments d ON d.department_id = u.department_id;

-- ============================================================
-- 5. Maintenance schedule overview
-- ============================================================
CREATE OR REPLACE VIEW vw_maintenance_overview AS
SELECT
    ms.maintenance_id,
    ms.title,
    ms.description,
    ms.start_time,
    ms.end_time,
    ms.status,
    r.name AS resource_name,
    rt.name AS resource_type,
    r.location,
    u.name AS scheduled_by_name
FROM maintenance_schedules ms
JOIN resources r ON r.resource_id = ms.resource_id
JOIN resource_types rt ON rt.type_id = r.type_id
LEFT JOIN users u ON u.user_id = ms.scheduled_by
ORDER BY ms.start_time ASC;

-- ============================================================
-- 6. Current day schedule per resource
-- ============================================================
CREATE OR REPLACE VIEW vw_today_schedule AS
SELECT
    r.resource_id,
    r.name AS resource_name,
    rt.name AS resource_type,
    r.location,
    b.booking_id,
    b.title AS booking_title,
    b.start_time,
    b.end_time,
    b.status AS booking_status,
    u.name AS booked_by,
    b.attendees_count
FROM resources r
JOIN resource_types rt ON rt.type_id = r.type_id
LEFT JOIN bookings b ON b.resource_id = r.resource_id
    AND b.status IN ('approved', 'pending')
    AND b.start_time >= CURRENT_DATE
    AND b.start_time <  CURRENT_DATE + INTERVAL '1 day'
LEFT JOIN users u ON u.user_id = b.user_id
ORDER BY r.name, b.start_time;

