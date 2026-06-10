package com.extracenter.backend.repository;

import com.extracenter.backend.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    // 1. Get all attempts for a student on a specific quiz (to show their history)
    List<QuizAttempt> findByQuizIdAndStudentId(Long quizId, Long studentId);

    // 2. Count attempts to enforce the "maxAttempts" rule
    long countByQuizIdAndStudentId(Long quizId, Long studentId);

    // 3. Find their absolute BEST score to send to the gradebook!
    Optional<QuizAttempt> findTopByQuizIdAndStudentIdOrderByScoreDesc(Long quizId, Long studentId);
}