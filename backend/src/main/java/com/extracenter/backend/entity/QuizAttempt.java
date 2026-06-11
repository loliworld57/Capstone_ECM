package com.extracenter.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "QuizAttempt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Column(name = "student_id")
    private Long studentId;

    private Integer attemptNumber;
    private Integer score;
    private Integer totalQuestions;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}