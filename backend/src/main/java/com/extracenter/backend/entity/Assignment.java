package com.extracenter.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Assignment")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Hạn chót nộp bài
    @Column(nullable = false)
    private LocalDateTime dueDate;

    // Link file đề bài (PDF, DOCX) - Có thể null nếu giáo viên chỉ gõ Text vào
    // Description
    private String fileUrl;
    private String fileName;

    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    // RELATIONSHIP 1: Bài tập này thuộc về Khóa học nào?
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnore
    private Course course;

    // RELATIONSHIP 2: Có thể gắn vào một buổi học cụ thể (Tùy chọn)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_session_id")
    @JsonIgnore
    private ClassSession classSession;

    // RELATIONSHIP 3: Danh sách các bài nộp của học sinh
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AssignmentSubmission> submissions;

    @Column(name = "score_item_id", nullable = true)
    private Long scoreItemId;
}