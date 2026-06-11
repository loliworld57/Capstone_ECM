package com.extracenter.backend.service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.AttendanceRequest;
import com.extracenter.backend.dto.AttendanceSheetResponse;
import com.extracenter.backend.dto.StudentAttendanceRecordDTO;
import com.extracenter.backend.entity.Attendance;
import com.extracenter.backend.entity.AttendanceStatus;
import com.extracenter.backend.entity.ClassSession;
import com.extracenter.backend.entity.ClassSlot;
import com.extracenter.backend.entity.Enrollment;
import com.extracenter.backend.repository.AttendanceRepository;
import com.extracenter.backend.repository.ClassSessionRepository;
import com.extracenter.backend.repository.ClassSlotRepository;
import com.extracenter.backend.repository.EnrollmentRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ClassSessionRepository classSessionRepository;

    @Autowired
    private ClassSlotRepository classSlotRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    // @Transactional is crucial here: If one student fails to save,
    // the whole process rolls back so we don't end up with partial attendance data.
    @Transactional
    public String markAttendance(AttendanceRequest request) {

        // 1. Fetch the specific Class Session (Replaced ClassSlot + Date)
        ClassSession session = classSessionRepository.findById(request.getClassSessionId())
                .orElseThrow(() -> new RuntimeException("Error: Class session not found!"));

        // 2. Fetch existing attendance records for this specific lesson (if the teacher
        // is editing)
        List<Attendance> existingRecords = attendanceRepository.findByClassSessionId(request.getClassSessionId());
        ClassSlot attendanceSlot = resolveRequiredSlotForSession(session);

        // OPTIMIZATION: Instead of saving one by one inside the loop, we collect them
        // all here
        // and save them to the database in one single batch at the end.
        List<Attendance> recordsToSave = new ArrayList<>();

        Long courseId = session.getCourse().getId();

        for (AttendanceRequest.StudentStatus status : request.getStudentStatuses()) {
            Attendance attendance = null;

            // 3. Check if this student already has an attendance record for this session
            for (Attendance record : existingRecords) {
                if (record.getEnrollment().getStudent().getId().equals(status.getStudentId())) {
                    attendance = record; // Record found -> We will update it
                    break;
                }
            }

            // 4. If no record exists -> Create a new one
            if (attendance == null) {
                attendance = new Attendance();
                attendance.setClassSession(session);

                // Find the student's Enrollment record for this course
                Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(status.getStudentId(), courseId)
                        .orElseThrow(() -> new RuntimeException(
                                "Error: Student ID " + status.getStudentId() + " is not enrolled in this course!"));

                attendance.setEnrollment(enrollment);
            }

            // 5. Update the status and notes
            attendance.setDate(session.getDate());
            attendance.setClassSlot(attendanceSlot);
            attendance.setStatus(status.getStatus());
            attendance.setNote(status.getNote());

            // Add to our batch list instead of saving immediately
            recordsToSave.add(attendance);
        }

        // 6. Batch Save: This runs 1 big database query instead of 30 small ones!
        attendanceRepository.saveAll(recordsToSave);

        return "Attendance saved successfully!";
    }

    // Fetch the attendance data to display on the Frontend UI
    public List<Attendance> getAttendanceList(Long classSessionId) {
        return attendanceRepository.findByClassSessionId(classSessionId);
    }

    public AttendanceSheetResponse getAttendanceSheet(Long classSessionId) {
        ClassSession session = classSessionRepository.findById(classSessionId)
                .orElseThrow(() -> new RuntimeException("Error: Class session not found!"));

        Long courseId = session.getCourse().getId();
        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdAndArchivedAtIsNull(courseId);

        Map<Long, Attendance> existingByStudentId = attendanceRepository.findByClassSessionId(classSessionId)
                .stream()
                .filter(att -> att.getEnrollment() != null && att.getEnrollment().getStudent() != null)
                .collect(Collectors.toMap(
                        att -> att.getEnrollment().getStudent().getId(),
                        att -> att,
                        (a, b) -> b));

        List<AttendanceSheetResponse.StudentAttendanceRow> students = enrollments.stream()
                .filter(enrollment -> enrollment.getStudent() != null)
                .map(enrollment -> {
                    Long studentId = enrollment.getStudent().getId();
                    Attendance existing = existingByStudentId.get(studentId);

                    AttendanceStatus status = AttendanceStatus.ABSENT;
                    String note = null;

                    if (existing != null) {
                        status = existing.getStatus() != null
                                ? existing.getStatus()
                                : (Boolean.TRUE.equals(existing.getIsPresent())
                                        ? AttendanceStatus.ATTEND
                                        : AttendanceStatus.ABSENT);
                        note = existing.getNote();
                    }

                    return AttendanceSheetResponse.StudentAttendanceRow.builder()
                            .studentId(studentId)
                            .firstName(enrollment.getStudent().getFirstName())
                            .lastName(enrollment.getStudent().getLastName())
                            .email(enrollment.getStudent().getEmail())
                            .status(status)
                            .note(note)
                            .build();
                })
                .collect(Collectors.toList());

        return AttendanceSheetResponse.builder()
                .classSessionId(session.getId())
                .courseId(courseId)
                .date(session.getDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .students(students)
                .build();
    }

    private ClassSlot resolveRequiredSlotForSession(ClassSession session) {
        Long courseId = session.getCourse().getId();
        DayOfWeek sessionDay = session.getDate().getDayOfWeek();

        List<ClassSlot> courseSlots = classSlotRepository.findByCourseId(courseId);
        for (ClassSlot slot : courseSlots) {
            boolean inDateRange = !session.getDate().isBefore(slot.getStartDate())
                    && !session.getDate().isAfter(slot.getEndDate());
            boolean dayMatches = (slot.getDaysOfWeek() != null && slot.getDaysOfWeek().contains(sessionDay))
                    || sessionDay.equals(slot.getDayOfWeek());
            boolean timeMatches = slot.getStartTime() != null
                    && slot.getEndTime() != null
                    && slot.getStartTime().equals(session.getStartTime())
                    && slot.getEndTime().equals(session.getEndTime());
            boolean excluded = slot.getExcludedDates() != null && slot.getExcludedDates().contains(session.getDate());

            if (inDateRange && dayMatches && timeMatches && !excluded) {
                return slot;
            }
        }

        throw new RuntimeException(
                "No valid class slot found for this session. Please edit the session to match an existing class slot.");
    }

    public List<StudentAttendanceRecordDTO> getStudentAttendanceLog(Long courseId, Long studentId) {
        List<ClassSession> sessions = classSessionRepository.findByCourseId(courseId);
        List<ClassSlot> courseSlots = classSlotRepository.findByCourseId(courseId);

        // Explicitly defining the map parameter type (ClassSession session) removes
        // lambda ambiguity
        return sessions.stream().map((ClassSession session) -> {

            Optional<Attendance> attendanceOpt = attendanceRepository
                    .findByClassSessionIdAndEnrollmentStudentId(session.getId(), studentId);

            String activeStatus = "NOT_TAKEN";

            if (attendanceOpt != null && attendanceOpt.isPresent()) {
                Attendance att = attendanceOpt.get();
                if (att.getStatus() != null) {
                    activeStatus = att.getStatus().toString(); // Safely converts String or Enum types
                }
            }

            java.time.DayOfWeek sessionDay = session.getDate().getDayOfWeek();
            String resolvedLocation = "Online / Unassigned";

            for (ClassSlot slot : courseSlots) {
                if (slot.getDaysOfWeek() != null && slot.getDaysOfWeek().contains(sessionDay) &&
                        slot.getStartTime().equals(session.getStartTime()) &&
                        slot.getEndTime().equals(session.getEndTime())) {

                    if (slot.getClassroom() != null) {
                        resolvedLocation = slot.getClassroom().getLocation();
                        break;
                    }
                }
            }

            return new StudentAttendanceRecordDTO(
                    session.getId(),
                    session.getDate(),
                    session.getStartTime(),
                    session.getEndTime(),
                    resolvedLocation,
                    activeStatus);
        }).collect(Collectors.toList());
    }
}
