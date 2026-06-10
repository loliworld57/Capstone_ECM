# ECM Finance Module Cleanup & Hardening

## Steps

- [x] 1) Refactor CenterFinance: use authenticated user from SecurityContext
- [x] 1b) Refactor CourseFinance: use authenticated user from SecurityContext


- [x] 1c) Apply Task 1 + Task 2 to CenterFinance: remove actorUserId and preserve createdBy



- [x] 2) Task 1: Remove actorUserId everywhere (controllers/services/DTO)

- [x] 3) Task 2: Preserve createdBy (stop overwriting createdBy on update)

- [x] 4) Task 3: Optimize revenue calculations (remove tuitionPaymentRepository.findAll() filtering)

- [x] 5) Apply same hardening pattern across remaining finance modules listed in the task

- [ ] 6) Task 5: TuitionStatus enum cleanup (only if currently String-based)
- [ ] 7) Task 4: Ownership & authorization audit across all finance endpoints
- [ ] 8) Build verification: `mvn test` and fix compilation/endpoint/serialization issues


