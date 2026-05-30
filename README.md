# Extra Center Management (ECM)

A professional full-stack education management platform designed to centralize academic and administrative operations for private tutoring centers, learning academies, and educational institutions.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [User Roles & Permissions](#user-roles--permissions)
- [System Architecture](#system-architecture)
- [Security Implementation](#security-implementation)
- [Technology Stack](#technology-stack)
- [Database Architecture](#database-architecture)
- [API Overview](#api-overview)
- [Deployment Architecture](#deployment-architecture)
- [Future Enhancements](#future-enhancements)

---

## Project Overview

### Business Problem

Private tutoring centers and educational institutions commonly struggle with fragmented operations, relying on multiple disconnected tools for communication, scheduling, attendance tracking, course management, and student enrollment. This leads to data silos, inefficient workflows, duplicate entry, and poor visibility across administrative and academic functions.

### Solution

Extra Center Management provides a **unified, role-based platform** that consolidates all core operations—from center administration to course delivery to student learning—into a single, cohesive system. The platform eliminates manual workflows, improves data consistency, and provides role-specific dashboards tailored to administrators, teachers, and students.

### Target Users

- **Administrators**: Manage multiple centers, monitor users, oversee platform access and system health.
- **Teachers/Center Managers**: Operate centers, create and manage courses, track student enrollment, manage assignments, monitor attendance, and distribute learning materials.
- **Students**: Access enrolled courses, view schedules, submit assignments, track attendance, and monitor progress.

### Value Proposition

- **Operational Efficiency**: Centralized management reduces manual work and communication overhead.
- **Data Visibility**: Real-time dashboards and reports provide insight into center operations and student progress.
- **Scalability**: Supports multiple centers, courses, and user roles from a single platform.
- **Cross-Platform Access**: Web and mobile apps ensure accessibility for all user types.
- **Extensibility**: Architected for future expansion into financial education, AI document analysis, and personalized quiz generation.

---

## Key Features

### Authentication & Access Control

- **Role-Based Authentication**: Secure login with role-based authorization (ADMIN, TEACHER, MANAGER, STUDENT).
- **OTP Verification**: Email-based one-time password verification for account security.
- **Account Management**: Password change, account locking, and recovery email support.
- **JWT-Based Sessions**: Stateless authentication using JSON Web Tokens for API security.

### Center Management

- **Multi-Center Support**: Create and manage multiple tutoring centers within a single platform.
- **Center Configuration**: Define subjects, grades, classrooms, and class time slots for each center.
- **Staff Management**: Assign teachers and managers to centers with role-based responsibilities.
- **Student Registration**: Enroll students into centers and track their academic records.

### Course & Schedule Management

- **Course Creation**: Create courses tied to subjects and grades within a center.
- **Teacher Assignment**: Assign primary and invitational teachers to courses with acceptance workflow.
- **Class Scheduling**: Define recurring class slots and individual class sessions with time and room information.
- **Enrollment Management**: Track and manage student enrollment in courses with status tracking.
- **Schedule Visibility**: Dedicated dashboards for teachers and students to view their schedules.

### Attendance Tracking

- **Session-Based Attendance**: Record attendance for each class session with status options (Present, Absent, Excused).
- **Attendance Sheets**: Generate and manage attendance reports by course and session.
- **Historical Tracking**: Maintain complete attendance records for compliance and progress monitoring.

### Assignments & Grading

- **Assignment Creation**: Teachers create assignments with descriptions, due dates, and optional file attachments.
- **Student Submissions**: Students submit assignments with file uploads before deadlines.
- **Grading System**: Teachers grade submissions, provide feedback, and track student performance.
- **Progress Tracking**: Calculate and store progress scores and test scores for each enrolled student.

### Learning Materials

- **Material Distribution**: Teachers upload and distribute course materials (PDFs, documents, resources).
- **File Management**: Integration with Cloudinary for secure file storage and retrieval.
- **Access Control**: Students access materials assigned to their enrolled courses.

### User Profiles

- **Profile Management**: Users update personal information, contact details, and avatar images.
- **Role-Specific Dashboards**: Customized views for admins, teachers, and students.
- **Progress Monitoring**: Teachers and students track learning progress and course status.

### Grade Management

- **Flexible Grading**: Store progress scores, test scores, and final grades per course enrollment.
- **Scholarship Integration**: Support for scholarship tracking tied to specific course enrollments.

### Multi-Platform Delivery

- **Web Application**: Desktop-focused responsive interface with full feature set for all user roles.
- **Mobile Application**: Native mobile app for iOS and Android with core features for on-the-go access.

---

## User Roles & Permissions

| Role | Permissions | Responsibilities |
|------|-------------|------------------|
| **ADMIN** | Full system access; manage all users, centers, courses, and platform settings | Monitor platform health, manage administrators, oversee all centers, handle system configuration |
| **TEACHER/MANAGER** | Create and manage centers, courses, assignments, and students; manage staff | Operate learning centers, create academic content, track student progress, manage enrollments |
| **STUDENT** | View enrolled courses, schedule, assignments, grades, and materials | Participate in courses, submit assignments, track attendance, monitor progress |

---

## System Architecture

### 1. Backend Service

**Framework**: Spring Boot 3.5.7 (Spring Framework 6.x)  
**Language**: Java 17  
**Runtime**: OpenJDK/Eclipse Temurin 17

#### Core Components

| Component | Responsibility |
|-----------|-----------------|
| **Controllers** | HTTP request handling for Users, Centers, Courses, Enrollments, Schedules, Assignments, Attendance, Materials, ClassSessions |
| **Services** | Business logic: UserService, CenterService, CourseService, EnrollmentService, AssignmentService, AttendanceService, MaterialService, ClassSessionService, EmailService, CloudinaryService |
| **Repositories** | Database access layer using Spring Data JPA |
| **Entities** | Core domain models: User, Center, Course, Enrollment, Attendance, Assignment, ClassSession, ClassSlot, Material, Grade, Subject, Role, VerificationToken, Scholarship |
| **Security** | JWT authentication filter, role-based access control, method-level security |
| **Configuration** | CORS, Async processing, Cloudinary integration, SecurityConfig, JwtAuthenticationFilter |

#### Authentication & Authorization

- **JWT Implementation**: Token-based stateless authentication using JJWT library.
- **Spring Security**: Method-level security with `@EnableMethodSecurity` and `@PreAuthorize` annotations.
- **Filter Chain**: Custom `JwtAuthenticationFilter` validates tokens on every protected request.
- **Public Endpoints**: `/api/users/login`, `/api/users/register-teacher`, `/api/users/verify-otp`, `/api/health`, `/api/status`, `/swagger-ui.html`.
- **Protected Endpoints**: Role-specific access control enforced via security configuration.

#### Database Layer

- **ORM**: Hibernate via Spring Data JPA.
- **Database**: PostgreSQL (configurable via environment variables).
- **Migrations**: Schema is auto-generated and updated via `spring.jpa.hibernate.ddl-auto=update`.
- **Relationships**: Supports complex many-to-many and one-to-many relationships with lazy loading.

#### File Storage

- **Service**: Cloudinary integration via `CloudinaryService`.
- **Configuration**: API key, cloud name, and API secret via environment variables.
- **Use Case**: Upload and serve assignment files, learning materials, and user avatars.

#### Email Service

- **Provider**: Resend (email delivery API).
- **Configuration**: API key via environment variables.
- **Use Cases**: OTP delivery, account verification, notifications.
- **Features**: Asynchronous email sending to avoid blocking request handlers.

#### API Documentation

- **Framework**: SpringDoc OpenAPI (Swagger UI).
- **Access**: `/swagger-ui.html` for interactive documentation, `/v3/api-docs` for OpenAPI JSON spec.
- **Health Check**: `/api/health` and `/api/status` endpoints for service monitoring.

### 2. Web Application (Frontend)

**Framework**: Next.js 16.0.10  
**Language**: TypeScript 5.x  
**Runtime**: Node.js

#### Key Responsibilities

- Deliver a responsive, desktop-first web interface.
- Handle authentication flows (login, registration, OTP verification).
- Provide role-specific dashboards and feature access.
- Enable CRUD operations for all business entities via REST API calls.

#### Structure & Pages

| Route | User Role | Purpose |
|-------|-----------|---------|
| `/login` | Public | User authentication |
| `/register` | Public | Teacher account registration |
| `/verify` | Public | OTP verification |
| `/admin/users` | ADMIN | User management and monitoring |
| `/teacher/centers` | TEACHER | Center management and details |
| `/teacher/courses` | TEACHER | Course creation, editing, enrollment management |
| `/teacher/students` | TEACHER | Student list and management |
| `/teacher/schedule` | TEACHER | View and manage class schedules |
| `/teacher/dashboard` | TEACHER | Overview of centers, courses, students |
| `/student/courses` | STUDENT | View enrolled courses and details |
| `/student/dashboard` | STUDENT | Student overview and progress |

#### Key Components

- **Calendar Components**: Integration with `react-big-calendar` and `react-calendar-timeline` for schedule visualization.
- **Modal Forms**: Dynamic modals for creating/editing centers, courses, classrooms, students, assignments.
- **API Integration**: HTTP client via Axios with custom configuration for authentication and error handling.
- **Toast Notifications**: Real-time feedback via `react-hot-toast`.
- **Styling**: Tailwind CSS 4.x with responsive design patterns.

### 3. Mobile Application

**Framework**: React Native 0.82.1  
**Language**: TypeScript 5.x  
**Platform**: iOS (via Xcode) and Android (via Gradle)

#### Key Responsibilities

- Deliver native mobile experience for iOS and Android.
- Mirror core features from web app for on-the-go access.
- Support role-specific navigation and UI layouts.

#### Structure & Screens

| Screen | User Role | Purpose |
|--------|-----------|---------|
| Login | Public | User authentication |
| Register | Public | Teacher account registration |
| Verify | Public | OTP verification |
| AdminDashboard | ADMIN | User monitoring and stats |
| TeacherDashboard | TEACHER | Center overview and stats |
| CenterManagement | TEACHER | View and edit centers |
| CourseManagement | TEACHER | Create and manage courses |
| StudentManagement | TEACHER | View student list and details |
| Profile | All | User profile management |

#### Key Libraries

- **Navigation**: React Navigation (BottomTabNavigator, NativeStack).
- **HTTP Client**: Axios for API communication.
- **Storage**: AsyncStorage for local data persistence.
- **Styling**: NativeWind (Tailwind CSS for React Native).
- **Icons**: lucide-react-native for UI icons.

---

## Security Implementation

### Authentication

| Feature | Implementation |
|---------|-----------------|
| **Login** | Email + password verification with bcrypt-hashed password storage (Spring Security) |
| **OTP Verification** | Time-limited one-time password sent via Resend email service |
| **Session Management** | Stateless JWT tokens with configurable expiration |
| **Token Validation** | JwtAuthenticationFilter validates token on every protected request |
| **Account Locking** | Automatic account lock after failed attempts (configurable via `isLocked` field) |

### Authorization

| Level | Mechanism |
|-------|-----------|
| **Role-Based Access Control (RBAC)** | Four roles: ADMIN, TEACHER, MANAGER, STUDENT |
| **Method-Level Security** | `@PreAuthorize` annotations on controller methods and services |
| **Endpoint Protection** | SecurityConfig defines public vs. protected routes by role |
| **Data Isolation** | Users can only access data within their assigned role and center |

### Data Protection

- **Password Management**: Secure password hashing via Spring Security (BCrypt).
- **Email Verification**: Recovery email and institutional email for account recovery.
- **CSRF Protection**: Disabled for REST API (stateless token-based auth).
- **CORS Configuration**: Explicit CORS setup to allow frontend/mobile app requests.
- **HTTPS-Ready**: Application can be deployed behind HTTPS reverse proxy.

---

## Technology Stack

### Backend

| Category | Technology |
|----------|-----------|
| **Framework** | Spring Boot 3.5.7, Spring Framework 6.x |
| **Language** | Java 17 (LTS) |
| **Security** | Spring Security 6.x, JWT (JJWT), OAuth2-ready architecture |
| **Data Access** | Spring Data JPA, Hibernate ORM |
| **Database Driver** | PostgreSQL JDBC driver |
| **File Upload** | Cloudinary (HTTP client) |
| **Email** | Resend API, Spring Mail |
| **API Documentation** | SpringDoc OpenAPI 2.8.17 (Swagger UI) |
| **Build Tool** | Maven 3.9.9 |
| **Container** | Docker (Multi-stage Dockerfile) |

### Web Frontend

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.0.10 |
| **Language** | TypeScript 5.x |
| **UI Library** | React 19.2.0 |
| **Styling** | Tailwind CSS 4.x, PostCSS |
| **Calendar/Schedule** | react-big-calendar, react-calendar-timeline |
| **HTTP Client** | Axios 1.16.0 |
| **Notifications** | react-hot-toast |
| **Icons** | lucide-react |
| **Build Tool** | Next.js built-in (Webpack) |
| **Linting** | ESLint 9 |

### Mobile Application

| Category | Technology |
|----------|-----------|
| **Framework** | React Native 0.82.1 |
| **Language** | TypeScript 5.x |
| **Navigation** | React Navigation 7.x (BottomTabNavigator, NativeStack) |
| **Styling** | NativeWind 4.2.1 (Tailwind CSS), Tailwind CSS 3.4.18 |
| **HTTP Client** | Axios 1.13.2 |
| **Local Storage** | AsyncStorage 2.2.0 |
| **Icons** | lucide-react-native |
| **Platform Tools** | Android Studio (Gradle), Xcode (CocoaPods) |
| **Build Tool** | Metro, React Native CLI |

### Infrastructure & DevOps

| Service | Technology |
|---------|-----------|
| **Database Host** | PostgreSQL (environment-configurable) |
| **Email Delivery** | Resend API |
| **File Storage** | Cloudinary CDN |
| **Backend Deployment** | Docker container (Alpine JDK 17) |
| **Frontend Hosting** | Vercel, Netlify, or self-hosted Node.js server |
| **Mobile Distribution** | Apple App Store (iOS), Google Play Store (Android) |

---

## Database Architecture

### Core Entities & Relationships

```
┌─────────────────────────────────────────────────┐
│                    User                         │
├─────────────────────────────────────────────────┤
│ id, firstName, lastName, email, password        │
│ personalEmail, phoneNumber, dateOfBirth         │
│ avatarImg, isLocked, isEnabled, createdDate     │
└────────────┬────────────────────────────────────┘
             │ 1:N
             ├─→ [Role] (ADMIN, TEACHER, STUDENT, MANAGER)
             ├─→ [Center] (manager)
             ├─→ [Course] (teacher)
             ├─→ [Enrollment] (student)
             └─→ [VerificationToken]

┌────────────────────────────────────┐
│           Center                   │
├────────────────────────────────────┤
│ id, name, description, phoneNumber │
│ avatarImg, createdDate, archivedAt │
│ manager_id (FK → User)             │
└────────┬───────────────────────────┘
         │ 1:N
         ├─→ [Course]
         ├─→ [Classroom]
         ├─→ [ClassSlot]
         ├─→ [Grade]
         └─→ [Subject]

┌─────────────────────────────────┐
│          Course                 │
├─────────────────────────────────┤
│ id, name, description           │
│ startDate, endDate, status      │
│ center_id, teacher_id           │
└────────┬────────────────────────┘
         │ 1:N
         ├─→ [Enrollment]
         ├─→ [Assignment]
         ├─→ [ClassSession]
         └─→ [Material]

┌─────────────────────────────────┐
│        Enrollment               │
├─────────────────────────────────┤
│ id, student_id, course_id       │
│ scholarshipId, enrollmentDate   │
│ progressScore, testScore        │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│        Attendance                │
├──────────────────────────────────┤
│ id, student_id, classSession_id  │
│ status (Present/Absent/Excused)  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│        Assignment                │
├──────────────────────────────────┤
│ id, title, description, dueDate  │
│ course_id, fileUrl, createdDate  │
└────────┬─────────────────────────┘
         │ 1:N
         └─→ [AssignmentSubmission]

┌──────────────────────────────────┐
│        Material                  │
├──────────────────────────────────┤
│ id, title, description, fileUrl  │
│ course_id, uploadedDate          │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│        ClassSession              │
├──────────────────────────────────┤
│ id, sessionDate, startTime       │
│ endTime, course_id               │
└─────────────────────────────────┘
```

### Key Entities

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **User** | Platform users (admins, teachers, students) | id, email, password, personalEmail, role, isLocked, isEnabled |
| **Center** | Tutoring center with manager and infrastructure | id, name, manager_id, description, createdDate |
| **Course** | Academic course within a center | id, name, subject_id, grade_id, teacher_id, center_id, status, startDate, endDate |
| **Enrollment** | Student's enrollment in a course | id, student_id, course_id, enrollmentDate, progressScore, testScore |
| **Attendance** | Record of a student's presence in a class session | id, student_id, classSession_id, status |
| **Assignment** | Homework/task assigned to a course | id, title, course_id, dueDate, fileUrl |
| **Material** | Learning resource (PDF, doc, etc.) for a course | id, title, course_id, fileUrl |
| **ClassSession** | Individual class meeting scheduled for a course | id, course_id, sessionDate, startTime, endTime |
| **ClassSlot** | Recurring time slot for a class (e.g., Monday 10 AM) | id, center_id, dayOfWeek, startTime, endTime |
| **Scholarship** | Financial aid tied to an enrollment | id, name, discountPercentage, enrollment_id |
| **Grade** | Academic grade (e.g., "Grade 10") | id, gradeName |
| **Subject** | Academic subject (e.g., "Mathematics") | id, subjectName |

---

## API Overview

### Endpoint Categories

| Controller | Endpoints | Purpose |
|-----------|-----------|---------|
| **UserController** | `/api/users/login`, `/api/users/register-teacher`, `/api/users/verify-otp`, `/api/users/resend-otp`, `/api/users/teacher/**`, `/api/users/admin/**` | User authentication, registration, profile management |
| **CenterController** | `/api/centers/teacher/**`, `/api/centers/teaching/**`, `/api/centers/**` | Center CRUD, staff management, student management |
| **CourseController** | `/api/courses/teacher/**`, `/api/courses/student/**`, `/api/courses/invitations/**`, `/api/courses/**` | Course management, invitations, enrollments |
| **EnrollmentController** | `/api/enrollments/**` | Manage student enrollments in courses |
| **ScheduleController** | `/api/schedule/teacher/**`, `/api/schedule/student/**` | View and manage class schedules |
| **AssignmentController** | `/api/assignments/student/**`, `/api/assignments/**` | Create assignments, manage submissions, grading |
| **AttendanceController** | `/api/attendance/**` | Record and track attendance |
| **MaterialController** | `/api/materials/**` | Upload and distribute learning materials |
| **ClassSessionController** | `/api/class-sessions/**` | Manage individual class sessions |
| **ApiStatusController** | `/api/health`, `/api/status`, `/api/` | Health check and API documentation links |

### API Documentation

- **Interactive Documentation**: Available at `/swagger-ui.html`
- **OpenAPI Specification**: Available at `/v3/api-docs` (JSON format)
- **Health Check**: `GET /api/health` returns service status
- **Status Endpoint**: `GET /api/status` returns detailed service information and available endpoints

---

## Deployment Architecture

### Backend Deployment

**Container-Based Deployment**

```
┌──────────────────────────────┐
│   Docker Container (Alpine)  │
├──────────────────────────────┤
│  OpenJDK/Eclipse Temurin 17  │
│  Spring Boot Application     │
│  Port 8080 (configurable)    │
└──────────────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    [PostgreSQL]         [Resend API]
    Database             Email Service
         │                   │
         └─────────┬─────────┘
                   │
          [Cloudinary CDN]
          File Storage
```

**Deployment Options**:
- Kubernetes (EKS, GKE, AKS)
- Docker Compose
- Cloud App Platforms (Heroku, Railway, Render)
- Virtual Machines (AWS EC2, Azure VMs, DigitalOcean)

**Environment Configuration**:
```
DB_URL=jdbc:postgresql://host:5432/ecm_db
DB_USERNAME=<postgres_user>
DB_PASSWORD=<postgres_password>
RESEND_API_KEY=<resend_api_key>
CLOUDINARY_NAME=<cloudinary_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
```

### Frontend Deployment

**Web Application**

```
┌──────────────────────────────┐
│   Next.js Server / Static    │
│   (Node.js Runtime)          │
│   Port 3000 (configurable)   │
└──────────────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   [Backend API]       [Vercel CDN]
   (8080)              (Static Assets)
```

**Deployment Options**:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Self-hosted Node.js server

### Mobile Application Deployment

```
┌──────────────────────────────┐
│   iOS App (App Store)        │
│   ✓ Built with Xcode         │
│   ✓ Signed with Apple ID     │
└─────────────┬────────────────┘
              │
         [Backend API]
         (8080)
              │
┌─────────────┴────────────────┐
│                              │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Android App (Google Play)    │
│ ✓ Built with Gradle          │
│ ✓ Signed with Keystore       │
└──────────────────────────────┘
```

**Deployment Process**:
- iOS: Build → Archive → Sign → Submit to App Store
- Android: Build → Sign with Keystore → Submit to Google Play

---

## Future Enhancements

### Planned Features

1. **Finance Module**
   - Financial education content and courses
   - Fee tracking and payment integration
   - Scholarship management dashboard
   - Financial reporting for center administrators

2. **AI-Powered Document Summarization**
   - Automated summarization of financial reports and educational materials
   - Extract key concepts from course documents
   - Generate study guides from lengthy course materials
   - Support for multiple document formats (PDF, Word, images)

3. **AI-Generated Quizzes**
   - Auto-generate quizzes from course materials using AI
   - Adaptive difficulty levels based on student performance
   - Instant grading and feedback
   - Question bank management

4. **Advanced Analytics & Insights**
   - Student performance analytics and predictions
   - Class engagement metrics
   - Center performance dashboards
   - Attendance and dropout risk alerts

5. **Communication Features**
   - In-app messaging between teachers and students
   - Course announcements and notifications
   - Parent/Guardian notifications
   - Email digest summaries

6. **Expanded Role Support**
   - Parent/Guardian role with student progress access
   - Department Head role for multi-center oversight
   - Dedicated Financial Officer role

---

## Summary

**Extra Center Management** is a comprehensive, production-ready education management platform built with modern full-stack technologies. It consolidates the core operational and academic workflows of tutoring centers into a single unified system accessible via web and mobile platforms.

The platform combines:
- **Robust backend** with Spring Boot, JWT security, and PostgreSQL persistence
- **Responsive web frontend** using Next.js and Tailwind CSS
- **Native mobile apps** for iOS and Android with React Native
- **Scalable architecture** supporting multiple centers, courses, and users
- **Professional-grade security** with role-based access control and encrypted authentication
- **Extensible design** for future AI and financial education enhancements

Ideal for educational institutions, tutoring centers, and training organizations seeking to modernize their operations and improve stakeholder engagement.

---

## Quick Links

- **API Documentation**: `http://localhost:8080/swagger-ui.html`
- **Health Check**: `http://localhost:8080/api/health`
- **Backend Source**: `./backend/`
- **Web Frontend Source**: `./frontend/`
- **Mobile Source**: `./ExtraCenterMobile/`