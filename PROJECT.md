# Education Center Management

## Project Description

Education Center Management is a full-stack tutoring center management system designed to help private learning centers manage their daily operations in one place. The project supports the main academic and administrative workflows of a center, including user management, center and course organization, class scheduling, student enrollment, attendance tracking, assignment handling, and learning material distribution.

The system is built for three main user groups:

- Admins manage accounts, monitor users, and control platform access.
- Teachers manage centers, courses, students, schedules, assignments, and class activities.
- Students view their courses, schedules, profile information, and learning-related updates.

This project solves the common problem of tutoring centers using disconnected tools for communication, scheduling, attendance, and course management. By centralizing these tasks into a single platform, Education Center Management improves organization, reduces manual work, and gives each user role a clearer view of the information they need.

## Main Features

- Role-based authentication and authorization for admin, teacher, and student accounts.
- Account registration, login, OTP verification, password changes, and account locking.
- Center management, including teachers, students, subjects, grades, classrooms, and class slots.
- Course management with teacher assignment, invitations, enrollment, and student lists.
- Schedule management for teachers and students.
- Attendance tracking by session and class schedule.
- Assignment creation, submission, grading, and material sharing.
- Profile management for different user roles.
- Web access to AI material summaries, quizzes, weighted gradebooks, finance records, tuition plans, installments, and payments.
- A mobile application for authentication, admin user management, and teacher center, course, student, and profile workflows.

## System Architecture

The project is organized into three main parts:

### 1. Backend

The backend is built with Spring Boot and provides REST APIs for the whole system. It handles business logic, authentication, database access, email support, file upload integration, and role-based security.

Key backend responsibilities:

- Manage users, roles, centers, courses, enrollments, schedules, attendance, assignments, and materials.
- Expose APIs used by both the web frontend and the mobile app.
- Secure endpoints using Spring Security and JWT-based authentication.
- Persist data with JPA and PostgreSQL.

### 2. Web Frontend

The web frontend is built with Next.js and TypeScript. It provides a browser-based interface for the system, including public pages, authentication screens, and role-specific dashboards for admins, teachers, and students.

Key frontend responsibilities:

- Provide a responsive interface for desktop users.
- Support login, registration, OTP verification, and protected pages.
- Allow teachers and admins to manage academic and operational data.
- Allow students to view courses, schedules, and personal information.

### 3. Mobile Application

The mobile app is built with React Native and TypeScript. It gives users mobile access to the same core services, especially role-based login, dashboard access, and learning center management features.

Key mobile responsibilities:

- Provide portable access for admins and teachers.
- Support login, verification, and role-based navigation.
- Allow teachers to manage centers, courses, and students on mobile devices.

## Target Use Case

This project is intended for education centers, tutoring centers, or small educational organizations that need a centralized management platform. It is especially useful in environments where administrators, teachers, and students all need access to different parts of the same academic system.

## Technology Stack

- Backend: Spring Boot, Spring Security, Spring Data JPA, PostgreSQL, JWT, Java 17
- Web frontend: Next.js, React, TypeScript
- Mobile frontend: React Native, TypeScript
- Styling and UI: Tailwind CSS and NativeWind
- Additional services: Email verification and Cloudinary file upload support

## Summary

In short, Education Center Management is a cross-platform education management application for tutoring centers. It combines administration, teaching operations, and student access into one system, making it easier to manage centers, courses, schedules, attendance, assignments, and user accounts from both web and mobile platforms.
