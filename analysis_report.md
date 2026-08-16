# EduTrack — Q3 Data Audit (normalized schema)

Audit of the migrated three-table schema, answering the operations lead's
six questions. Every query joins tables directly; none uses a subquery.

- Queries: [`queries.sql`](queries.sql)
- ER diagram: [`diagram.png`](diagram.png)

**Schema:** `students` 1:n `enrollments` n:1 `courses` — `enrollments` is
the junction table resolving a many-to-many between students and courses.
8 students, 7 courses, 16 enrollments.

**Headline:** the migrated data is clean — no orphaned records, and the
test accounts from the previous audit are gone. Two archive/outreach
candidates surfaced: one student who never enrolled, one course nobody
took. The instructor with the highest average completion (Marta López,
66.14%) also teaches the most students, and the unassigned course still
sits at 0%.

---

## Every enrollment with student, course and completion

Result: 16

All 16 enrollments join cleanly to both a student and a course — the first
sign the migration was sound.

| Student | Course | Completion |
|---|---|---|
| Emily Watson | Intro to Python | 85 |
| Emily Watson | Web Design Basics | 60 |
| Emily Watson | Advanced Python | 40 |
| Klaus Weber | Intro to Python | 92 |
| Klaus Weber | Data Analysis with SQL | 78 |
| Lucia Fernandes | Web Design Basics | 5 |
| Lucia Fernandes | Digital Marketing 101 | 3 |
| Lucia Fernandes | Advanced Python | 0 |
| Marco Rossi | Advanced Python | 95 |
| Marco Rossi | Intro to Python | 88 |
| Yuki Nakamura | Data Analysis with SQL | 45 |
| Yuki Nakamura | UI/UX Fundamentals | 0 |
| Pierre Dubois | UI/UX Fundamentals | 0 |
| Pierre Dubois | Data Analysis with SQL | 20 |
| Priya Sharma | Digital Marketing 101 | 70 |
| Priya Sharma | Intro to Python | 55 |

## Students who passed at least one course

Result: 6

- Emily Watson — emily.watson@student.edutrack.com — Intro to Python
- Klaus Weber — klaus.weber@student.edutrack.com — Intro to Python
- Klaus Weber — klaus.weber@student.edutrack.com — Data Analysis with SQL
- Marco Rossi — marco.rossi@student.edutrack.com — Advanced Python
- Marco Rossi — marco.rossi@student.edutrack.com — Intro to Python
- Priya Sharma — priya.sharma@student.edutrack.com — Digital Marketing 101

Six passes across **4 distinct students** — Klaus and Marco each passed
two. That is 4 of 8 registered students, or 4 of 7 who ever enrolled.

## Average completion per instructor

Result:

- Marta López: 66.14% (7 enrollments)
- Carlos Vega: 40.00% (5 enrollments)
- Lucia Prades: 36.50% (2 enrollments)
- Pending assignment: 0.00% (2 enrollments)

## Students with no enrollments

Result: 1

- id 8 — Giulia Romano — giulia.romano@student.edutrack.com — signed up 2024-05-07

Registered and never started a course.

## Courses with no enrollments

Result: 1

- id 7 — Email Campaigns — Marketing — Lucia Prades — $19.99

In the catalogue, never taken. The archive candidate the ops lead asked
about.

---

## Students enrolled in more than one course

Result: 7

- Emily Watson: 3
- Lucia Fernandes: 3
- Klaus Weber: 2
- Marco Rossi: 2
- Pierre Dubois: 2
- Priya Sharma: 2
- Yuki Nakamura: 2

Every student who enrolled at all took more than one course. The only
student not listed is Giulia Romano, who took none.

## Revenue per category at list price

Result:

- Programming: $409.93 (7 enrollments)
- Data: $179.97 (3 enrollments)
- Design: $169.96 (4 enrollments)
- Marketing: $59.98 (2 enrollments)

Total: **$819.84**

Calculated from `courses.monthly_fee`, the current list price, as
specified — not from `enrollments.monthly_fee_paid`. The two agree in
this dataset, so no student is on a legacy rate, but they answer different
questions and would diverge the moment a price changed.

## Students per instructor

Result:

| Instructor | Students | Enrollments |
|---|---|---|
| Marta López | 6 | 7 |
| Carlos Vega | 3 | 5 |
| Lucia Prades | 2 | 2 |
| Pending assignment | 2 | 2 |

Counted with `COUNT(DISTINCT student_id)`, because a student taking two of
the same instructor's courses is still one student. The enrollment column
shows where that distinction bites: Carlos Vega has 5 enrollments but only
3 students.

---

## Orphaned enrollments — missing student

Result: 0

## Orphaned enrollments — missing course

Result: 0

Both integrity checks come back empty, and that is the expected answer
rather than a failed query. `enrollments.student_id` and
`enrollments.course_id` are declared `REFERENCES students(id)` and
`REFERENCES courses(id)`, so PostgreSQL refuses any insert that would
create an orphan and any delete that would strand one. The integrity is
guaranteed by the schema.

---

## Findings

**1. The migration is clean.** All 16 enrollments resolve to a real
student and a real course, both integrity checks return zero, and the
`@test.com` accounts that polluted the flat table in the previous audit
are gone from `students` entirely. Numbers from this schema can be
trusted in a way the old ones could not.

**2. Two archive/outreach candidates, and they are different problems.**
Email Campaigns has been in the catalogue with an instructor and a price
and has never been taken — a product question. Giulia Romano registered on
2024-05-07 and never enrolled — an onboarding question. Only the
normalized schema can surface either: in the old flat table, a student
with no enrollment and a course with no enrollment simply had no row.

**3. UI/UX Fundamentals is still broken.** Its instructor is literally
`'Pending assignment'` — the placeholder written during the previous
audit — and both of its enrollments sit at 0% completion. Nobody has been
assigned since, and no student on that course has made any progress. It is
the worst-performing course in the catalogue by a wide margin.

**4. Teaching load is lopsided.** Marta López teaches 6 of the 7 active
students and has the highest average completion at 66.14% — roughly double
everyone else. Lucia Prades has 2 students, one of whom is at 3%.
Whatever Marta is doing is worth understanding before the pattern is
assumed to be about the subject matter.

**5. Programming carries the revenue.** $409.93 of $819.84 — half the
total from 7 of the 16 enrollments — and it holds the best completion
rates. Marketing is weakest on both: $59.98 across 2 enrollments, plus one
course nobody has ever taken.

**6. Engagement is bimodal.** Every student who enrolled took at least two
courses; there is no casual middle. Students either commit to several
courses or, like Giulia, never start. That argues for concentrating
onboarding effort on the first enrollment.

### Recommended next steps

1. Assign a real instructor to UI/UX Fundamentals — it has been pending
   since the last audit and both its students are at 0%.
2. Decide whether to archive or promote Email Campaigns; it has never had
   a single enrollment.
3. Contact Giulia Romano, and review why a registered student never
   reached a first enrollment.
4. Look at what Marta López does differently before treating low
   completion elsewhere as a subject-matter problem.
