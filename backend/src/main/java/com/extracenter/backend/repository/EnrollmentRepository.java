package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.entity.User;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    // 1. Get the list of classes a student is currently taking (Used for Student
    // Profile/Schedule).
    List<Enrollment> findByStudentIdAndArchivedAtIsNull(Long studentId);

    List<Enrollment> findByStudentId(Long studentId);

    // 2. Check if a student is already registered for this course (Used when Adding
    // a Student).
    boolean existsByStudentIdAndCourseIdAndArchivedAtIsNull(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    // 3. Find the exact Enrollment record based on Student ID and Course ID.
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    Optional<Enrollment> findByStudentIdAndCourseIdAndArchivedAtIsNull(Long studentId, Long courseId);


    // 4. Get the list of students in a specific course (Used by teachers to view
    // their class roster).
    List<Enrollment> findByCourseIdAndArchivedAtIsNull(Long courseId);

    List<Enrollment> findByCourseId(Long courseId);

    @Modifying
    @Transactional
    void deleteByCourseId(Long courseId);

    @Modifying
    @Transactional
    void deleteByStudentId(Long studentId);

    // 5. Advanced Query: Find all unique Users (Students) registered in courses
    // belonging to a specific Center.
    // Logic: Traverses Enrollment -> Course -> Center -> ID.
    // The DISTINCT keyword ensures that if a student takes 2 subjects at the same
    // center, they only appear once.
    @Query("SELECT DISTINCT e.student FROM Enrollment e WHERE e.course.center.id = :centerId AND e.archivedAt IS NULL")
    List<User> findStudentsByCenterId(@Param("centerId") Long centerId);

    @Query("SELECT DISTINCT e.student FROM Enrollment e " +
            "LEFT JOIN FETCH e.student.connectedCenters " +
            "WHERE e.course.teacher.id = :teacherId " +
            "AND e.student.isEnabled = true AND e.archivedAt IS NULL")
    List<User> findActiveStudentsByTeacherId(@Param("teacherId") Long teacherId);

    @Query("SELECT DISTINCT e.student FROM Enrollment e " +
            "WHERE e.course.center.id = :centerId " +
            "AND e.course.teacher.id = :teacherId " +
            "AND e.student.isEnabled = true AND e.archivedAt IS NULL")
    List<User> findStudentsByCenterIdAndTeacherId(@Param("centerId") Long centerId,
            @Param("teacherId") Long teacherId);
}
