-- ============================================================
-- EduTrack Data Audit — queries.sql
-- ============================================================
-- 12 queries against the `enrollments` table.
-- `students` and `courses` are context only and are never modified.
--
-- RUN THESE IN ORDER. Queries 1-5 read the table as it arrives
-- (17 rows, test accounts still present). Queries 6-8 correct it.
-- Queries 9-12 report on the corrected table (16 rows).
-- Running them out of order changes the numbers.
-- ============================================================


-- ============================================================
-- READING AND FILTERING
-- ============================================================

-- 1. All enrollments for 'Intro to Python'.
--    Returns 5 rows.
SELECT student_name, student_email, completion_percentage
FROM enrollments
WHERE course_title = 'Intro to Python';


-- 2. Enrollments with completion under 10% — the potential dropouts.
--    Returns 4 rows.
--    `< 10` includes 0, which matters: two of these students have
--    never started, which is a different problem from stalling.
SELECT student_name, student_email, course_title, completion_percentage
FROM enrollments
WHERE completion_percentage < 10
ORDER BY completion_percentage ASC;


-- 3. Enrollments with no instructor assigned.
--    Returns 2 rows.
--    IS NULL, not `= NULL`. In SQL, NULL means "unknown", and
--    comparing an unknown to anything is itself unknown — so
--    `instructor = NULL` matches nothing and returns 0 rows silently.
SELECT id, student_name, course_title, enrollment_date
FROM enrollments
WHERE instructor IS NULL;


-- 4. The 5 highest completion percentages among students who have
--    not passed. Returns 5 rows.
--    ORDER BY ... DESC puts the highest first, LIMIT 5 keeps the top
--    five. These are the students closest to passing.
SELECT student_name, course_title, completion_percentage
FROM enrollments
WHERE passed = false
ORDER BY completion_percentage DESC
LIMIT 5;


-- 5. Enrollments created in the last year, newest first.
--
--    NOTE — read this before reporting the result. Taken literally,
--    "the last year" means the last 365 days from today, and this
--    returns 0 rows: the seed data stops at 2025-03-05, which is more
--    than a year ago. That is itself an audit finding (the export is
--    stale), so it is reported rather than hidden.
SELECT student_name, course_title, enrollment_date, completion_percentage
FROM enrollments
WHERE enrollment_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY enrollment_date DESC;

--    Anchored to the newest enrollment in the data instead of to
--    today, "the last year" is the 12 months to 2025-03-05, which
--    returns 14 of the 17 rows. Both are reported.
-- SELECT student_name, course_title, enrollment_date, completion_percentage
-- FROM enrollments
-- WHERE enrollment_date >= (SELECT MAX(enrollment_date) FROM enrollments) - INTERVAL '1 year'
-- ORDER BY enrollment_date DESC;


-- ============================================================
-- DATA CORRECTIONS
-- ============================================================

-- 6. Add the enrollment confirmed by email but never recorded.
--    Values come from the comment block at the end of edutrack.sql.
--    Table goes from 17 rows to 18.
INSERT INTO enrollments (
    id, student_id, student_name, student_email,
    course_id, course_title, category, enrollment_date,
    completion_percentage, passed, monthly_fee_paid, instructor
) VALUES (
    18, 3, 'Lucia Fernandes', 'lucia.fernandes@student.edutrack.com',
    5, 'Advanced Python', 'Programming', '2025-04-01',
    0, false, 69.99, 'Carlos Vega'
);


-- 7. Fill in the missing instructors from the partner integration.
--    Affects 2 rows (ids 10 and 11, both UI/UX Fundamentals).
--    Confirm the target rows first — this is query 3 above, which
--    returned exactly those two.
UPDATE enrollments
SET instructor = 'Pending assignment'
WHERE instructor IS NULL;


-- 8. Remove the imported test accounts.

--    8a. CONFIRM FIRST. Run this and check the rows are the ones you
--        mean before deleting anything. Returns 2 rows: ids 13 and 14,
--        James Miller and Alex Chen.
--        The '%@test.com' pattern is anchored to the end of the
--        string, so an address like 'name@test.company.com' would not
--        match — only true @test.com accounts.
SELECT id, student_name, student_email, course_title
FROM enrollments
WHERE student_email LIKE '%@test.com';

--    8b. DELETE, using the identical WHERE clause. Removes 2 rows,
--        leaving 16.
DELETE FROM enrollments
WHERE student_email LIKE '%@test.com';


-- ============================================================
-- AGGREGATION AND REPORTING  (on the corrected 16-row table)
-- ============================================================

-- 9. How many enrollments in each category.
--    GROUP BY collapses the rows into one per category; COUNT(*)
--    counts the rows inside each group.
SELECT category, COUNT(*) AS enrollments
FROM enrollments
GROUP BY category
ORDER BY enrollments DESC;


-- 10. Average completion per course, worst first.
--     ROUND(..., 2) keeps it readable; AVG on an integer column
--     returns a long decimal otherwise.
SELECT course_title, ROUND(AVG(completion_percentage), 2) AS avg_completion
FROM enrollments
GROUP BY course_title
ORDER BY avg_completion ASC;


-- 11. Only the courses with more than 3 enrollments.
--     HAVING, not WHERE. WHERE filters individual rows before they are
--     grouped, so it cannot see a COUNT. HAVING filters the groups
--     after they are formed, which is the only place COUNT(*) exists.
--     Returns 1 row.
SELECT course_title, COUNT(*) AS enrollments
FROM enrollments
GROUP BY course_title
HAVING COUNT(*) > 3
ORDER BY enrollments DESC;


-- 12. Total revenue collected per category, highest first.
SELECT category, ROUND(SUM(monthly_fee_paid), 2) AS total_revenue
FROM enrollments
GROUP BY category
ORDER BY total_revenue DESC;
