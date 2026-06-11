package com.extracenter.backend.service;

import java.time.LocalDate;
import java.util.List;


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
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.CourseFinanceRecordRepository;
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
    private UserRepository userRepository;

    @Transactional
    public CourseFinanceRecord createRecord(Long courseId, FinanceRecordRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        User currentUser = getCurrentUser();
        Long actorUserId = currentUser.getId();
        assertCourseOwnerPermission(courseId, actorUserId);


        validateAmount(request.getAmountVnd());
        CourseFinanceRecord record = new CourseFinanceRecord();

        record.setCourse(course);
        record.setName(request.getName());
        record.setType(request.getType());
        record.setAmountVnd(request.getAmountVnd());
        record.setDescription(request.getDescription());
        record.setDate(request.getDate());

        record.setCreatedBy(currentUser);


        return courseFinanceRecordRepository.save(record);
    }

    @Transactional
    public CourseFinanceRecord updateRecord(Long recordId, FinanceRecordRequest request) {
        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        Course course = existing.getCourse();
        Long actorUserId = getCurrentUser().getId();
        assertCourseOwnerPermission(course.getId(), actorUserId);

        validateAmount(request.getAmountVnd());

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());

        // Do NOT overwrite createdBy on update.
        return courseFinanceRecordRepository.save(existing);

    }

    @Transactional
    public void deleteRecord(Long recordId) {
        Long actorUserId = getCurrentUser().getId();

        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        Course course = existing.getCourse();
        assertCourseOwnerPermission(course.getId(), actorUserId);

        courseFinanceRecordRepository.delete(existing);
    }

    public List<CourseFinanceRecord> listRecords(Long courseId, LocalDate start, LocalDate end) {
        assertCourseOwnerPermission(courseId, getCurrentUser().getId());
        return courseFinanceRecordRepository.findByCourseIdAndDateBetween(courseId, start, end);
    }

    // =========================
    // Reports
    // =========================

    public FinanceReportResponse monthlyReport(Long courseId, LocalDate date) {
        assertCourseOwnerPermission(courseId, getCurrentUser().getId());
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

        // Use repository-level aggregation to avoid loading all TuitionPayments into memory.
        Long tuitionRevenueVnd = tuitionPaymentRepository.sumTuitionRevenueByCourseIdAndPaidAtBetween(
                courseId,
                start,
                end);
        tuitionRevenueVnd = tuitionRevenueVnd != null ? tuitionRevenueVnd : 0L;


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

        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        if (actor.getRole() != null && "ADMIN".equalsIgnoreCase(actor.getRole().getName())) {
            return;
        }

        throw new RuntimeException("You do not have permission to manage this course finance.");
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

