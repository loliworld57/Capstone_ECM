package com.extracenter.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Material")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName; // e.g., "Unit_1_Grammar.pdf"

    @Column(nullable = false)
    private String fileUrl; // The Cloudinary/S3 link

    private String fileType; // e.g., "PDF", "DOCX", "IMAGE", "VIDEO"

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "uploaded_date", updatable = false)
    private LocalDateTime uploadedDate = LocalDateTime.now();

    // RELATIONSHIP 1: Which course does this material belong to? (Always Required)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // RELATIONSHIP 2: Which specific lesson day does this belong to? (Optional)
    // - If uploaded via ClassSession UI -> auto-connects to the session.
    // - If uploaded via Course General UI -> remains null (e.g., Syllabus).
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_session_id")
    private ClassSession classSession;
}