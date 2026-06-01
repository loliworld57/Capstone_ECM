package com.extracenter.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.extracenter.backend.dto.ScoreRequest;
import com.extracenter.backend.entity.Assignment;
import com.extracenter.backend.entity.AssignmentSubmission;
import com.extracenter.backend.entity.ClassSession;
import com.extracenter.backend.entity.Course;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.AssignmentRepository;
import com.extracenter.backend.repository.AssignmentSubmissionRepository;
import com.extracenter.backend.repository.ClassSessionRepository;
import com.extracenter.backend.repository.CourseRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.UserRepository;

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
    private ScoreItemService scoreItemService;

    // 1. TẠO BÀI TẬP (GIÁO VIÊN)
    @Transactional
    public Assignment createAssignment(String title, String description, LocalDateTime dueDate,
            Long courseId, Long classSessionId, MultipartFile file) throws IOException {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Assignment assignment = new Assignment();
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDueDate(dueDate);
        assignment.setCourse(course);

        // Nếu có gắn vào buổi học cụ thể
        if (classSessionId != null) {
            ClassSession session = classSessionRepository.findById(classSessionId)
                    .orElseThrow(() -> new RuntimeException("Class session not found!"));
            assignment.setClassSession(session);
        }

        // Nếu giáo viên có đính kèm file đề bài
        if (file != null && !file.isEmpty()) {
            String fileUrl = cloudinaryService.uploadFile(file);
            assignment.setFileUrl(fileUrl);
            assignment.setFileName(file.getOriginalFilename());
        }

        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Automatically create a ScoreItem for this assignment in the "Assignment" category
        try {
            List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);
            ScoreCategory assignmentCategory = categories.stream()
                    .filter(cat -> "Assignment".equalsIgnoreCase(cat.getName()))
                    .findFirst()
                    .orElse(null);

            if (assignmentCategory != null) {
                scoreItemService.createScoreItemForAssignment(savedAssignment, assignmentCategory);
            }
        } catch (Exception e) {
            // Log error but don't fail the assignment creation
            e.printStackTrace();
        }

        return savedAssignment;
    }

    public List<Assignment> getAssignmentsForCourse(Long courseId) {
        return assignmentRepository.findByCourseIdOrderByDueDateAsc(courseId);
    }

    // --- HÀM MỚI: CẬP NHẬT BÀI TẬP ---
    @Transactional
    public Assignment updateAssignment(Long id, String title, String description, LocalDateTime dueDate,
            MultipartFile file) throws IOException {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setDueDate(dueDate);

        // Nếu giáo viên tải lên file mới, chúng ta sẽ upload và ghi đè file URL cũ
        if (file != null && !file.isEmpty()) {
            String fileUrl = cloudinaryService.uploadFile(file);
            assignment.setFileUrl(fileUrl);
            assignment.setFileName(file.getOriginalFilename());
        }

        return assignmentRepository.save(assignment);
    }

    // --- HÀM MỚI: XÓA BÀI TẬP ---
    @Transactional
    public void deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        // Nhờ thiết lập CascadeType.ALL ở Entity Assignment,
        // toàn bộ AssignmentSubmissions (Bài nộp của học sinh) cũng sẽ tự động bị xóa
        // theo an toàn!
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

    // 3. CHẤM ĐIỂM (GIÁO VIÊN)
    @Transactional
    public AssignmentSubmission gradeSubmission(Long submissionId, ScoreRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found!"));

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setStatus("SCORED");

        return submissionRepository.save(submission);
    }

    public List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    public List<Assignment> getPendingAssignments(Long studentId) {
        return assignmentRepository.findPendingAssignmentsByStudentId(studentId);
    }
}