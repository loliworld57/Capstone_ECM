package com.extracenter.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.extracenter.backend.entity.Classroom;


public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByCenterId(Long centerId);

    Optional<Classroom> findByIdAndCenterId(Long classroomId, Long centerId);
}
