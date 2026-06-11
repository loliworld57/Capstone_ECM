package com.extracenter.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.StudentScoreRequest;
import com.extracenter.backend.dto.StudentScoreResponse;
import com.extracenter.backend.entity.StudentScore;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.entity.AssignmentSubmission;
import com.extracenter.backend.entity.Quiz;
import com.extracenter.backend.entity.QuizSubmission;
import com.extracenter.backend.repository.StudentScoreRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.repository.ScoreItemRepository;
import com.extracenter.backend.repository.AssignmentSubmissionRepository;
import com.extracenter.backend.repository.QuizSubmissionRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentScoreService {

    @Autowired
    private StudentScoreRepository studentScoreRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    public Optional<StudentScore> getScore(Long studentId, Long scoreItemId) {
        return studentScoreRepository.findByStudentIdAndScoreItemId(studentId, scoreItemId);
    }

    public List<StudentScore> getScoresByItem(Long scoreItemId) {
        return studentScoreRepository.findByScoreItemId(scoreItemId);
    }

    public List<StudentScore> getScoresByStudent(Long studentId) {
        return studentScoreRepository.findByStudentId(studentId);
    }

    /**
     * Update or create a student score (With Bi-Directional Synchronization)
     */
    @Transactional
    public StudentScore updateScore(StudentScoreRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        ScoreItem scoreItem = scoreItemRepository.findById(request.getScoreItemId())
                .orElseThrow(() -> new IllegalArgumentException("Score item not found"));

        // 1. Validate Gradebook score limits
        if (request.getScore() < 0 || request.getScore() > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100");
        }

        // 2. Update the Gradebook Ledger Row
        Optional<StudentScore> existing = studentScoreRepository.findByStudentIdAndScoreItemId(
                request.getStudentId(), request.getScoreItemId());

        StudentScore score;
        if (existing.isPresent()) {
            score = existing.get();
            score.setScore(request.getScore());
        } else {
            score = new StudentScore();
            score.setStudent(student);
            score.setScoreItem(scoreItem);
            score.setScore(request.getScore());
        }

        StudentScore savedScore = studentScoreRepository.save(score);

        // ------------------------------------------------------------------
        // 3. REVERSE-SYNC: Push updates back to original assignments/quizzes
        // ------------------------------------------------------------------

        // A. If this gradebook column belongs to an Assignment
        if (scoreItem.getAssignment() != null) {
            Assignment assignment = scoreItem.getAssignment();

            AssignmentSubmission submission = assignmentSubmissionRepository
                    .findByAssignmentIdAndStudentId(assignment.getId(), student.getId())
                    .orElse(new AssignmentSubmission());

            // If the teacher graded an assignment the student never formally submitted,
            // initialize it
            if (submission.getId() == null) {
                submission.setAssignment(assignment);
                submission.setStudent(student);
                submission.setSubmittedAt(LocalDateTime.now());
                submission.setStatus("SCORED");
            }

            // Map the exact gradebook percentage back to the assignment submission score
            submission.setScore(Float.valueOf(request.getScore()));
            assignmentSubmissionRepository.save(submission);
        }

        // B. If this gradebook column belongs to a Quiz
        if (scoreItem.getQuiz() != null) {
            Quiz quiz = scoreItem.getQuiz();
            int totalQuestions = quiz.getQuestions().isEmpty() ? 0 : quiz.getQuestions().size();

            // Convert Gradebook 100-point scale back to Quiz Raw Points (e.g., 80% of 5
            // questions = 4 points)
            int rawQuizScore = totalQuestions > 0
                    ? (int) Math.round((request.getScore() / 100.0) * totalQuestions)
                    : 0;

            List<QuizSubmission> submissions = quizSubmissionRepository.findByQuizIdAndStudentId(quiz.getId(),
                    student.getId());

            if (!submissions.isEmpty()) {
                // Find their highest existing attempt and update it so it matches the gradebook
                // overriding score
                QuizSubmission highestSub = submissions.stream()
                        .max(Comparator.comparing(QuizSubmission::getScore))
                        .orElse(submissions.get(0));

                highestSub.setScore(rawQuizScore);
                quizSubmissionRepository.save(highestSub);
            } else {
                // If a teacher gives a quiz grade but the student never took it, create a proxy
                // record
                QuizSubmission newSubmission = new QuizSubmission(
                        quiz,
                        student.getId(),
                        rawQuizScore,
                        totalQuestions,
                        LocalDateTime.now());
                quizSubmissionRepository.save(newSubmission);
            }
        }

        return savedScore;
    }

    /**
     * Bulk update student scores
     */
    @Transactional
    public List<StudentScore> bulkUpdateScores(List<StudentScoreRequest> requests) {
        return requests.stream()
                .map(this::updateScore)
                .collect(Collectors.toList());
    }

    public StudentScoreResponse toDTO(StudentScore studentScore) {
        return new StudentScoreResponse(
                studentScore.getId(),
                studentScore.getStudent().getId(),
                studentScore.getScoreItem().getId(),
                studentScore.getScore());
    }

    @Transactional
    public void clearScoresByScoreItemId(Long scoreItemId) {
        List<StudentScore> oldScores = studentScoreRepository.findByScoreItemId(scoreItemId);
        if (!oldScores.isEmpty()) {
            studentScoreRepository.deleteAll(oldScores);
            System.out.println(
                    "Cleaned up " + oldScores.size() + " ghost scores from abandoned ScoreItem ID: " + scoreItemId);
        }
    }
}