# EduTrack — Q3 Data Audit

Audit of the `enrollments` table ahead of the Q3 reporting cycle, covering
the five points raised by the operations lead.

Queries: [`queries.sql`](queries.sql). They are numbered in the order they
must be run — queries 1–5 read the table as delivered (17 rows), 6–8
correct it, and 9–12 report on the corrected table (16 rows).

**Headline:** the table arrived with 17 enrollments, of which **2 were test
accounts** that should never have been counted and **2 were missing an
instructor**. After correcting those and adding the one missing
enrollment, the clean total is **16 enrollments and $819.84 collected**.
Roughly a quarter of students have effectively not started their course.

---

## Enrollments in 'Intro to Python'

Result: 5

- Emily Watson — 85%
- Klaus Weber — 92%
- Marco Rossi — 88%
- James Miller — 30% *(test account, removed in query 8)*
- Priya Sharma — 55%

## Enrollments with completion under 10%

Result: 4

- Lucia Fernandes — Web Design Basics — 5%
- Lucia Fernandes — Digital Marketing 101 — 3%
- Yuki Nakamura — UI/UX Fundamentals — 0%
- Pierre Dubois — UI/UX Fundamentals — 0%

Two of these are at exactly 0% — never started, rather than stalled. Both
are on UI/UX Fundamentals, which is also the course that had no instructor
assigned. That is very unlikely to be a coincidence.

## Enrollments with a NULL instructor

Result: 2

- id 10 — Yuki Nakamura — UI/UX Fundamentals — enrolled 2024-10-11
- id 11 — Pierre Dubois — UI/UX Fundamentals — enrolled 2024-11-05

Both on the same course. `courses` also lists UI/UX Fundamentals with a
NULL instructor, so the gap originates upstream, not in the enrollment
records.

## Top 5 highest completion among students who have not passed

Result: 5

- Emily Watson — Web Design Basics — 60%
- Priya Sharma — Intro to Python — 55%
- Yuki Nakamura — Data Analysis with SQL — 45%
- Emily Watson — Advanced Python — 40%
- James Miller — Intro to Python — 30% *(test account)*

These are the students closest to passing and the most sensible targets
for a nudge campaign.

## Enrollments created in the last year

Result: 0

Read literally — the last 365 days — this returns nothing. The most recent
enrollment in the table is dated **2025-03-05**, over a year old.

That is a finding rather than an empty query: either the export is stale,
or enrolments genuinely stopped. Worth confirming with whoever produced
the extract before any Q3 figure is published.

For reference, measured over the 12 months up to the newest enrollment
instead, the count is **14 of 17**.

---

## Missing enrollment added

Result: 1 row inserted (id 18)

Lucia Fernandes — Advanced Python — enrolled 2025-04-01 — 0% — not passed
— $69.99 — Carlos Vega.

Table: 17 → 18 rows.

## Instructor fields corrected

Result: 2 rows updated

ids 10 and 11 changed from NULL to `'Pending assignment'`. Confirmed
beforehand with the query in section 3, which returned exactly those two.

This is a placeholder, not a fix — someone still has to assign a real
instructor to UI/UX Fundamentals.

## Test accounts (@test.com) removed

Rows confirmed by SELECT before deleting: **2**

- id 13 — James Miller — james.miller@test.com — Intro to Python
- id 14 — Alex Chen — alex.chen@test.com — Web Design Basics

Rows deleted: **2**

Table: 18 → 16 rows. The pattern `'%@test.com'` is anchored to the end of
the address, so nothing outside those accounts was at risk.

---

## Enrollments by category

Result:

- Programming: 7
- Design: 4
- Data: 3
- Marketing: 2

## Average completion by course

Result: *(lowest first)*

- UI/UX Fundamentals: 0.00
- Web Design Basics: 32.50
- Digital Marketing 101: 36.50
- Advanced Python: 45.00
- Data Analysis with SQL: 47.67
- Intro to Python: 80.00

## Courses with more than 3 enrollments

Result: 1

- Intro to Python: 4 enrollments

No other course clears the threshold; enrollment is thinly spread across
the catalogue.

## Total revenue by category

Result:

- Programming: $409.93
- Data: $179.97
- Design: $169.96
- Marketing: $59.98

Total: **$819.84**

---

## Findings

**1. Two test accounts were inflating every number.** James Miller and
Alex Chen came in from the old-system import and were counted in
enrollments, completion averages, and revenue. Removing them cut the table
from 18 rows to 16. Any Q3 figure produced before this audit was wrong.

**2. UI/UX Fundamentals is failing, and the cause looks structural.** It
has the worst average completion of any course — **0.00%** — and both of
its students are on 0%. It is also the only course with no instructor
assigned, in `enrollments` and in `courses` alike. Students appear to have
enrolled and found nobody teaching. Assigning an instructor is the fix;
the `'Pending assignment'` placeholder only makes the gap visible.

**3. Roughly a quarter of enrollments are effectively dead.** Four of the
original 17 sit below 10%, and two of those have never started. Concentrated
in Design and Marketing.

**4. Programming carries the business.** It is 44% of enrollments (7 of 16)
and **50% of revenue** ($409.93 of $819.84), and it holds the best
completion rate — Intro to Python averages 80%, more than double any other
course. Marketing is the weakest on both counts: 2 enrollments, $59.98.

**5. The data appears to stop in March 2025.** No enrollment is dated
within the last year. Before Q3 reporting begins, someone should confirm
whether the extract is stale or enrollment genuinely stopped — every
trend figure depends on the answer.

### Recommended next steps

1. Assign a real instructor to UI/UX Fundamentals and re-enroll the two
   affected students.
2. Confirm whether the extract is current before publishing any Q3 number.
3. Contact the four students below 10% completion; the five in section 4
   are closer to passing and are the better re-engagement target.
4. Block `@test.com` addresses at the point of entry so imported test data
   cannot reach production again.
