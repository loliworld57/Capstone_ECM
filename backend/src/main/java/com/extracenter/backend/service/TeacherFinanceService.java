package com.extracenter.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.FinanceRecordRequest;
import com.extracenter.backend.dto.FinanceReportResponse;
import com.extracenter.backend.entity.FinanceType;
import com.extracenter.backend.entity.TeacherFinanceRecord;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.TeacherFinanceRecordRepository;
import com.extracenter.backend.repository.UserRepository;

@Service
public class TeacherFinanceService {

    @Autowired
    private TeacherFinanceRecordRepository teacherFinanceRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TeacherFinanceRecord createRecord(FinanceRecordRequest request) {
        User actor = userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> new RuntimeException("Actor user not found"));

        // Teacher personal finance: only create for yourself
        Long currentTeacherId = resolveCurrentUserId();
        if (!actor.getId().equals(currentTeacherId)) {
            throw new RuntimeException("You can only create records for yourself.");
        }

        validateAmount(request.getAmountVnd());

        TeacherFinanceRecord record = new TeacherFinanceRecord();
        record.setName(request.getName());
        record.setType(request.getType());
        record.setAmountVnd(request.getAmountVnd());
        record.setDescription(request.getDescription());
        record.setDate(request.getDate());
        record.setTeacher(actor);
        record.setCreatedAt(LocalDateTime.now());

        return teacherFinanceRecordRepository.save(record);
    }

    @Transactional
    public TeacherFinanceRecord updateRecord(Long recordId, FinanceRecordRequest request) {
        TeacherFinanceRecord existing = teacherFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Teacher finance record not found: " + recordId));

        Long currentTeacherId = resolveCurrentUserId();
        if (existing.getTeacher() == null || !existing.getTeacher().getId().equals(currentTeacherId)) {
            throw new RuntimeException("You can only update your own records.");
        }

        // keep actorUserId consistent with current teacher
        if (request.getActorUserId() == null || !request.getActorUserId().equals(currentTeacherId)) {
            throw new RuntimeException("actorUserId must match current teacher.");
        }

        validateAmount(request.getAmountVnd());

        existing.setName(request.getName());
        existing.setType(request.getType());
        existing.setAmountVnd(request.getAmountVnd());
        existing.setDescription(request.getDescription());
        existing.setDate(request.getDate());

        // createdAt is immutable; keep it
        return teacherFinanceRecordRepository.save(existing);
    }

    @Transactional
    public void deleteRecord(Long recordId, Long actorUserId) {
        TeacherFinanceRecord existing = teacherFinanceRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Teacher finance record not found: " + recordId));

        Long currentTeacherId = resolveCurrentUserId();
        if (existing.getTeacher() == null || !existing.getTeacher().getId().equals(currentTeacherId)) {
            throw new RuntimeException("You can only delete your own records.");
        }

        if (actorUserId == null || !actorUserId.equals(currentTeacherId)) {
            throw new RuntimeException("actorUserId must match current teacher.");
        }

        teacherFinanceRecordRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public List<TeacherFinanceRecord> listRecords(LocalDate start, LocalDate end) {
        Long currentTeacherId = resolveCurrentUserId();
        return teacherFinanceRecordRepository.findByTeacherIdAndDateBetween(currentTeacherId, start, end);
    }

    public FinanceReportResponse monthlyReport(LocalDate anyDateInMonth) {
        LocalDate start = anyDateInMonth.withDayOfMonth(1);
        LocalDate end = anyDateInMonth.withDayOfMonth(anyDateInMonth.lengthOfMonth());
        return buildReport(start, end);
    }

    public FinanceReportResponse yearlyReport(int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        return buildReport(start, end);
    }

    private FinanceReportResponse buildReport(LocalDate start, LocalDate end) {
        Long currentTeacherId = resolveCurrentUserId();

        List<TeacherFinanceRecord> incomes =
                teacherFinanceRecordRepository.findByTeacherIdAndTypeAndDateBetween(currentTeacherId, FinanceType.INCOME, start, end);

        List<TeacherFinanceRecord> expenses =
                teacherFinanceRecordRepository.findByTeacherIdAndTypeAndDateBetween(currentTeacherId, FinanceType.EXPENSE, start, end);

        long totalIncomeVnd = (incomes == null ? 0 : incomes.stream().mapToLong(TeacherFinanceRecord::getAmountVnd).sum());
        long totalExpenseVnd = (expenses == null ? 0 : expenses.stream().mapToLong(TeacherFinanceRecord::getAmountVnd).sum());
        long profitVnd = totalIncomeVnd - totalExpenseVnd;

        return new FinanceReportResponse(totalIncomeVnd, totalExpenseVnd, profitVnd, null);
    }

    private void validateAmount(Long amountVnd) {
        if (amountVnd == null || amountVnd <= 0) {
            throw new RuntimeException("amountVnd must be > 0");
        }
    }

    private Long resolveCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }
}
