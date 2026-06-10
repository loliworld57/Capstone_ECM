package com.extracenter.backend.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.entity.ClassSession;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

        // 1. Get all lesson days for a specific course (Sorted by date)
        // Used on the "Course Details" page to show the syllabus/timeline.
        List<ClassSession> findByCourseIdOrderByDateAsc(Long courseId);

        List<ClassSession> findByCourseId(Long courseId);

        // 2. Calendar View (Admin): Get ALL classes happening within a specific week or
        // month
        List<ClassSession> findByDateBetween(LocalDate startDate, LocalDate endDate);

        // 3. Calendar View (Teacher): Get classes for a specific teacher within a date
        // range
        @Query("SELECT s FROM ClassSession s WHERE s.course.teacher.id = :teacherId AND s.date BETWEEN :startDate AND :endDate ORDER BY s.date ASC, s.startTime ASC")
        List<ClassSession> findByTeacherIdAndDateRange(
                        @Param("teacherId") Long teacherId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        // 4. Calendar View (Student): Get classes for a specific student within a date
        // range
        @Query("SELECT s FROM ClassSession s JOIN s.course c JOIN c.enrollments e WHERE e.student.id = :studentId AND s.date BETWEEN :startDate AND :endDate ORDER BY s.date ASC, s.startTime ASC")
        List<ClassSession> findByStudentIdAndDateRange(
                        @Param("studentId") Long studentId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        boolean existsByCourseIdAndDateAndStartTimeAndEndTime(Long courseId, LocalDate date, LocalTime startTime,
                        LocalTime endTime);

        boolean existsByCourseIdAndDateAndStartTimeAndEndTimeAndIdNot(
                        Long courseId,
                        LocalDate date,
                        LocalTime startTime,
                        LocalTime endTime,
                        Long id);

        boolean existsByCourseIdAndDateGreaterThanEqual(Long courseId, LocalDate date);

        @Modifying
        @Transactional
        void deleteByCourseId(Long courseId);

        @Query("SELECT cs FROM ClassSession cs JOIN cs.course c JOIN c.enrollments e JOIN e.student s WHERE s.id = :studentId AND cs.startTime >= :now ORDER BY cs.startTime ASC")
        List<ClassSession> findUpcomingSessionsByStudentId(@Param("studentId") Long studentId,
                        @Param("now") LocalDateTime now);

}