-- ============================================================
-- STORED PROCEDURES for Smart Campus Resource Booking System
-- ============================================================

-- ============================================================
-- 1. Search available resources
-- ============================================================
CREATE OR REPLACE FUNCTION sp_search_available_resources(
    p_type_id       INT DEFAULT NULL,
    p_min_capacity  INT DEFAULT NULL,
    p_location      VARCHAR DEFAULT NULL,
    p_start_time    TIMESTAMP DEFAULT NULL,
    p_end_time      TIMESTAMP DEFAULT NULL,
    p_feature_ids   INT[] DEFAULT NULL
)
RETURNS TABLE (
    resource_id     INT,
    resource_name   VARCHAR,
    resource_type   VARCHAR,
    location        VARCHAR,
    building        VARCHAR,
    floor           INT,
    capacity        INT,
    status          resource_status,
    department_name VARCHAR,
    features        TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.resource_id,
        r.name::VARCHAR          AS resource_name,
        rt.name::VARCHAR         AS resource_type,
        r.location::VARCHAR,
        r.building::VARCHAR,
        r.floor,
        r.capacity,
        r.status,
        d.name::VARCHAR          AS department_name,
        ARRAY(
            SELECT f.name FROM features f
            JOIN resource_features rf ON rf.feature_id = f.feature_id
            WHERE rf.resource_id = r.resource_id
        )::TEXT[] AS features
    FROM resources r
    JOIN resource_types rt ON rt.type_id = r.type_id
    LEFT JOIN departments d ON d.department_id = r.department_id
    WHERE r.status = 'available'
      AND (p_type_id IS NULL      OR r.type_id  = p_type_id)
      AND (p_min_capacity IS NULL OR r.capacity >= p_min_capacity)
      AND (p_location IS NULL     OR LOWER(r.location) LIKE '%' || LOWER(p_location) || '%'
                                  OR LOWER(r.building)  LIKE '%' || LOWER(p_location) || '%')
      -- No booking conflicts
      AND (p_start_time IS NULL OR p_end_time IS NULL OR NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.resource_id = r.resource_id
            AND b.status IN ('pending', 'approved')
            AND p_start_time < b.end_time
            AND p_end_time   > b.start_time
      ))
      -- No maintenance conflicts
      AND (p_start_time IS NULL OR p_end_time IS NULL OR NOT EXISTS (
          SELECT 1 FROM maintenance_schedules ms
          WHERE ms.resource_id = r.resource_id
            AND ms.status IN ('scheduled', 'in_progress')
            AND p_start_time < ms.end_time
            AND p_end_time   > ms.start_time
      ))
      -- Has all required features
      AND (p_feature_ids IS NULL OR NOT EXISTS (
          SELECT unnest(p_feature_ids)
          EXCEPT
          SELECT rf.feature_id FROM resource_features rf WHERE rf.resource_id = r.resource_id
      ))
    ORDER BY r.capacity ASC, r.name ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Create a booking with conflict check
-- ============================================================
CREATE OR REPLACE FUNCTION sp_create_booking(
    p_user_id       INT,
    p_resource_id   INT,
    p_title         VARCHAR,
    p_description   TEXT,
    p_start_time    TIMESTAMP,
    p_end_time      TIMESTAMP,
    p_priority      booking_priority DEFAULT 'normal',
    p_attendees     INT DEFAULT 1
)
RETURNS TABLE (
    booking_id  INT,
    status      booking_status,
    message     TEXT
) AS $$
DECLARE
    v_booking_id INT;
    v_user_no_show_rate NUMERIC;
    v_resource_capacity INT;
BEGIN
    -- Check user no-show rate for priority adjustment
    SELECT
        CASE WHEN u.total_bookings > 5
             THEN u.no_show_count::NUMERIC / u.total_bookings
             ELSE 0
        END INTO v_user_no_show_rate
    FROM users u WHERE u.user_id = p_user_id;

    -- Downgrade priority if no-show rate > 30%
    IF v_user_no_show_rate > 0.3 AND p_priority != 'low' THEN
        p_priority := 'low';
    END IF;

    -- Check resource capacity
    SELECT r.capacity INTO v_resource_capacity
    FROM resources r WHERE r.resource_id = p_resource_id;

    IF p_attendees > v_resource_capacity AND v_resource_capacity > 0 THEN
        RETURN QUERY SELECT NULL::INT, NULL::booking_status,
            'Attendee count exceeds resource capacity'::TEXT;
        RETURN;
    END IF;

    -- Insert booking (triggers will handle conflict detection)
    INSERT INTO bookings (user_id, resource_id, title, description, start_time, end_time, priority, attendees_count)
    VALUES (p_user_id, p_resource_id, p_title, p_description, p_start_time, p_end_time, p_priority, p_attendees)
    RETURNING bookings.booking_id INTO v_booking_id;

    -- Create notification for the user
    INSERT INTO notifications (user_id, type, title, message, related_booking)
    VALUES (p_user_id, 'booking_created', 'Booking Created',
            'Your booking "' || p_title || '" has been created and is pending approval.',
            v_booking_id);

    RETURN QUERY SELECT v_booking_id, 'pending'::booking_status, 'Booking created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Cancel a booking
-- ============================================================
CREATE OR REPLACE FUNCTION sp_cancel_booking(
    p_booking_id    INT,
    p_user_id       INT
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT b.*, u.role INTO v_booking
    FROM bookings b
    JOIN users u ON u.user_id = p_user_id
    WHERE b.booking_id = p_booking_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT;
        RETURN;
    END IF;

    -- Only owner or admin can cancel
    IF v_booking.user_id != p_user_id AND v_booking.role != 'admin' THEN
        RETURN QUERY SELECT FALSE, 'You do not have permission to cancel this booking'::TEXT;
        RETURN;
    END IF;

    IF v_booking.status IN ('cancelled', 'completed', 'no_show') THEN
        RETURN QUERY SELECT FALSE, ('Booking is already ' || v_booking.status::TEXT)::TEXT;
        RETURN;
    END IF;

    UPDATE bookings SET status = 'cancelled' WHERE booking_id = p_booking_id;

    RETURN QUERY SELECT TRUE, 'Booking cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Approve or reject a booking (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION sp_decide_booking(
    p_booking_id    INT,
    p_admin_id      INT,
    p_decision      VARCHAR,   -- 'approved' or 'rejected'
    p_comments      TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
    v_admin_role user_role;
BEGIN
    SELECT role INTO v_admin_role FROM users WHERE user_id = p_admin_id;

    IF v_admin_role != 'admin' THEN
        RETURN QUERY SELECT FALSE, 'Only admins can approve or reject bookings'::TEXT;
        RETURN;
    END IF;

    IF p_decision NOT IN ('approved', 'rejected') THEN
        RETURN QUERY SELECT FALSE, 'Decision must be approved or rejected'::TEXT;
        RETURN;
    END IF;

    UPDATE booking_approvals
    SET status      = p_decision,
        approved_by = p_admin_id,
        comments    = p_comments,
        decided_at  = CURRENT_TIMESTAMP
    WHERE booking_id = p_booking_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Booking approval record not found'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, ('Booking ' || p_decision)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. Get resource utilization stats for a date range
-- ============================================================
CREATE OR REPLACE FUNCTION sp_resource_utilization_report(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    resource_id         INT,
    resource_name       VARCHAR,
    resource_type       VARCHAR,
    total_bookings      BIGINT,
    completed_bookings  BIGINT,
    no_show_bookings    BIGINT,
    cancelled_bookings  BIGINT,
    total_hours         NUMERIC,
    utilization_pct     NUMERIC,
    attendance_rate     NUMERIC
) AS $$
DECLARE
    v_total_hours NUMERIC;
BEGIN
    -- Total available hours in the date range (assume 12 hours/day)
    v_total_hours := (p_end_date - p_start_date) * 12.0;

    RETURN QUERY
    SELECT
        r.resource_id,
        r.name::VARCHAR AS resource_name,
        rt.name::VARCHAR AS resource_type,
        COUNT(b.booking_id) AS total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS completed_bookings,
        COUNT(CASE WHEN b.status = 'no_show'   THEN 1 END) AS no_show_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) AS cancelled_bookings,
        COALESCE(SUM(
            CASE WHEN b.status IN ('completed', 'approved')
            THEN EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
            ELSE 0 END
        ), 0)::NUMERIC(10,1) AS total_hours,
        CASE WHEN v_total_hours > 0
             THEN ROUND(
                COALESCE(SUM(
                    CASE WHEN b.status IN ('completed', 'approved')
                    THEN EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
                    ELSE 0 END
                ), 0) / v_total_hours * 100, 1)
             ELSE 0
        END AS utilization_pct,
        ROUND(
            COALESCE(
                COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::NUMERIC /
                NULLIF(COUNT(CASE WHEN b.status IN ('completed','no_show') THEN 1 END), 0) * 100,
                0
            ), 1
        ) AS attendance_rate
    FROM resources r
    JOIN resource_types rt ON rt.type_id = r.type_id
    LEFT JOIN bookings b ON b.resource_id = r.resource_id
        AND b.start_time >= p_start_date::TIMESTAMP
        AND b.start_time <  (p_end_date + 1)::TIMESTAMP
    GROUP BY r.resource_id, r.name, rt.name;
END;
$$ LANGUAGE plpgsql;

