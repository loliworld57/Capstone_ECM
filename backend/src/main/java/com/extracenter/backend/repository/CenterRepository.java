package com.extracenter.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.entity.Center;

@Repository
public interface CenterRepository extends JpaRepository<Center, Long> {

    // Find all centers managed by a specific user
    List<Center> findByArchivedAtIsNull();

    List<Center> findByManagerIdAndArchivedAtIsNull(Long managerId);

    List<Center> findByManagerIdAndArchivedAtIsNotNullOrderByArchivedAtDesc(Long managerId);

    // Find centers where a teacher is teaching courses,
    // EXCLUDING the centers that they already manage.
    @Query("SELECT DISTINCT c.center FROM Course c WHERE c.teacher.id = :teacherId AND c.center.manager.id != :teacherId AND c.center.archivedAt IS NULL")
    List<Center> findCentersTeachingByTeacherId(@Param("teacherId") Long teacherId);

        // Find centers that are linked to a teacher account (via connectedCenters),
        // excluding centers they manage themselves.
        @Query("SELECT DISTINCT c FROM User u JOIN u.connectedCenters c WHERE u.id = :teacherId AND c.manager.id != :teacherId AND c.archivedAt IS NULL")
        List<Center> findLinkedCentersByTeacherId(@Param("teacherId") Long teacherId);

        // Pending center invites: linked centers where teacher still has no assigned
        // course.
        @Query("SELECT DISTINCT c FROM User u JOIN u.connectedCenters c " +
            "WHERE u.id = :teacherId AND c.manager.id != :teacherId " +
            "AND c.archivedAt IS NULL " +
            "AND NOT EXISTS (SELECT cr.id FROM Course cr WHERE cr.center.id = c.id AND cr.teacher.id = :teacherId)")
        List<Center> findPendingInvitedCentersByTeacherId(@Param("teacherId") Long teacherId);

    // Bulk delete all student connections to a specific center in the join table.
    // Useful when deleting a Center to prevent foreign key constraint violations.
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM student_centers WHERE center_id = :centerId", nativeQuery = true)
    void removeAllStudentLinks(@Param("centerId") Long centerId);
}