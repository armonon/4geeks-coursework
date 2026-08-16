-- ============================================================
-- EduTrack Data Audit — Related Tables
-- queries.sql — 10 queries against the normalized schema
-- ============================================================
-- Constraints this file follows, per the brief:
--   * every query uses at least one JOIN
--   * no subqueries anywhere — all results come from joining
--     the tables directly
--
-- The schema:
--   students(id)   1 --- n  enrollments(student_id)
--   courses(id)    1 --- n  enrollments(course_id)
--   students       n --- m  courses, resolved through enrollments
--
-- `enrollments` is the junction table. Both of its foreign keys
-- are declared with REFERENCES, which matters for queries 9-10.
-- ============================================================


-- ============================================================
-- INNER JOIN
-- ============================================================

-- 1. Every enrollment, with the student's full name, the course
--    title, and their completion percentage. Returns 16 rows.
--
--    Two INNER JOINs because the answer needs columns from all
--    three tables: the name lives in students, the title lives in
--    courses, and only enrollments knows they are connected.
SELECT s.name  AS student_name,
       c.title AS course_title,
       e.completion_percentage
FROM enrollments e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN courses  c ON e.course_id  = c.id
ORDER BY s.name, c.title;


-- 2. Students who have passed at least one course, with the course
--    they passed. Returns 6 rows.
--
--    INNER JOIN is correct here: a student with no passing
--    enrollment should not appear at all, and INNER JOIN drops
--    exactly those non-matches.
SELECT s.name  AS student_name,
       s.email,
       c.title AS course_passed
FROM enrollments e
INNER JOIN students s ON e.student_id = s.id
INNER JOIN courses  c ON e.course_id  = c.id
WHERE e.passed = true
ORDER BY s.name;


-- 3. Average completion percentage per instructor, best first.
--    Returns 4 rows.
--
--    The instructor is a property of the course, not of the
--    enrollment, so the two tables have to be joined before the
--    completion figures can be grouped by instructor.
SELECT c.instructor_name,
       ROUND(AVG(e.completion_percentage), 2) AS avg_completion,
       COUNT(e.id) AS enrollments
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.id
GROUP BY c.instructor_name
ORDER BY avg_completion DESC;


-- ============================================================
-- LEFT JOIN — finding what is missing
-- ============================================================

-- 4. Students who registered but never enrolled in anything.
--    Returns 1 row (Giulia Romano).
--
--    This is the LEFT JOIN pattern for absence: keep every row
--    from the left table, then keep only those where the right
--    side failed to match. An INNER JOIN could never answer this
--    question — it discards exactly the rows being looked for.
--
--    The IS NULL test is on e.id, the right table's primary key.
--    A primary key is never NULL in a real row, so a NULL there
--    can only mean "no match was found".
SELECT s.id, s.name, s.email, s.signup_date
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id
WHERE e.id IS NULL;


-- 5. Courses in the catalogue that nobody has enrolled in —
--    archive candidates. Returns 1 row (Email Campaigns).
--
--    Same pattern, with courses on the left this time.
SELECT c.id, c.title, c.category, c.instructor_name, c.monthly_fee
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE e.id IS NULL;


-- ============================================================
-- AGGREGATION ACROSS TABLES
-- ============================================================

-- 6. How many courses each student is taking, for students taking
--    more than one. Returns 7 rows.
--
--    HAVING rather than WHERE: the filter is on COUNT(), which
--    does not exist until after the rows have been grouped. WHERE
--    runs before grouping and cannot see it.
--
--    Grouping by s.id as well as s.name so that two students who
--    happened to share a name would still be counted separately.
SELECT s.name AS student_name,
       COUNT(e.id) AS courses_enrolled
FROM students s
INNER JOIN enrollments e ON s.id = e.student_id
GROUP BY s.id, s.name
HAVING COUNT(e.id) > 1
ORDER BY courses_enrolled DESC, s.name;


-- 7. Revenue per category using the course's list price
--    (courses.monthly_fee), not the historical amount paid
--    stored in enrollments. Returns 4 rows.
--
--    The brief is explicit about which column to use. They happen
--    to agree in this dataset, but they answer different
--    questions: monthly_fee is what the course costs today,
--    monthly_fee_paid is what that student actually paid.
SELECT c.category,
       COUNT(e.id) AS enrollments,
       ROUND(SUM(c.monthly_fee), 2) AS revenue_at_list_price
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.id
GROUP BY c.category
ORDER BY revenue_at_list_price DESC;


-- 8. Each instructor with the number of students enrolled in
--    their courses. Returns 4 rows.
--
--    COUNT(DISTINCT e.student_id), not COUNT(*): the question asks
--    for students, and one student enrolled in two of the same
--    instructor's courses is still one student. The plain
--    enrollment count is shown alongside so the difference is
--    visible.
--
--    LEFT JOIN so an instructor whose courses have no enrollments
--    at all would still appear, with a zero, rather than vanishing.
SELECT c.instructor_name,
       COUNT(DISTINCT e.student_id) AS students_enrolled,
       COUNT(e.id) AS total_enrollments
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.instructor_name
ORDER BY students_enrolled DESC;


-- ============================================================
-- DATA INTEGRITY
-- ============================================================

-- 9. Enrollments pointing at a student that does not exist.
--    Returns 0 rows — see the note below.
SELECT e.id AS enrollment_id, e.student_id AS missing_student_id
FROM enrollments e
LEFT JOIN students s ON e.student_id = s.id
WHERE s.id IS NULL;


-- 10. Enrollments pointing at a course that does not exist.
--     Returns 0 rows.
--
--     Both of these return nothing, and that is the correct and
--     expected result rather than a failed query. `enrollments`
--     declares student_id and course_id as REFERENCES, so
--     PostgreSQL rejects any insert that would create an orphan
--     and any delete that would strand one. The integrity is
--     enforced by the schema, not by convention.
--
--     The checks are still worth keeping: they would catch an
--     orphan introduced if the constraint were ever dropped
--     during a migration, which is exactly when it happens.
SELECT e.id AS enrollment_id, e.course_id AS missing_course_id
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
WHERE c.id IS NULL;
