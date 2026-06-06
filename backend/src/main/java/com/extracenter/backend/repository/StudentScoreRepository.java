package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.StudentScore;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.StudentScore;

@Repository
public interface StudentScoreRepository extends JpaRepository<StudentScore, Long> {
    Optional<StudentScore> findByStudentIdAndScoreItemId(Long studentId, Long scoreItemId);

    List<StudentScore> findByScoreItemId(Long scoreItemId);

    List<StudentScore> findByStudentId(Long studentId);

    List<StudentScore> findByScoreItemIdIn(List<Long> scoreItemIds);
}
