package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.entity.Attendance;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Fetch the attendance list for a specific lesson (to view or edit)
    List<Attendance> findByClassSessionId(Long classSessionId);

    // Check if attendance has already been taken for this specific lesson
    boolean existsByClassSessionId(Long classSessionId);

    // ADDED BONUS: Find a specific student's attendance for a specific day
    // This is very useful when a student marks themselves present or a teacher
    // edits a single row.
    Optional<Attendance> findByEnrollmentIdAndClassSessionId(Long enrollmentId, Long classSessionId);

    @Modifying
    @Transactional
    void deleteByClassSlotId(Long classSlotId);

    @Modifying
    @Transactional
    void deleteByClassSessionId(Long classSessionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Attendance a WHERE a.classSession.id IN (SELECT cs.id FROM ClassSession cs WHERE cs.course.id = :courseId) OR a.classSlot.id IN (SELECT slot.id FROM ClassSlot slot WHERE slot.course.id = :courseId) OR a.enrollment.id IN (SELECT e.id FROM Enrollment e WHERE e.course.id = :courseId)")
    void deleteByCourseId(@Param("courseId") Long courseId);

    Optional<Attendance> findByClassSessionIdAndEnrollmentStudentId(Long classSessionId, Long studentId);
}