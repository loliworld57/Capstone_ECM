package com.extracenter.backend.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "ScoreItem")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // RELATIONSHIP: Which score category does this item belong to?
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "score_category_id", nullable = false)
    // FIX: Prevents Jackson from choking on the ByteBuddy proxy when serializing
    // this relationship
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private ScoreCategory scoreCategory;

    // RELATIONSHIP: Optional link to an Assignment
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Assignment assignment;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id") // <-- ADD THIS RELATIONSHIP FIELD
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Quiz quiz;

    // RELATIONSHIP: Student scores for this item
    // Deleting a ScoreItem deletes all related StudentScores
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "scoreItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StudentScore> studentScores;
}