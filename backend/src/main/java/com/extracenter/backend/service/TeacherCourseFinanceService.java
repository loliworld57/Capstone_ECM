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
import com.extracenter.backend.repository.CourseRepository;

import com.extracenter.backend.repository.UserRepository;

@Service
public class TeacherCourseFinanceService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseFinanceRecordRepository courseFinanceRecordRepository;



    @Autowired
    private UserRepository userRepository;

    @Transactional
    public CourseFinanceRecord createRecord(Long courseId, FinanceRecordRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        User actor = resolveCurrentTeacher();
        if (course.getTeacher() == null || !course.getTeacher().getId().equals(actor.getId())) {
            throw new RuntimeException("Only the course's assigned teacher can manage course finance.");
        }



        validateAmount(request.getAmountVnd());

        CourseFinanceRecord record = new CourseFinanceRecord();
        record.setCourse(course);
        record.setName(request.getName());
        record.setType(request.getType());
        record.setAmountVnd(request.getAmountVnd());
        record.setDescription(request.getDescription());
        record.setDate(request.getDate());
        record.setCreatedBy(actor);

        return courseFinanceRecordRepository.save(record);
    }

    @Transactional
    public CourseFinanceRecord updateRecord(Long recordId, FinanceRecordRequest request) {
        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        User actor = resolveCurrentTeacher();
        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(actor.getId())) {
            throw new RuntimeException("You can only update your own course finance records.");
        }

        // createdBy is immutable; update only business fields.
        validateAmount(request.getAmountVnd());

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());


        return courseFinanceRecordRepository.save(existing);
    }

    @Transactional
    public void deleteRecord(Long recordId) {
        CourseFinanceRecord existing = courseFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Course finance record not found: " + recordId));

        User actor = resolveCurrentTeacher();

        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(actor.getId())) {
            throw new RuntimeException("You can only delete your own course finance records.");
        }

        courseFinanceRecordRepository.delete(existing);
    }


    @Transactional(readOnly = true)
    public List<CourseFinanceRecord> listRecords(Long courseId, LocalDate start, LocalDate end) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        User actor = resolveCurrentTeacher();
        if (course.getTeacher() == null || !course.getTeacher().getId().equals(actor.getId())) {
            throw new RuntimeException("Only the course's assigned teacher can view course finance records.");
        }

        // Teacher sees their created records (not necessarily all course records)
        return courseFinanceRecordRepository.findByCourseIdAndCreatedByIdAndDateBetween(
                courseId, actor.getId(), start, end);
    }

    public FinanceReportResponse monthlyReport(Long courseId, LocalDate date) {
        // Course profit report visible to teacher; respects that revenue includes tuition payments,
        // and expenses/income are taken from course finance records.
        // Service computes overall profit; teacher view is enforced via controller/ownership rules elsewhere.
        // Teacher personal finance is independent from tuition (tuition revenue belongs to center).
        // So for teacher course finance reports, revenue/expense are computed only from records created by the teacher.
        LocalDate start = date.withDayOfMonth(1);
        LocalDate end = date.withDayOfMonth(date.lengthOfMonth());

        long income = sumCourseFinanceByTeacherCreated(courseId, FinanceType.INCOME, start, end);
        long expense = sumCourseFinanceByTeacherCreated(courseId, FinanceType.EXPENSE, start, end);

        long revenue = income;
        long profit = revenue - expense;
        return new FinanceReportResponse(revenue, expense, profit, null);
    }

    public FinanceReportResponse profitReport(Long courseId, LocalDate date) {
        return monthlyReport(courseId, date);
    }

    private long sumCourseFinanceByTeacherCreated(Long courseId, FinanceType type, LocalDate start, LocalDate end) {
        User actor = resolveCurrentTeacher();
        return courseFinanceRecordRepository
                .findByCourseIdAndCreatedByIdAndDateBetween(courseId, actor.getId(), start, end)
                .stream()
                .filter(r -> r != null && r.getType() == type)
                .mapToLong(CourseFinanceRecord::getAmountVnd)
                .sum();
    }


    private void validateAmount(Long amountVnd) {
        if (amountVnd == null || amountVnd <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }
    }

    private User resolveCurrentTeacher() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}

