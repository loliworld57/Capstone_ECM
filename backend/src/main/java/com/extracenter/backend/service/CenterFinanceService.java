package com.extracenter.backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.FinanceRecordRequest;
import com.extracenter.backend.dto.FinanceReportResponse;
import com.extracenter.backend.entity.CenterFinanceRecord;
import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.TuitionPayment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.CenterFinanceRecordRepository;
import com.extracenter.backend.repository.CenterRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionPaymentRepository;
import com.extracenter.backend.repository.UserRepository;

@Service
public class CenterFinanceService {

    @Autowired
    private CenterFinanceRecordRepository centerFinanceRecordRepository;

    @Autowired
    private CenterRepository centerRepository;

    @Autowired
    private TuitionPaymentRepository tuitionPaymentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    // =========================
    // CRUD for CenterFinanceRecord
    // =========================

    @Transactional
    public CenterFinanceRecord createRecord(FinanceRecordRequest request) {
        Long centerId = resolveCenterIdForCurrentManager();

        validateAmount(request.getAmountVnd());

        CenterFinanceRecord record = new CenterFinanceRecord();
        record.setName(request.getName());
        record.setType(request.getType());
        record.setAmountVnd(request.getAmountVnd());
        record.setDescription(request.getDescription());
        record.setDate(request.getDate());
        record.setCenter(centerRepository.findById(centerId).orElseThrow(() -> new RuntimeException("Center not found")));

        User actor = userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> new RuntimeException("Actor user not found"));
        record.setCreatedBy(actor);

        return centerFinanceRecordRepository.save(record);
    }

    @Transactional
    public CenterFinanceRecord updateRecord(Long recordId, FinanceRecordRequest request) {
        CenterFinanceRecord existing = centerFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Center finance record not found: " + recordId));

        Long centerId = resolveCenterIdForCurrentManager();
        if (!existing.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("You do not have permission to update this record.");
        }

        // Keep simple ownership: actor must match existing.createdBy
        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(request.getActorUserId())) {
            throw new RuntimeException("You do not have permission to update this record.");
        }

        validateAmount(request.getAmountVnd());
        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());

        User actor = userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> new RuntimeException("Actor user not found"));
        existing.setCreatedBy(actor);

        return centerFinanceRecordRepository.save(existing);
    }

    @Transactional
    public void deleteRecord(Long recordId, Long actorUserId) {
        CenterFinanceRecord existing = centerFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Center finance record not found: " + recordId));

        Long centerId = resolveCenterIdForCurrentManager();
        if (!existing.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }

        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(actorUserId)) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }

        centerFinanceRecordRepository.delete(existing);
    }

    public List<CenterFinanceRecord> listRecordsForCenter(Long centerId, LocalDate start, LocalDate end) {
        return centerFinanceRecordRepository.findByCenterIdAndDateBetween(centerId, start, end);
    }

    // =========================
    // Reports
    // =========================

    public FinanceReportResponse monthlyReport(LocalDate anyDateInMonth, Long centerId) {
        LocalDate start = anyDateInMonth.withDayOfMonth(1);
        LocalDate end = anyDateInMonth.withDayOfMonth(anyDateInMonth.lengthOfMonth());

        return buildReport(centerId, start, end);
    }

    public FinanceReportResponse yearlyReport(int year, Long centerId) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        return buildReport(centerId, start, end);
    }

    private FinanceReportResponse buildReport(Long centerId, LocalDate start, LocalDate end) {
        // Center revenue includes:
        // - TuitionPayment (auto-included)
        // - CenterFinanceRecord INCOME
        long tuitionRevenueVnd = calculateTuitionRevenue(centerId, start, end);

        long incomeVnd = centerFinanceRecordRepository
                .findByCenterIdAndTypeAndDateBetween(centerId, FinanceType.INCOME, start, end)
                .stream()
                .filter(Objects::nonNull)
                .mapToLong(CenterFinanceRecord::getAmountVnd)
                .sum();

        long expenseVnd = centerFinanceRecordRepository
                .findByCenterIdAndTypeAndDateBetween(centerId, FinanceType.EXPENSE, start, end)
                .stream()
                .filter(Objects::nonNull)
                .mapToLong(CenterFinanceRecord::getAmountVnd)
                .sum();

        long revenueVnd = tuitionRevenueVnd + incomeVnd;
        long profitVnd = revenueVnd - expenseVnd;

        return new FinanceReportResponse(revenueVnd, expenseVnd, profitVnd, null);
    }

    private long calculateTuitionRevenue(Long centerId, LocalDate start, LocalDate end) {
        // Approach (no new accounting structures):
        // TuitionPayment is linked to Enrollment -> Course -> Center.
        // But current repository can only filter by enrollmentId.
        // So we approximate by getting enrollments in this center.

        // Fetch all students/enrollments for center via enrollmentRepository is available (findStudentsByCenterId exists),
        // but we need payments, not students.
        // For now, iterate enrollment payments by enrollment list via enrollmentRepository.findByStudentId isn't enough.
        // Therefore, use a simple fallback: sum TuitionPayment by enrollment/course association by querying all payments
        // and filtering in-memory.

        // WARNING: Could be slower with many records; can be optimized later by adding a repository query.
        List<TuitionPayment> allPayments = tuitionPaymentRepository.findAll();

        return allPayments.stream()
                .filter(Objects::nonNull)
                .filter(p -> p.getPaidAt() != null && !p.getPaidAt().isBefore(start) && !p.getPaidAt().isAfter(end))
                .filter(p -> p.getEnrollment() != null && p.getEnrollment().getCourse() != null
                        && p.getEnrollment().getCourse().getCenter() != null
                        && p.getEnrollment().getCourse().getCenter().getId().equals(centerId))
                .mapToLong(TuitionPayment::getAmountVnd)
                .sum();
    }

    private void validateAmount(Long amountVnd) {
        if (amountVnd == null || amountVnd <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }
    }

    // Resolve current manager's owned center.
    private Long resolveCenterIdForCurrentManager() {
        User currentUser = getCurrentUser();

        // CenterRepository provides list-based lookup.
        // For financial tracking, we assume managers operate on a single active center.
        // If multiple centers exist, report/profit endpoints should receive centerId explicitly.
        List<com.extracenter.backend.entity.Center> centers = centerRepository.findByManagerIdAndArchivedAtIsNull(currentUser.getId());
        if (centers == null || centers.isEmpty()) {
            throw new RuntimeException("Center not found for current manager");
        }
        return centers.get(0).getId();
    }


    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}

