package com.extracenter.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.extracenter.backend.entity.TuitionAccount;

@Repository
public interface TuitionAccountRepository extends JpaRepository<TuitionAccount, Long> {

    Optional<TuitionAccount> findByEnrollmentId(Long enrollmentId);
}
