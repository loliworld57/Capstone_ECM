package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.AssignmentSubmission;

import jakarta.transaction.Transactional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

    // Lấy danh sách học sinh đã nộp bài cho 1 Assignment cụ thể (Dành cho giáo
    // viên)
    // JOIN FETCH giúp lấy đủ student/assignment fields để mapping DTO không bị NULL
    // do LAZY.
    @Query("SELECT sub FROM AssignmentSubmission sub JOIN FETCH sub.student WHERE sub.assignment.id = :assignmentId")
    List<AssignmentSubmission> findByAssignmentIdWithStudent(@Param("assignmentId") Long assignmentId);

    // Tìm bài nộp của 1 học sinh cụ thể trong 1 Assignment
    // JOIN FETCH để bảo đảm studentId được map đầy đủ cho DTO.
    @Query("SELECT sub FROM AssignmentSubmission sub JOIN FETCH sub.student WHERE sub.assignment.id = :assignmentId AND sub.student.id = :studentId")
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentIdWithStudent(@Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId);

    // GIỮ TÊN METHOD TRUYỀN THỐNG để AssignmentService/submit vẫn compile.
    @Query("SELECT sub FROM AssignmentSubmission sub JOIN FETCH sub.student WHERE sub.assignment.id = :assignmentId AND sub.student.id = :studentId")
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(@Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId);

    List<AssignmentSubmission> findByStudentId(Long studentId);

    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM AssignmentSubmission sub WHERE sub.assignment.id IN (SELECT a.id FROM Assignment a WHERE a.course.id = :courseId)")
    void deleteByCourseId(@Param("courseId") Long courseId);
}