package com.extracenter.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.StudentScoreRequest;
import com.extracenter.backend.dto.StudentScoreResponse;
import com.extracenter.backend.entity.StudentScore;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.repository.StudentScoreRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.repository.ScoreItemRepository;

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

    /**
     * Get score for a student and score item
     */
    public Optional<StudentScore> getScore(Long studentId, Long scoreItemId) {
        return studentScoreRepository.findByStudentIdAndScoreItemId(studentId, scoreItemId);
    }

    /**
     * Get all scores for a score item
     */
    public List<StudentScore> getScoresByItem(Long scoreItemId) {
        return studentScoreRepository.findByScoreItemId(scoreItemId);
    }

    /**
     * Get all scores for a student
     */
    public List<StudentScore> getScoresByStudent(Long studentId) {
        return studentScoreRepository.findByStudentId(studentId);
    }

    /**
     * Update or create a student score
     */
    @Transactional
    public StudentScore updateScore(StudentScoreRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        ScoreItem scoreItem = scoreItemRepository.findById(request.getScoreItemId())
                .orElseThrow(() -> new IllegalArgumentException("Score item not found"));

        // Validate score
        if (request.getScore() < 0 || request.getScore() > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100");
        }

        // Check if score exists
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

        return studentScoreRepository.save(score);
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

    /**
     * Convert entity to DTO
     */
    public StudentScoreResponse toDTO(StudentScore studentScore) {
        return new StudentScoreResponse(
                studentScore.getId(),
                studentScore.getStudent().getId(),
                studentScore.getScoreItem().getId(),
                studentScore.getScore());
    }
}
