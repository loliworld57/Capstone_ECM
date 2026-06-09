package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.CourseFinanceRecord;
import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.User;

public interface CourseFinanceRecordRepository extends JpaRepository<CourseFinanceRecord, Long> {

    List<CourseFinanceRecord> findByCourseIdAndDateBetween(Long courseId, LocalDate start, LocalDate end);

    List<CourseFinanceRecord> findByCourseIdAndCreatedByIdAndDateBetween(Long courseId, Long createdById, LocalDate start, LocalDate end);

    List<CourseFinanceRecord> findByCourseAndTypeAndDateBetween(Course course, FinanceType type, LocalDate start, LocalDate end);

    List<CourseFinanceRecord> findByCourseAndCreatedByAndTypeAndDateBetween(Course course, User createdBy, FinanceType type, LocalDate start, LocalDate end);
}

