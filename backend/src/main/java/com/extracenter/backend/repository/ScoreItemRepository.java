package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.extracenter.backend.entity.ScoreItem;

@Repository
public interface ScoreItemRepository extends JpaRepository<ScoreItem, Long> {
    List<ScoreItem> findByScoreCategoryId(Long scoreCategoryId);

    List<ScoreItem> findByAssignmentId(Long assignmentId);

    Optional<ScoreItem> findByIdAndScoreCategoryId(Long id, Long scoreCategoryId);
}
