-- ============================================================
-- TRIGGERS for Smart Campus Resource Booking System
-- ============================================================

-- ============================================================
-- 1. Prevent overlapping bookings on the same resource
--    (only for approved/pending bookings)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE resource_id = NEW.resource_id
          AND booking_id != COALESCE(NEW.booking_id, 0)
          AND status IN ('pending', 'approved')
          AND NEW.start_time < end_time
          AND NEW.end_time   > start_time
    ) THEN
        RAISE EXCEPTION 'Booking conflict: resource is already booked for the requested time slot.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_booking_conflict
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status IN ('pending', 'approved'))
    EXECUTE FUNCTION fn_check_booking_conflict();

-- ============================================================
-- 2. Prevent bookings during maintenance windows
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_maintenance_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM maintenance_schedules
        WHERE resource_id = NEW.resource_id
          AND status IN ('scheduled', 'in_progress')
          AND NEW.start_time < end_time
          AND NEW.end_time   > start_time
    ) THEN
        RAISE EXCEPTION 'Resource is under maintenance during the requested time slot.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_maintenance_conflict
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status IN ('pending', 'approved'))
    EXECUTE FUNCTION fn_check_maintenance_conflict();

-- ============================================================
-- 3. Auto-create approval record when a booking is created
-- ============================================================
CREATE OR REPLACE FUNCTION fn_create_booking_approval()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO booking_approvals (booking_id, status)
    VALUES (NEW.booking_id, 'pending');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_booking_approval
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_booking_approval();

-- ============================================================
-- 4. Update booking status when approval decision is made
-- ============================================================
CREATE OR REPLACE FUNCTION fn_sync_approval_to_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE bookings SET status = 'approved', updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = NEW.booking_id;
    ELSIF NEW.status = 'rejected' THEN
        UPDATE bookings SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_approval_to_booking
    AFTER UPDATE ON booking_approvals
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_sync_approval_to_booking();

-- ============================================================
-- 5. Create notification when booking status changes
-- ============================================================
CREATE OR REPLACE FUNCTION fn_booking_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    notif_type notification_type;
    notif_title VARCHAR(200);
    notif_msg TEXT;
    res_name VARCHAR(100);
BEGIN
    SELECT name INTO res_name FROM resources WHERE resource_id = NEW.resource_id;

    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        notif_type  := 'booking_approved';
        notif_title := 'Booking Approved';
        notif_msg   := 'Your booking for ' || res_name || ' (' || NEW.title || ') has been approved.';
    ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
        notif_type  := 'booking_rejected';
        notif_title := 'Booking Rejected';
        notif_msg   := 'Your booking for ' || res_name || ' (' || NEW.title || ') has been rejected.';
    ELSIF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
        notif_type  := 'booking_cancelled';
        notif_title := 'Booking Cancelled';
        notif_msg   := 'Your booking for ' || res_name || ' (' || NEW.title || ') has been cancelled.';
    ELSE
        RETURN NEW;
    END IF;

    INSERT INTO notifications (user_id, type, title, message, related_booking)
    VALUES (NEW.user_id, notif_type, notif_title, notif_msg, NEW.booking_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_status_notification
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_booking_status_notification();

-- ============================================================
-- 6. Update user no_show_count and total_bookings counters
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_user_booking_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
        UPDATE users SET no_show_count = no_show_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        UPDATE users SET total_bookings = total_bookings + 1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_stats_insert
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_user_booking_stats();

CREATE TRIGGER trg_update_user_stats_update
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_user_booking_stats();

-- ============================================================
-- 7. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_resources_updated_at
    BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- 8. Notify waitlisted users when a booking is cancelled
-- ============================================================
CREATE OR REPLACE FUNCTION fn_notify_waitlist_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
    w RECORD;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'approved') THEN
        FOR w IN
            SELECT wl.user_id, wl.waitlist_id
            FROM waitlist wl
            WHERE wl.resource_id = NEW.resource_id
              AND wl.is_active = TRUE
              AND wl.desired_start < NEW.end_time
              AND wl.desired_end   > NEW.start_time
            ORDER BY wl.priority DESC, wl.created_at ASC
            LIMIT 5
        LOOP
            INSERT INTO notifications (user_id, type, title, message, related_booking)
            VALUES (
                w.user_id,
                'waitlist_available',
                'Resource Now Available',
                'A time slot has opened up for the resource you waitlisted. Book it now!',
                NEW.booking_id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_waitlist_on_cancel
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status IN ('pending', 'approved'))
    EXECUTE FUNCTION fn_notify_waitlist_on_cancel();

