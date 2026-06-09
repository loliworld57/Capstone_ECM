# TODO - Financial Module (Business Rules)

## Step 1: Confirm schema + workflow (done)
- [x] Tuition fee base stored on `Course` as `tuitionFeeVnd`.
- [x] Scholarship discount derived from `Enrollment.scholarship.discountPercentage`.
- [x] No online payments; only offline/manual recording.

## Step 2: Implement backend data model
- [ ] Add enum `FinanceType` (INCOME/EXPENSE).
- [ ] Add entity `TuitionPayment` linked to `Enrollment`.
- [ ] Add entity `CenterFinanceRecord` linked to `Center`.
- [ ] Add entity `CourseFinanceRecord` linked to `Course`.
- [ ] Add entity `TeacherFinanceRecord` linked to teacher `User`.
- [ ] Add `tuitionFeeVnd` to `Course`.

## Step 3: Implement repositories
- [ ] Create Spring Data JPA repositories for all new entities.

## Step 4: Implement services (business logic + ownership)
- [ ] Student tuition tracking service:
  - compute final tuition, paid sum, remaining, status
  - include payment history
- [ ] Center finance service: CRUD + monthly/yearly reports + profit.
- [ ] Course finance service: CRUD with teacher ownership constraint + profit.
- [ ] Teacher personal finance service: CRUD + monthly/yearly summaries.

## Step 5: Implement controllers (REST endpoints)
- [ ] Student read-only tuition endpoints.
- [ ] Center manager endpoints for center finance + student tuition payments.
- [ ] Course finance endpoints.
- [ ] Teacher personal finance endpoints.

## Step 6: Authorization
- [ ] Extend `SecurityConfig` with route protections for new endpoints.
- [ ] Add service-layer checks for record ownership.

## Step 7: Frontend (only if requested later)
- [ ] Add student tuition screens.
- [ ] Add manager/course/teacher finance screens.
- [ ] Wire calls to new endpoints.

## Step 8: Testing
- [ ] Add/extend backend tests (or at least run app + manual API checks).

