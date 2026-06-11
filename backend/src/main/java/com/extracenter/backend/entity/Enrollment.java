package com.extracenter.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "Enrollment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // RELATIONSHIP: Which student is enrolled?
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // RELATIONSHIP: Which course are they enrolled in?
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // RELATIONSHIP: Does the student have a scholarship for this specific course?
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scholarship_id")
    private Scholarship scholarship;

    // Automatically set the enrollment date to the day the record is created
    private LocalDate enrollmentDate = LocalDate.now();

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    // --- GRADES / SCORES ---
    private Float progressScore; // E.g., Mid-term or continuous assessment score
    private Float testScore; // E.g., Standard test score
    private Float finalScore; // E.g., End of course final score

    // Overall performance grade: 'A', 'B', 'C', 'F'
    @Column(length = 1)
    private String performance;
}
