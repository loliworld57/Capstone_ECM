# Education Center Management (ECM)

Education Center Management is a full-stack application for tutoring centers and learning academies, combining administration, teaching, student learning, and financial tracking.

## Current features

- JWT authentication, role-based access, teacher registration, email OTP verification, profile management, password changes, and account locking.
- Multiple centers with teachers, students, subjects, grades, classrooms, and recurring class slots.
- Courses, teacher invitations, enrollments, class sessions, and teacher/student schedules.
- Session attendance, assignment submissions, grading, and Cloudinary learning materials.
- Gradebooks with score categories, weights, score items, and student scores.
- Gemini summaries of PDF/DOCX materials, with saved summaries for students.
- Quiz creation, AI-generated question previews, student submissions, and results.
- Center, course, and teacher finances; tuition plans, installments, and payment records; student tuition views.

These features are implemented in the backend and web application. Mobile currently focuses on authentication, admin account management, and teacher center, course, student, and profile workflows; it does not yet mirror all web features.

## Roles

| Role | Main workflows |
| --- | --- |
| Admin | User accounts and platform access |
| Teacher | Centers, courses, students, schedules, learning activities, and finances |
| Manager | Delegated center/course workflows, subject to endpoint permissions |
| Student | Enrolled courses, materials, attendance, grades, tuition, assignments, and quizzes |

Access depends on Spring Security rules, controller checks, and center/course relationships.

## Structure and stack

| Directory | Technologies |
| --- | --- |
| `backend/` | Java 17, Spring Boot 3.5.7, Spring Security, JPA, Maven, PostgreSQL |
| `frontend/` | Next.js 16.0.10, React 19.2, TypeScript, Tailwind CSS 4, Tiptap, TanStack Table |
| `ExtraCenterMobile/` | React Native 0.82.1, React 19.1.1, TypeScript, React Navigation, NativeWind |

Both clients use the Spring Boot REST API. External integrations include Cloudinary for files, Resend for email, and Google Gemini for summaries and quizzes. Swagger UI provides API documentation.

The mobile directory, native targets, and Java namespace (`com.extracenter`) retain their technical names. The product and mobile display name are **Education Center Management**.

## Local setup

### Prerequisites

Use JDK 17, Node.js 20.9 or later, npm, and PostgreSQL. Configure Cloudinary, Resend, and Gemini for their corresponding features. Android development needs the Android SDK and an emulator/device; iOS needs macOS, Xcode, and CocoaPods.

### Backend

The runtime configuration is `backend/src/main/resources/application.properties`, which is ignored by Git. A fresh checkout may require you to create it. Set the following variables in your shell, IDE, or deployment environment; Spring Boot does not automatically load the root `.env` file.

| Variable | Purpose |
| --- | --- |
| `DB_URL` | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/ecm_db` |
| `DB_USERNAME`, `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | Secret suitable for the JWT signing algorithm |
| `RESEND_API_KEY` | Resend credentials |
| `CLOUDINARY_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `GEMINI_KEY`, `GEMINI_URL` | Gemini key and generation endpoint |
| `PORT` | Optional HTTP port; defaults to 8080 |

Minimal application configuration:

```properties
server.port=${PORT:8080}
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
resend.api.key=${RESEND_API_KEY}
app.email.from=ECM <noreply@ecm.io.vn>
cloudinary.cloud-name=${CLOUDINARY_NAME}
cloudinary.api-key=${CLOUDINARY_API_KEY}
cloudinary.api-secret=${CLOUDINARY_API_SECRET}
gemini.api.key=${GEMINI_KEY}
gemini.api.url=${GEMINI_URL}
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=25MB
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

From `backend/`:

```powershell
.\mvnw.cmd spring-boot:run
```

On macOS/Linux, use `./mvnw spring-boot:run`.

### Web

`frontend/src/utils/axiosConfig.ts` currently uses `https://api.ecm.io.vn/api`. Change `baseURL` to `http://localhost:8080/api` for local development. This file and backend `CorsConfig.java` are ignored by Git; restore/create them if missing and allow the web origin (`http://localhost:3000`) in backend CORS.

From `frontend/`:

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

### Mobile

Configure `ExtraCenterMobile/src/api/axiosClient.ts`: Android emulators use `http://10.0.2.2:8080/api`; physical devices need the backend computer's LAN address. The current iOS configuration uses a LAN address, which must also be updated for your environment.

From `ExtraCenterMobile/`:

```sh
npm install
npm start
```

In a second terminal in that directory, run `npm run android`. On macOS, install iOS dependencies and launch:

```sh
cd ios
pod install
cd ..
npm run ios
```

## API overview

| Prefix | Purpose |
| --- | --- |
| `/api/users` | Authentication, verification, profiles, administration |
| `/api/centers` | Centers, staff, students, subjects, grades, rooms, slots |
| `/api/courses` | Courses, invitations, sessions, gradebook |
| `/api/enrollments` | Enrollment |
| `/api/schedule` | Teacher/student schedules |
| `/api/class-sessions` | Class sessions |
| `/api/attendance` | Attendance sheets and records |
| `/api/assignments` | Assignments, submissions, grading |
| `/api/materials` | Resources and uploads |
| `/api/ai` | Material summaries |
| `/api/quizzes` | Generation, creation, submissions, results |
| `/api/centers/finance` | Center finances |
| `/api/courses/finance` | Course finances |
| `/api/teacher/finance` | Teacher finances |
| `/api/tuition` | Tuition, installments, payments |

At `http://localhost:8080`, use `/swagger-ui.html` for interactive documentation, `/v3/api-docs` for OpenAPI JSON, `/api/` for the welcome page, `/api/health` for health, and `/api/status` for service information. See [the API status guide](backend/API_DOCUMENTATION.md).

## Build and checks

Run commands from their component directory:

| Component | Commands |
| --- | --- |
| Backend | `.\mvnw.cmd test`, `.\mvnw.cmd clean package` (Windows); `./mvnw test`, `./mvnw clean package` (macOS/Linux) |
| Web | `npm run lint`, `npm run build`, `npm start` |
| Mobile | `npm run lint`, `npm test`, `npm run android` or `npm run ios` |

Backend integration tests require configuration and a database. AI workflows require working Gemini credentials.

## Deployment

`backend/Dockerfile` uses Maven/Temurin 17 to package the application with tests skipped, then a Temurin 17 runtime image exposing port 8080. From `backend/`:

```sh
docker build -t ecm-backend .
docker run --env-file /path/to/backend.env -p 8080:8080 ecm-backend
```

Provide the backend configuration file before building and set runtime variables as above. Build the web app with `npm run build` and run `npm start`, or use a Next.js-compatible host. Configure its API URL and backend CORS origins for deployment. Mobile releases require Android/iOS signing and distribution setup.