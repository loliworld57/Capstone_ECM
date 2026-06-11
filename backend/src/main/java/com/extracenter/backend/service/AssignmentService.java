package com.extracenter.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.extracenter.backend.dto.AssignmentSubmissionResponse;
import com.extracenter.backend.dto.ScoreCategoryRequest;
import com.extracenter.backend.dto.ScoreRequest;
import com.extracenter.backend.dto.StudentAssignmentDTO;
import com.extracenter.backend.dto.StudentAssignmentResponse;
import com.extracenter.backend.dto.StudentScoreRequest;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.entity.AssignmentSubmission;
import com.extracenter.backend.entity.ClassSession;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.AssignmentRepository;
import com.extracenter.backend.repository.AssignmentSubmissionRepository;
import com.extracenter.backend.repository.ClassSessionRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.ScoreItemRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.entity.AssignmentSubmission;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private ClassSessionRepository classSessionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CloudinaryService cloudinaryService;
    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;
    @Autowired
    private ScoreCategoryService scoreCategoryService;
    @Autowired
    private ScoreItemService scoreItemService;

    @Autowired
    private StudentScoreService studentScoreService;

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    // 1. TẠO BÀI TẬP (GIÁO VIÊN)
    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime dueDate,
            Long courseId, Long classSessionId, Long scoreItemId, MultipartFile file) throws IOException { // <-- ADD
                                                                                                           // PARAMETER
                                                                                                           // HERE

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Assignment assignment = new Assignment();
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDueDate(dueDate);
        assignment.setCourse(course);
        assignment.setScoreItemId(scoreItemId);
        assignment.setClassSession(
                classSessionId != null ? classSessionRepository.findById(classSessionId).orElse(null) : null);

        if (file != null && !file.isEmpty()) {
            assignment.setFileUrl(cloudinaryService.uploadFile(file));
            assignment.setFileName(file.getOriginalFilename());
        }

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Link the custom assignment score item row chosen from your teacher dropdown
        // panel layout
        if (scoreItemId != null) {
            scoreItemRepository.findById(scoreItemId).ifPresent(item -> {
                item.setAssignment(savedAssignment);
                scoreItemRepository.save(item);
            });
        }

        return savedAssignment;
    }

    public List<Assignment> getAssignmentsForCourse(Long courseId) {
        return assignmentRepository.findByCourseIdOrderByDueDateAsc(courseId);
    }

    public Assignment getAssignmentById(Long assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));
    }

    public List<StudentAssignmentResponse> getAssignmentsForStudent(Long courseId, Long studentId) {
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        return assignments.stream()
                .map(assignment -> {
                    AssignmentSubmission submission = submissionRepository
                            .findByAssignmentIdAndStudentId(
                                    assignment.getId(),
                                    studentId)
                            .orElse(null);
                    return StudentAssignmentResponse.builder()
                            .id(assignment.getId())
                            .title(assignment.getTitle())
                            .description(assignment.getDescription())
                            .dueDate(assignment.getDueDate())
                            .fileUrl(assignment.getFileUrl())
                            .fileName(assignment.getFileName())
                            .createdDate(assignment.getCreatedDate())

                            .submissionStatus(
                                    submission != null
                                            ? submission.getStatus()
                                            : "NOT_SUBMITTED")

                            .submittedAt(
                                    submission != null
                                            ? submission.getSubmittedAt()
                                            : null)
                            .build();
                })
                .toList();
    }

    // --- HÀM MỚI: CẬP NHẬT BÀI TẬP ---
    @Transactional
    public Assignment updateAssignment(Long id, String title, String description, LocalDateTime dueDate,
            Long scoreItemId,
            MultipartFile file) throws IOException {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDueDate(dueDate);
        assignment.setScoreItemId(scoreItemId);

        // Nếu giáo viên tải lên file mới, chúng ta sẽ upload và ghi đè file URL cũ
        if (file != null && !file.isEmpty()) {
            String fileUrl = cloudinaryService.uploadFile(file);
            assignment.setFileUrl(fileUrl);
            assignment.setFileName(file.getOriginalFilename());
        }
        Assignment savedAssignment = assignmentRepository.save(assignment);

        // 2. CRITICAL FIX: Manage the Gradebook Column Link!
        // First, clear out any old associations in case the teacher changed the
        // dropdown selection
        List<com.extracenter.backend.entity.ScoreItem> oldItems = scoreItemRepository
                .findByAssignmentId(savedAssignment.getId());
        for (com.extracenter.backend.entity.ScoreItem oldItem : oldItems) {
            if (scoreItemId == null || !oldItem.getId().equals(scoreItemId)) {
                oldItem.setAssignment(null);
                scoreItemRepository.save(oldItem);

                studentScoreService.clearScoresByScoreItemId(oldItem.getId());
            }
        }

        // 3. Establish the new association link
        if (scoreItemId != null) {
            scoreItemRepository.findById(scoreItemId).ifPresent(item -> {
                item.setAssignment(savedAssignment);
                scoreItemRepository.save(item);
            });
        }

        if (scoreItemId != null) {
            Optional<com.extracenter.backend.entity.ScoreItem> itemOpt = scoreItemRepository.findById(scoreItemId);

            if (itemOpt.isPresent()) {
                com.extracenter.backend.entity.ScoreItem item = itemOpt.get();
                item.setAssignment(savedAssignment);
                scoreItemRepository.saveAndFlush(item);
                System.out.println("✅ SUCCESS: Linked ScoreItem " + scoreItemId + " to Assignment");

                // 🔴 ADD THIS NEW BLOCK: RETROACTIVE SYNC
                System.out.println("🔄 Retroactively syncing past assignment submissions...");
                List<AssignmentSubmission> pastSubmissions = submissionRepository
                        .findByAssignmentId(savedAssignment.getId());

                for (AssignmentSubmission sub : pastSubmissions) {
                    if (sub.getScore() != null && sub.getStudent() != null) {
                        StudentScoreRequest syncReq = new StudentScoreRequest(
                                sub.getStudent().getId(),
                                scoreItemId,
                                Math.round(sub.getScore().floatValue()));
                        // Pushes the past score into the gradebook!
                        studentScoreService.updateScore(syncReq);
                    }
                }
            }
        }

        return savedAssignment;
    }

    // --- HÀM MỚI: XÓA BÀI TẬP ---
    @Transactional
    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        // Ensure related score items + student scores are deleted too.
        // Otherwise FK constraints may prevent deletion when an assignment has a
        // ScoreItem.
        List<com.extracenter.backend.entity.ScoreItem> scoreItems = scoreItemRepository.findByAssignmentId(id);
        for (com.extracenter.backend.entity.ScoreItem si : scoreItems) {
            // ScoreItem has CascadeType.ALL to StudentScore (orphanRemoval=true)
            // so deleting the ScoreItem should delete its studentScores.
            scoreItemRepository.delete(si);
        }

        // Delete assignment submissions
        if (assignment.getSubmissions() != null) {
            assignment.getSubmissions().clear();
        }

        assignmentRepository.delete(assignment);

    }

    // 2. NỘP BÀI (HỌC SINH)
    @Transactional
    public AssignmentSubmission submitAssignment(Long assignmentId, Long studentId, MultipartFile file)
            throws IOException {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        // Kiểm tra xem học sinh đã nộp bài này chưa
        AssignmentSubmission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(new AssignmentSubmission()); // Nếu chưa nộp thì tạo mới, nếu nộp rồi thì ghi đè lại

        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());

        // Xác định nộp trễ hay đúng hạn
        if (submission.getSubmittedAt().isAfter(assignment.getDueDate())) {
            submission.setStatus("LATE");
        } else {
            submission.setStatus("SUBMITTED");
        }

        // Upload file bài làm lên Cloudinary
        String fileUrl = cloudinaryService.uploadFile(file);
        submission.setFileUrl(fileUrl);
        submission.setFileName(file.getOriginalFilename());

        return submissionRepository.save(submission);
    }

    @Transactional
    public AssignmentSubmission gradeSubmission(Long submissionId, ScoreRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found!"));

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setStatus("SCORED");

        Assignment assignment = submission.getAssignment();
        User student = submission.getStudent();

        // Look up the items explicitly linked to this assignment id
        List<ScoreItem> itemsForAssignment = scoreItemRepository.findByAssignmentId(assignment.getId());

        if (!itemsForAssignment.isEmpty()) {
            for (ScoreItem scoreItem : itemsForAssignment) {
                StudentScoreRequest scoreReq = new StudentScoreRequest(
                        student.getId(),
                        scoreItem.getId(),
                        Math.round(request.getScore()) // Pushes the exact 0-100 score value perfectly!
                );
                studentScoreService.updateScore(scoreReq);
            }
        }

        return submissionRepository.save(submission);
    }

    private AssignmentSubmissionResponse toSubmissionDto(AssignmentSubmission sub) {
        return AssignmentSubmissionResponse.builder()
                .id(sub.getId())
                .assignmentId(sub.getAssignment() != null ? sub.getAssignment().getId() : null)
                .studentId(sub.getStudent() != null ? sub.getStudent().getId() : null)
                .fileUrl(sub.getFileUrl())
                .fileName(sub.getFileName())
                .submittedAt(sub.getSubmittedAt())
                .status(sub.getStatus())
                .score(sub.getScore())
                .feedback(sub.getFeedback())
                .build();
    }

    public List<AssignmentSubmissionResponse> getSubmissionsByAssignmentDto(Long assignmentId) {
        return submissionRepository.findByAssignmentIdWithStudent(assignmentId).stream()
                .map(this::toSubmissionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssignmentSubmissionResponse getStudentSubmissionDto(Long assignmentId, Long studentId) {
        AssignmentSubmission sub = submissionRepository
                .findByAssignmentIdAndStudentIdWithStudent(assignmentId, studentId)
                .orElse(null);

        if (sub == null) {
            // Return an empty/marker response so frontend can handle "not submitted".
            return AssignmentSubmissionResponse.builder()
                    .assignmentId(assignmentId)
                    .studentId(studentId)
                    .status("NOT_SUBMITTED")
                    .build();
        }

        return toSubmissionDto(sub);
    }

    public List<Assignment> getPendingAssignments(Long studentId) {
        return assignmentRepository.findPendingAssignmentsByStudentId(studentId);
    }

    public List<StudentAssignmentDTO> getAssignmentsWithStudentStatus(Long courseId, Long studentId) {
        // 1. Get all assignments for this course
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        List<StudentAssignmentDTO> dtos = new ArrayList<>();

        // 2. Loop through and attach the student's submission status
        for (Assignment assignment : assignments) {
            StudentAssignmentDTO dto = new StudentAssignmentDTO();
            dto.setId(assignment.getId());
            dto.setTitle(assignment.getTitle());
            dto.setDescription(assignment.getDescription());
            dto.setDueDate(assignment.getDueDate());

            // 3. Look for a submission from this specific student
            Optional<AssignmentSubmission> submissionOpt = submissionRepository
                    .findByAssignmentIdAndStudentId(assignment.getId(), studentId);

            if (submissionOpt.isPresent()) {
                AssignmentSubmission sub = submissionOpt.get();
                dto.setSubmissionStatus(sub.getStatus()); // Assuming status is an Enum
                dto.setSubmittedAt(sub.getSubmittedAt());
            } else {
                dto.setSubmissionStatus("NOT_SUBMITTED");
                dto.setSubmittedAt(null);
            }

            dtos.add(dto);
        }

        return dtos;
    }

}