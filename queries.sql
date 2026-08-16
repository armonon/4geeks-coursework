-- EduTrack Data Audit — queries.sql
--
-- 12 queries for the Q3 audit of the `enrollments` table.
-- Only `enrollments` is in scope; do not modify `students` or `courses`.
--
-- Tip from the brief, worth following literally: before any UPDATE or
-- DELETE, run a SELECT with the SAME WHERE clause and confirm the rows
-- are the ones you mean. Query 8 below is written to leave room for that.
--
-- SCHEMA (from edutrack.sql) — the exact column names, so you are not
-- guessing at them:
--
--   enrollments (
--     id                    SERIAL PRIMARY KEY
--     student_id            INTEGER
--     student_name          VARCHAR(100)
--     student_email         VARCHAR(150)      <- note: NOT "email"
--     course_id             INTEGER
--     course_title          VARCHAR(150)
--     category              VARCHAR(50)
--     enrollment_date       DATE
--     completion_percentage INTEGER
--     passed                BOOLEAN  NOT NULL DEFAULT FALSE
--     monthly_fee_paid      DECIMAL(6,2)
--     instructor            VARCHAR(100)      <- nullable
--   )
--
-- 17 rows are seeded, ids 1-17. Dates run 2024-02-14 to 2025-03-05.


-- =====================================================================
-- READING AND FILTERING
-- =====================================================================

-- 1. All enrollments for the course 'Intro to Python',
--    showing student name, email, and completion percentage.



-- 2. All enrollments where completion_percentage is less than 10
--    (the potential dropouts the operations lead asked about).



-- 3. All enrollments where the instructor field is NULL.
--    Careful: NULL is not equal to anything, including itself.



-- 4. The 5 students with the highest completion_percentage
--    who have NOT yet passed (passed = false).



-- 5. All enrollments created in the last year,
--    ordered by enrollment_date descending.



-- =====================================================================
-- DATA CORRECTIONS
-- =====================================================================

-- 6. INSERT the missing enrollment record described in the
--    edutrack.sql comments (student name, email, course, date, and
--    the initial values specified there).



-- 7. UPDATE all enrollments where instructor IS NULL,
--    assigning the default value 'Pending assignment'.



-- 8. DELETE all enrollments tied to the imported test accounts
--    (@test.com).
--
--    8a. SELECT first — confirm exactly which rows match before
--        deleting anything. Record the count for the report.



--    8b. DELETE, using the identical WHERE clause.



-- =====================================================================
-- AGGREGATION AND REPORTING
-- =====================================================================

-- 9. Count of enrollments grouped by category.



-- 10. Average completion_percentage grouped by course_title,
--     ordered from lowest to highest.



-- 11. Only the courses with more than 3 enrollments (use HAVING).



-- 12. Total revenue (SUM of monthly_fee_paid) grouped by category,
--     ordered from highest to lowest.


