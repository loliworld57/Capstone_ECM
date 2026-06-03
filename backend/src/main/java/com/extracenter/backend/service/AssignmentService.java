package com.extracenter.backend.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.extracenter.backend.dto.ScoreCategoryRequest;
import com.extracenter.backend.dto.ScoreRequest;
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

        // Automatically create a ScoreItem for this assignment in the "Assignment"
        // category.
        // If the "Assignment" category doesn't exist yet, create it with weight=0.
        // Weight=0 means assignment scores won't contribute to final score until
        // weights are configured.
        try {
            List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);
            ScoreCategory assignmentCategory = categories.stream()
                    .filter(cat -> "Assignment".equalsIgnoreCase(cat.getName()))
                    .findFirst()
                    .orElse(null);

            if (assignmentCategory == null) {
                // Create missing category with default weight=0
                ScoreCategoryRequest categoryRequest = new ScoreCategoryRequest();
                categoryRequest.setName("Assignment");
                categoryRequest.setWeight(0);

                assignmentCategory = scoreCategoryService.createCategory(courseId, categoryRequest);
            }

            // Always create the score item for this assignment
            scoreItemService.createScoreItemForAssignment(savedAssignment, assignmentCategory);
        } catch (Exception e) {
            // Log error but don't fail the assignment creation
            e.printStackTrace();
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

        // Ensure related score items + student scores are deleted too.
        // Otherwise FK constraints may prevent deletion when an assignment has a ScoreItem.
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

    // 3. CHẤM ĐIỂM (GIÁO VIÊN)
    @Transactional
    public AssignmentSubmission gradeSubmission(Long submissionId, ScoreRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found!"));

        // 1) Store teacher grade on the submission record
        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setStatus("SCORED");

        Assignment assignment = submission.getAssignment();
        User student = submission.getStudent();


        // 2) Also write the same grade into the gradebook (StudentScore)
        // so the teacher/student can see it immediately.
        // The ScoreItem for this assignment is stored in the "Assignment" score
        // category.
        try {
            // Find the "Assignment" category for the assignment's course
            ScoreCategory assignmentCategory = scoreCategoryRepository.findByIdAndCourseId(
                    // categoryId is unknown here; so we locate via service by course
                    null, assignment.getCourse().getId());
        } catch (Exception ignored) {
            // We'll resolve via the safer path below.
        }

        // Resolve the score item(s) for this assignment
        // getItemsByAssignment returns ScoreItemResponse DTOs.
        // Re-fetch ScoreItem entities (or update scores) using the returned ids.
        var scoreItemResponses = scoreItemService.getItemsByAssignment(assignment.getId());
        List<ScoreItem> itemsForAssignment = scoreItemResponses.stream()
                .map(scoreItemDto -> scoreItemRepository.findById(scoreItemDto.getId()).orElse(null))
                .filter(scoreItemEntity -> scoreItemEntity != null)
                .toList();




        if (!itemsForAssignment.isEmpty()) {
            // There should normally be exactly one score item for an assignment.
            // If multiple exist, update them all.
            for (ScoreItem scoreItem : itemsForAssignment) {
                StudentScoreRequest scoreReq = new StudentScoreRequest(
                        student.getId(),
                        scoreItem.getId(),
                        Math.round(request.getScore()));
                studentScoreService.updateScore(scoreReq);
            }
        }

        return submissionRepository.save(submission);
    }

    public List<AssignmentSubmission> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    public List<Assignment> getPendingAssignments(Long studentId) {
        return assignmentRepository.findPendingAssignmentsByStudentId(studentId);
    }
}