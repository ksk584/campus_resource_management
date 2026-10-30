-- ============================================================
-- Master initialization script
-- Run this to set up the entire database
-- ============================================================
-- Usage:
--   psql -U postgres -c "CREATE DATABASE campus_booking;"
--   psql -U postgres -d campus_booking -f database/init.sql
-- ============================================================

\i schema.sql
\i triggers.sql
\i views.sql
\i procedures.sql
\i seed.sql

-- Verify
SELECT 'Tables created:' AS info, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 'Views created:' AS info, COUNT(*) AS count
FROM information_schema.views
WHERE table_schema = 'public';

SELECT 'Functions created:' AS info, COUNT(*) AS count
FROM information_schema.routines
WHERE routine_schema = 'public';

