# EduTrack — Q3 Data Audit

Analysis of the `enrollments` table ahead of the Q3 reporting cycle,
covering the five points raised by the operations lead: low-progress
students, imported `@test.com` test accounts, missing instructor fields,
a missing enrollment, and aggregate numbers by category.

Queries: [`queries.sql`](queries.sql).

---

## Enrollments in 'Intro to Python'

Result:

## Enrollments with completion under 10%

Result:

## Enrollments with a NULL instructor

Result:

## Top 5 highest completion among students who have not passed

Result:

## Enrollments created in the last year

Result:

---

## Missing enrollment added

Result:

## Instructor fields corrected

Result:

## Test accounts (@test.com) removed

Rows confirmed by SELECT before deleting:

Rows deleted:

---

## Enrollments by category

Result:

## Average completion by course

Result:

## Courses with more than 3 enrollments

Result:

## Total revenue by category

Result:

---

## Findings

<!--
The brief asks for the findings, not just the numbers — the operations
lead wants to share this without anyone running SQL. Worth answering in
plain sentences once the numbers above are filled in:

  - How many students look like genuine dropouts, and does that cluster
    in any particular course or category?
  - How much of the data was test-account noise, and did removing it
    change any of the aggregates?
  - Which categories are underperforming on completion, and which carry
    the revenue?
-->
