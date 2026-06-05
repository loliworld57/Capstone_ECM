package com.extracenter.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.extracenter.backend.entity.ScoreCategory;

@Repository
public interface ScoreCategoryRepository extends JpaRepository<ScoreCategory, Long> {
    List<ScoreCategory> findByCourseId(Long courseId);

    ScoreCategory findByIdAndCourseId(Long id, Long courseId);
}
