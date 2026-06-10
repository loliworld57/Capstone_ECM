package com.extracenter.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "Quiz")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    // Link back to the course this quiz belongs to
    @Column(name = "course_id")
    private Long courseId;

    // Nullable, because they might drag-and-drop a new file instead of using
    // existing material
    @Column(name = "material_id", nullable = true)
    private Long materialId;

    // Quiz Settings
    private Integer maxAttempts; // 0 = unlimited, 1 = strict, 3 = three tries
    private Boolean isGraded; // Does this count towards the final grade?
    private LocalDateTime dueDate;

    // One Quiz has many Questions.
    // CascadeType.ALL means if we delete the quiz, it deletes the questions too!
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<QuizQuestion> questions;

}