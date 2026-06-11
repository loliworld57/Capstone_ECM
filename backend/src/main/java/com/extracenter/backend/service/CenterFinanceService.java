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
import com.extracenter.backend.dto.StudentTuitionResponse.InstallmentItem;
import com.extracenter.backend.dto.TuitionDashboardResponse;
import com.extracenter.backend.entity.CenterFinanceRecord;
import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.InstallmentStatus;
import com.extracenter.backend.entity.TuitionInstallment;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.CenterFinanceRecordRepository;
import com.extracenter.backend.repository.CenterRepository;
import com.extracenter.backend.repository.EnrollmentRepository;
import com.extracenter.backend.repository.TuitionInstallmentRepository;
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
    private TuitionInstallmentRepository tuitionInstallmentRepository;

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

        User currentUser = getCurrentUser();
        record.setCreatedBy(currentUser);



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

        // Ownership: update/delete only allowed for the original creator (createdBy immutable)
        User currentUser = getCurrentUser();
        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You do not have permission to update this record.");
        }



        validateAmount(request.getAmountVnd());
        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());

        // Do NOT overwrite createdBy on update.
        return centerFinanceRecordRepository.save(existing);

    }

    @Transactional
    public void deleteRecord(Long recordId) {

        CenterFinanceRecord existing = centerFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Center finance record not found: " + recordId));

        Long centerId = resolveCenterIdForCurrentManager();
        if (!existing.getCenter().getId().equals(centerId)) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }

        User currentUser = getCurrentUser();
        if (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }


        centerFinanceRecordRepository.delete(existing);
    }

    public List<CenterFinanceRecord> listRecordsForCenter(Long centerId, LocalDate start, LocalDate end) {
        Long resolvedCenterId = centerId;
        if (resolvedCenterId == null) {
            resolvedCenterId = resolveCenterIdForCurrentManager();
        }
        return centerFinanceRecordRepository.findByCenterIdAndDateBetween(resolvedCenterId, start, end);
    }


    // =========================
    // Reports
    // =========================

    public FinanceReportResponse monthlyReport(LocalDate anyDateInMonth, Long centerId) {
        assertCenterAccess(centerId);
        LocalDate start = anyDateInMonth.withDayOfMonth(1);
        LocalDate end = anyDateInMonth.withDayOfMonth(anyDateInMonth.lengthOfMonth());

        return buildReport(centerId, start, end);
    }

    public FinanceReportResponse yearlyReport(int year, Long centerId) {
        assertCenterAccess(centerId);
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        return buildReport(centerId, start, end);
    }

    public TuitionDashboardResponse dashboard(LocalDate anyDateInMonth, Long centerId) {
        assertCenterAccess(centerId);
        LocalDate start = anyDateInMonth.withDayOfMonth(1);
        LocalDate end = anyDateInMonth.withDayOfMonth(anyDateInMonth.lengthOfMonth());
        FinanceReportResponse report = buildReport(centerId, start, end);
        Long outstandingDebt = tuitionInstallmentRepository.sumOutstandingByCenterIdAndStatuses(
                centerId,
                List.of(InstallmentStatus.PENDING, InstallmentStatus.PARTIAL, InstallmentStatus.OVERDUE));
        List<TuitionInstallment> overdue = tuitionInstallmentRepository.findOverdueByCenterId(centerId, LocalDate.now());

        return TuitionDashboardResponse.builder()
                .monthlyRevenueVnd(report.getTotalIncomeVnd())
                .monthlyExpenseVnd(report.getTotalExpenseVnd())
                .estimatedProfitVnd(report.getProfitVnd())
                .outstandingDebtVnd(outstandingDebt != null ? outstandingDebt : 0L)
                .overduePaymentCount(overdue.size())
                .overduePayments(overdue.stream().map(this::mapOverdueInstallment).toList())
                .build();
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

        // Use repository-level aggregation to avoid loading all TuitionPayments into memory.
        Long tuitionRevenue = tuitionPaymentRepository.sumTuitionRevenueByCenterIdAndPaidAtBetween(
                centerId,
                start,
                end);
        return tuitionRevenue != null ? tuitionRevenue : 0L;

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

    private void assertCenterAccess(Long centerId) {
        User currentUser = getCurrentUser();
        String roleName = currentUser.getRole() != null ? currentUser.getRole().getName() : "";
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            return;
        }
        boolean ownsCenter = centerRepository.findByManagerIdAndArchivedAtIsNull(currentUser.getId())
                .stream()
                .anyMatch(center -> center.getId().equals(centerId));
        if (!ownsCenter) {
            throw new RuntimeException("You do not have permission to view this center finance.");
        }
    }

    private InstallmentItem mapOverdueInstallment(TuitionInstallment installment) {
        var enrollment = installment.getTuitionAccount().getEnrollment();
        var student = enrollment.getStudent();
        long amountDue = installment.getAmountDueVnd() != null ? installment.getAmountDueVnd() : 0L;
        long amountPaid = installment.getAmountPaidVnd() != null ? installment.getAmountPaidVnd() : 0L;
        return InstallmentItem.builder()
                .id(installment.getId())
                .enrollmentId(enrollment.getId())
                .studentName(student.getLastName() + " " + student.getFirstName())
                .courseName(enrollment.getCourse().getName())
                .installmentNumber(installment.getInstallmentNumber())
                .dueDate(installment.getDueDate())
                .amountDueVnd(amountDue)
                .amountPaidVnd(amountPaid)
                .remainingVnd(Math.max(0L, amountDue - amountPaid))
                .status(installment.getStatus())
                .build();
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

