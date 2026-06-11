package com.extracenter.backend.repository;

import com.extracenter.backend.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    List<QuizSubmission> findByQuizIdAndStudentId(Long quizId, Long studentId);

    List<QuizSubmission> findByQuizId(Long quizId);

    @Query("SELECT qs FROM QuizSubmission qs WHERE qs.quiz.id = :quizId AND qs.studentId IN " +
            "(SELECT u.id FROM User u WHERE u.role.name = 'STUDENT')")
    List<QuizSubmission> findStudentSubmissionsByQuizId(@Param("quizId") Long quizId);
}