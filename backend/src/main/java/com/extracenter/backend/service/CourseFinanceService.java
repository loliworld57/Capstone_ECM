package com.extracenter.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.FinanceRecordRequest;
import com.extracenter.backend.dto.FinanceReportResponse;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.CourseFinanceRecord;
import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.CourseFinanceRecordRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;
import com.extracenter.backend.repository.UserRepository;


@Service
public class CourseFinanceService {

    @Autowired
    private CourseFinanceRecordRepository courseFinanceRecordRepository;

    @Autowired
    private com.extracenter.backend.repository.CourseRepository courseRepository;

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public CourseFinanceRecord createRecord(Long courseId, FinanceRecordRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        assertCourseOwnerPermission(courseId, request.getActorUserId());
        validateAmount(request.getAmountVnd());

        CourseFinanceRecord record = new CourseFinanceRecord();
        record.setCourse(course);
        record.setName(request.getName());
        record.setType(request.getType());
        record.setAmountVnd(request.getAmountVnd());
        record.setDescription(request.getDescription());
        record.setDate(request.getDate());

        User actor = userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> new RuntimeException("Actor user not found"));
        record.setCreatedBy(actor);

        return courseFinanceRecordRepository.save(record);
    }

    @Transactional
    public CourseFinanceRecord updateRecord(Long recordId, FinanceRecordRequest request) {
        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        Course course = existing.getCourse();
        assertCourseOwnerPermission(course.getId(), request.getActorUserId());
        validateAmount(request.getAmountVnd());

        User actor = userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> new RuntimeException("Actor user not found"));

        // Teacher can only update what they created.
        if (!isCourseOwner(course, request.getActorUserId())
                && (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(request.getActorUserId()))) {
            throw new RuntimeException("You do not have permission to update this record.");
        }

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());
        existing.setCreatedBy(actor);

        return courseFinanceRecordRepository.save(existing);
    }

    @Transactional
    public void deleteRecord(Long recordId, Long actorUserId) {
        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        Course course = existing.getCourse();
        assertCourseOwnerPermission(course.getId(), actorUserId);

        if (!isCourseOwner(course, actorUserId)
                && (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(actorUserId))) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }

        courseFinanceRecordRepository.delete(existing);
    }

    public List<CourseFinanceRecord> listRecords(Long courseId, LocalDate start, LocalDate end) {
        return courseFinanceRecordRepository.findByCourseIdAndDateBetween(courseId, start, end);
    }

    // =========================
    // Reports
    // =========================

    public FinanceReportResponse monthlyReport(Long courseId, LocalDate date) {
        LocalDate start = date.withDayOfMonth(1);
        LocalDate end = date.withDayOfMonth(date.lengthOfMonth());

        return buildReport(courseId, start, end);
    }

    public FinanceReportResponse profitReport(Long courseId, LocalDate date) {
        return monthlyReport(courseId, date);
    }

    private FinanceReportResponse buildReport(Long courseId, LocalDate start, LocalDate end) {
        // Course revenue includes:
        // - TuitionPayment amounts for enrollments of this course (auto-included)
        // - CourseFinanceRecord INCOME

        // Currently no efficient repository for tuition payments by course.
        // Fallback: sum all TuitionPayment and filter by course.
        List<TuitionPayment> allPayments = tuitionPaymentRepository.findAll();
        long tuitionRevenueVnd = allPayments.stream()
                .filter(Objects::nonNull)
                .filter(p -> p.getPaidAt() != null && !p.getPaidAt().isBefore(start) && !p.getPaidAt().isAfter(end))
                .filter(p -> p.getEnrollment() != null && p.getEnrollment().getCourse() != null
                        && p.getEnrollment().getCourse().getId().equals(courseId))
                .mapToLong(TuitionPayment::getAmountVnd)
                .sum();

        long incomeVnd = courseFinanceRecordRepository
                .findByCourseIdAndDateBetween(courseId, start, end)
                .stream()
                .filter(r -> r != null && r.getType() == FinanceType.INCOME)
                .mapToLong(CourseFinanceRecord::getAmountVnd)
                .sum();

        long expenseVnd = courseFinanceRecordRepository
                .findByCourseIdAndDateBetween(courseId, start, end)
                .stream()
                .filter(r -> r != null && r.getType() == FinanceType.EXPENSE)
                .mapToLong(CourseFinanceRecord::getAmountVnd)
                .sum();

        long revenueVnd = tuitionRevenueVnd + incomeVnd;
        long profitVnd = revenueVnd - expenseVnd;

        return new FinanceReportResponse(revenueVnd, expenseVnd, profitVnd, null);
    }

    private void validateAmount(Long amountVnd) {
        if (amountVnd == null || amountVnd <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }
    }

    private void assertCourseOwnerPermission(Long courseId, Long actorUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        if (course.getCenter() == null || course.getCenter().getManager() == null) {
            throw new RuntimeException("Course center owner not found");
        }

        // Center owner can manage all.
        if (course.getCenter().getManager().getId().equals(actorUserId)) {
            return;
        }

        // Teacher can manage only if teacher owns (createdBy check later).
        if (course.getTeacher() != null && course.getTeacher().getId().equals(actorUserId)) {
            return;
        }

        throw new RuntimeException("You do not have permission to manage this course finance.");
    }

    private boolean isCourseOwner(Course course, Long actorUserId) {
        if (course.getCenter() != null && course.getCenter().getManager() != null
                && course.getCenter().getManager().getId().equals(actorUserId)) {
            return true;
        }
        return course.getTeacher() != null && course.getTeacher().getId().equals(actorUserId);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}

