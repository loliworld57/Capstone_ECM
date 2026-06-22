package com.extracenter.backend.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<QuizQuestion> questions;

    @Column(name = "score_item_id", nullable = true)
    private Long scoreItemId;

    private Integer durationInMinutes;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.durationInMinutes == null || this.durationInMinutes <= 0) {
            this.durationInMinutes = 30;
        }
    }

}