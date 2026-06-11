package com.extracenter.backend.service;

import com.extracenter.backend.dto.EnrollmentRequest;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private TuitionAccountService tuitionAccountService;

    // Add a student to a specific course
    // @Transactional is required because we are modifying both Enrollment AND User
    // tables
    @Transactional
    public Enrollment addStudentToCourse(EnrollmentRequest request) {

        // 1. Find the Student by Email
        User student = userRepository.findByEmail(request.getStudentEmail())
                .orElseThrow(() -> new RuntimeException("Student not found with email: " + request.getStudentEmail()));

        // 2. Verify that this user actually has the STUDENT role
        // (Using ignoreCase prevents bugs if the database has "Student" instead of
        // "STUDENT")
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getName())) {
            throw new RuntimeException("This user is not a Student! Current role: " + student.getRole().getName());
        }

        // 3. Find the Course
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + request.getCourseId()));

        // 4. Check if already enrolled (Prevents duplicate data)
        if (enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), request.getCourseId())) {
            throw new RuntimeException("This student is already enrolled in this class!");
        }

        // 5. Create and save the Enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrollmentDate(LocalDate.now());

        // Initialize default scores so the frontend doesn't get "null" when loading the
        // gradebook
        enrollment.setProgressScore(0f);
        enrollment.setTestScore(0f);
        enrollment.setFinalScore(0f);
        enrollment.setPerformance("N/A");

        // 6. Automatically link the student to the Course's Center
        // Added Null Check: Ensure the course actually belongs to a center before
        // linking!
        if (course.getCenter() != null) {
            userService.connectStudentToCenter(student.getId(), course.getCenter().getId());
        }

        Enrollment saved = enrollmentRepository.save(enrollment);

        if (request.getTuitionAccount() != null) {
            request.getTuitionAccount().setEnrollmentId(saved.getId());
            tuitionAccountService.createOrUpdateAccount(request.getTuitionAccount());
        } else {
            tuitionAccountService.createDefaultAccount(saved);
        }

        return saved;
    }
}
