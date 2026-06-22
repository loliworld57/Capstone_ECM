package com.extracenter.backend.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpServerErrorException;

import com.extracenter.backend.dto.CreateQuizRequest;
import com.extracenter.backend.dto.QuizDashboardDTO;
import com.extracenter.backend.dto.QuizGenerationRequest;
import com.extracenter.backend.dto.QuizQuestionDTO;
import com.extracenter.backend.dto.QuizResultResponse;
import com.extracenter.backend.dto.QuizSubmissionRequest;
import com.extracenter.backend.dto.StudentQuestionDTO;
import com.extracenter.backend.dto.StudentQuizDTO;
import com.extracenter.backend.dto.StudentScoreRequest;
import com.extracenter.backend.dto.TeacherQuizReportDTO;
import com.extracenter.backend.entity.Material;
import com.extracenter.backend.entity.Quiz;
import com.extracenter.backend.entity.QuizQuestion;
import com.extracenter.backend.entity.QuizSubmission;
import com.extracenter.backend.entity.ScoreCategory;
import com.extracenter.backend.entity.ScoreItem;
import com.extracenter.backend.entity.StudentScore;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.MaterialRepository;
import com.extracenter.backend.repository.QuizRepository;
import com.extracenter.backend.repository.QuizSubmissionRepository;
import com.extracenter.backend.repository.ScoreCategoryRepository;
import com.extracenter.backend.repository.ScoreItemRepository;
import com.extracenter.backend.repository.UserRepository;
import com.extracenter.backend.service.DocumentExtractionService;
import com.extracenter.backend.service.GeminiService;
import com.extracenter.backend.service.QuizService;
import com.extracenter.backend.service.StudentScoreService;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizService quizService;

    @Autowired
    private StudentScoreService studentScoreService;

    @Autowired
    private ScoreCategoryRepository scoreCategoryRepository;

    @Autowired
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private DocumentExtractionService documentExtractionService;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> generateQuizPreview(@RequestBody QuizGenerationRequest request) {
        try {
            String lessonText = "";

            // OPTION A: Teacher selected an existing material from the database
            if (request.getMaterialId() != null) {
                Material material = materialRepository.findById(request.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found"));

                // HERE is where we finally use your extraction service!
                // (Adjust 'extractTextFromUrl' to whatever your actual method is called)
                lessonText = documentExtractionService.extractTextFromUrl(material.getFileUrl());
            }
            // OPTION B: Teacher uploaded a new file (frontend extracts or sends text)
            else if (request.getText() != null && !request.getText().trim().isEmpty()) {
                lessonText = request.getText();
            } else {
                return ResponseEntity.badRequest().body("You must provide either a materialId or raw text.");
            }

            // Validate question count
            int count = request.getQuestionCount();
            if (count < 5 || count > 20) {
                return ResponseEntity.badRequest().body("Question count must be between 5 and 20.");
            }

            List<QuizQuestionDTO> generatedQuestions = geminiService.generateQuiz(lessonText, count);
            return ResponseEntity.ok(generatedQuestions);

        } catch (HttpServerErrorException.ServiceUnavailable e) {
            System.out.println("Generation aborted: Google API completely unavailable.");
            return ResponseEntity.status(503)
                    .body("The AI engine is currently experiencing high traffic. Please try again in a few moments.");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to generate quiz: " + e.getMessage());
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> createQuiz(@RequestBody CreateQuizRequest request) {
        try {
            // Basic validation
            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Quiz title is required.");
            }
            if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
                return ResponseEntity.badRequest().body("A quiz must have at least one question.");
            }

            Quiz savedQuiz = quizService.saveQuiz(request);

            return ResponseEntity.ok(savedQuiz);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to save quiz: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> getQuizById(@PathVariable Long id) {
        System.out.println("Fetching quiz data for edit view, ID: " + id);

        // 1. Find the quiz by id from the database
        java.util.Optional<Quiz> quizOptional = quizRepository.findById(id);

        // 2. Explicitly handle the found state safely
        if (quizOptional.isPresent()) {
            Quiz quiz = quizOptional.get();
            return ResponseEntity.ok(quiz); // Returns a ResponseEntity<Quiz> cleanly matching <?>
        } else {
            System.out.println("Quiz ID " + id + " not found in database.");
            return ResponseEntity.status(404).body("Quiz not found with ID: " + id);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> updateQuiz(@PathVariable Long id, @RequestBody CreateQuizRequest request) {
        System.out.println("Processing quiz update request for ID: " + id);
        try {
            // 1. Fetch the existing quiz record from the database
            Quiz existingQuiz = quizRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quiz not found with ID: " + id));

            // 2. Update the parent settings fields
            existingQuiz.setTitle(request.getTitle());
            existingQuiz.setMaxAttempts(request.getMaxAttempts());
            existingQuiz.setIsGraded(request.getIsGraded());
            existingQuiz.setDueDate(request.getDueDate());
            existingQuiz.setScoreItemId(request.getScoreItemId());
            existingQuiz.setDurationInMinutes(request.getDurationInMinutes());

            existingQuiz.getQuestions().clear();

            // 4. Loop through the updated questions payload from React and map them back to
            // the entity
            for (QuizQuestionDTO dto : request.getQuestions()) {
                QuizQuestion q = new QuizQuestion();
                q.setQuestionText(dto.getQuestion());
                q.setOptions(dto.getOptions());
                q.setCorrectAnswer(dto.getCorrectAnswer());
                q.setExplanation(dto.getExplanation());

                // CRITICAL: Point the child back to its parent entity to satisfy foreign key
                // rules!
                q.setQuiz(existingQuiz);

                existingQuiz.getQuestions().add(q);
            }

            // 5. Save the parent entity. Thanks to CascadeType.ALL, this pushes all changes
            // downstream!
            Quiz updatedQuiz = quizRepository.save(existingQuiz);
            List<com.extracenter.backend.entity.ScoreItem> oldItems = scoreItemRepository
                    .findByQuizId(updatedQuiz.getId());
            for (com.extracenter.backend.entity.ScoreItem oldItem : oldItems) {
                if (request.getScoreItemId() == null || !oldItem.getId().equals(request.getScoreItemId())) {
                    oldItem.setQuiz(null);
                    scoreItemRepository.save(oldItem);

                    studentScoreService.clearScoresByScoreItemId(oldItem.getId());
                }
            }

            if (request.getScoreItemId() != null) {
                scoreItemRepository.findById(request.getScoreItemId()).ifPresent(item -> {
                    item.setQuiz(updatedQuiz);
                    scoreItemRepository.saveAndFlush(item);
                });

                if (Boolean.TRUE.equals(updatedQuiz.getIsGraded())) {
                    System.out.println("🔄 Retroactively syncing past quiz submissions...");

                    List<QuizSubmission> allSubmissions = quizSubmissionRepository
                            .findStudentSubmissionsByQuizId(updatedQuiz.getId());

                    // Group by student to find their best historical attempt
                    Map<Long, List<QuizSubmission>> submissionsByStudent = allSubmissions.stream()
                            .collect(Collectors.groupingBy(QuizSubmission::getStudentId));

                    int totalQuestions = updatedQuiz.getQuestions().size();

                    for (Map.Entry<Long, List<QuizSubmission>> entry : submissionsByStudent.entrySet()) {
                        int maxScore = entry.getValue().stream()
                                .mapToInt(QuizSubmission::getScore).max().orElse(0);

                        // Calculate Gradebook percentage (0-100)
                        int calculatedPercentage = totalQuestions > 0
                                ? (int) Math.round(((double) maxScore / totalQuestions) * 100.0)
                                : 0;

                        StudentScoreRequest gradebookRequest = new StudentScoreRequest(
                                entry.getKey(), request.getScoreItemId(), calculatedPercentage);

                        // Pushes the past score into the gradebook!
                        studentScoreService.updateScore(gradebookRequest);
                    }
                }
            }

            System.out.println("Quiz ID " + id + " successfully updated and linked to Gradebook!");
            return ResponseEntity.ok(updatedQuiz);

        } catch (Exception e) {
            System.out.println("Failed to update quiz: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to update quiz: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long id) {
        try {
            // 1. Check if the quiz actually exists first
            if (!quizRepository.existsById(id)) {
                return ResponseEntity.status(404).body("Quiz not found with ID: " + id);
            }

            // 2. Delete it from the database.
            // Because of CascadeType.ALL, this automatically purges all connected
            // QuizQuestions too!
            quizRepository.deleteById(id);

            return ResponseEntity.ok("Quiz deleted successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to delete quiz: " + e.getMessage());
        }
    }

    @GetMapping("/student/{id}")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<?> getQuizForStudent(@PathVariable Long id) {
        System.out.println("Student requesting quiz structural outline, ID: " + id);

        Optional<Quiz> quizOptional = quizRepository.findById(id);

        if (quizOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Quiz not found with ID: " + id);
        }

        Quiz quiz = quizOptional.get();

        System.out.println("REQUEST START");
        List<QuizQuestion> shuffledQuestions = new ArrayList<>(quiz.getQuestions());
        Collections.shuffle(shuffledQuestions);
        shuffledQuestions.forEach(q -> System.out.println(q.getQuestionText()));

        System.out.println("REQUEST END");
        List<StudentQuestionDTO> studentQuestions = shuffledQuestions.stream()
                .map(q -> {

                    List<String> shuffledOptions = new ArrayList<>(q.getOptions());

                    Collections.shuffle(shuffledOptions);

                    return new StudentQuestionDTO(
                            q.getId(),
                            q.getQuestionText(),
                            shuffledOptions);
                })
                .collect(Collectors.toList());

        // 3. Assemble and return the safe DTO payload container
        StudentQuizDTO secureQuizPayload = new StudentQuizDTO(quiz.getId(), quiz.getTitle(), studentQuestions,
                quiz.getDurationInMinutes());

        return ResponseEntity.ok(secureQuizPayload);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('STUDENT')")
    public ResponseEntity<?> submitQuizAnswers(
            @PathVariable Long id,
            @RequestBody QuizSubmissionRequest request,
            Authentication authentication) { // <-- ADD THISPARAMETER HERE
        try {
            Quiz quiz = quizRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quiz instance not found"));

            int score = 0;
            int totalQuestions = quiz.getQuestions().size();

            for (QuizQuestion serverQuestion : quiz.getQuestions()) {
                String studentSelection = request.getAnswers().stream()
                        .filter(ans -> ans.getQuestionId().equals(serverQuestion.getId()))
                        .map(QuizSubmissionRequest.AnswerPayload::getSelectedOption)
                        .findFirst()
                        .orElse("");

                if (serverQuestion.getCorrectAnswer().trim().equalsIgnoreCase(studentSelection.trim())) {
                    score++;
                }
            }

            String currentStudentEmail = authentication.getName();
            Long activeStudentId = userRepository.findByEmail(currentStudentEmail)
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found in database")).getId();

            QuizSubmission submission = new QuizSubmission(
                    quiz,
                    activeStudentId, // Saved perfectly per unique user database index!
                    score,
                    totalQuestions,
                    java.time.LocalDateTime.now());

            quizSubmissionRepository.save(submission);

            if (quiz.getScoreItemId() != null && Boolean.TRUE.equals(quiz.getIsGraded())) {
                // 1. Normalize the quiz score onto the gradebook's standard 0-100 scale
                int calculatedGradePercentage = (int) Math.round(((double) score / totalQuestions) * 100.0);

                // 2. Query if they have an existing score in this category slot
                Optional<StudentScore> currentRecordOpt = studentScoreService.getScore(activeStudentId,
                        quiz.getScoreItemId());

                if (currentRecordOpt.isEmpty() || calculatedGradePercentage > currentRecordOpt.get().getScore()) {
                    // Post the new highest grade value cleanly
                    StudentScoreRequest gradebookRequest = new StudentScoreRequest(
                            activeStudentId,
                            quiz.getScoreItemId(),
                            calculatedGradePercentage);
                    studentScoreService.updateScore(gradebookRequest);
                    System.out.println("Gradebook updated automatically for student via Quiz engine. Score: "
                            + calculatedGradePercentage);
                }
            }
            return ResponseEntity.ok(new QuizResultResponse(score, totalQuestions));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to process submission: " + e.getMessage());
        }
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyAuthority('STUDENT', 'TEACHER', 'MANAGER')")
    public ResponseEntity<?> getQuizzesByCourse(
            @PathVariable Long courseId,
            Authentication authentication) { // <-- ADD THIS PARAMETER HERE

        System.out.println("Fetching live quiz metrics dashboard for course: " + courseId);

        // Extract dynamic student ID using the exact same strategy as above
        String currentStudentEmail = authentication.getName();
        Long activeStudentId = userRepository.findByEmail(currentStudentEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database")).getId();

        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);

        List<QuizDashboardDTO> dashboardList = quizzes.stream().map(quiz -> {

            // Dynamic search parameters match ONLY this student's primary records
            List<QuizSubmission> studentSubmissions = quizSubmissionRepository
                    .findByQuizIdAndStudentId(quiz.getId(), activeStudentId);

            long attemptsTaken = studentSubmissions.size();

            Integer highestScore = studentSubmissions.stream()
                    .map(QuizSubmission::getScore)
                    .max(Integer::compare)
                    .orElse(null);

            Integer totalQuestions = quiz.getQuestions().isEmpty() ? null : quiz.getQuestions().size();

            return new QuizDashboardDTO(
                    quiz.getId(),
                    quiz.getTitle(),
                    quiz.getDueDate(),
                    quiz.getMaxAttempts(),
                    quiz.getIsGraded(),
                    highestScore,
                    totalQuestions,
                    attemptsTaken);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dashboardList);
    }

    @GetMapping("/{quizId}/teacher-report")
    @PreAuthorize("hasAnyAuthority('TEACHER', 'MANAGER')")
    public ResponseEntity<?> getQuizReportForTeacher(@PathVariable Long quizId) {
        System.out.println("Teacher generating performance report for Quiz ID: " + quizId);

        // 1. Fetch target quiz context wrapper
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz record context not found"));

        int totalQuestions = quiz.getQuestions().isEmpty() ? 0 : quiz.getQuestions().size();

        // 2. Fetch all raw submission tokens
        List<QuizSubmission> allSubmissions = quizSubmissionRepository.findStudentSubmissionsByQuizId(quizId);

        if (allSubmissions.isEmpty()) {
            // Return clear empty metrics container so frontend doesn't crash on NaN values
            return ResponseEntity
                    .ok(new TeacherQuizReportDTO(0.0, 0, 0, 0, totalQuestions, new java.util.ArrayList<>()));
        }

        // 3. Group submissions by Student ID to filter down to their highest score
        Map<Long, List<QuizSubmission>> submissionsByStudent = allSubmissions.stream()
                .collect(Collectors.groupingBy(QuizSubmission::getStudentId));

        List<TeacherQuizReportDTO.StudentResultRow> rosterRows = new java.util.ArrayList<>();

        int classHighest = Integer.MIN_VALUE;
        int classLowest = Integer.MAX_VALUE;
        double classScoreSum = 0;

        for (Map.Entry<Long, List<QuizSubmission>> entry : submissionsByStudent.entrySet()) {
            Long studentId = entry.getKey();
            List<QuizSubmission> studentAttempts = entry.getValue();

            // Calculate student's individual highest score
            int studentMax = studentAttempts.stream()
                    .mapToInt(QuizSubmission::getScore)
                    .max()
                    .orElse(0);

            // Track running summary totals for the global metrics blocks
            classScoreSum += studentMax;
            if (studentMax > classHighest)
                classHighest = studentMax;
            if (studentMax < classLowest)
                classLowest = studentMax;

            // Get the timestamp of their latest work
            java.time.LocalDateTime lastSubmitted = studentAttempts.stream()
                    .map(QuizSubmission::getSubmittedAt)
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(java.time.LocalDateTime.now());

            // Pull user contact metadata fields safely
            String studentName = "Unknown Student";
            String email = "N/A";
            Optional<User> studentOpt = userRepository.findById(studentId);
            if (studentOpt.isPresent()) {
                User s = studentOpt.get();
                studentName = s.getLastName() + " " + s.getFirstName();
                email = s.getEmail();
            }

            rosterRows.add(new TeacherQuizReportDTO.StudentResultRow(
                    studentId, studentName, email, studentMax, studentAttempts.size(), lastSubmitted));
        }

        double averageScore = Math.round((classScoreSum / submissionsByStudent.size()) * 10.0) / 10.0;

        TeacherQuizReportDTO completeReport = new TeacherQuizReportDTO(
                averageScore,
                submissionsByStudent.size(), // Total unique active students who participated
                classHighest,
                classLowest,
                totalQuestions,
                rosterRows);

        return ResponseEntity.ok(completeReport);
    }

    @GetMapping("/course/{courseId}/gradebook-items")
    public ResponseEntity<?> getAvailableGradebookColumns(@PathVariable Long courseId) {
        // Find categories for the course, stream out their items, and return them for a
        // flat selection menu dropdown!
        List<ScoreCategory> categories = scoreCategoryRepository.findByCourseId(courseId);
        List<ScoreItem> openItems = categories.stream()
                .flatMap(cat -> cat.getScoreItems().stream())
                .collect(Collectors.toList());

        return ResponseEntity.ok(openItems);
    }
}