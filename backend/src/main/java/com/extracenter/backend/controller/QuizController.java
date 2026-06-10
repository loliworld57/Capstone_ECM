package com.extracenter.backend.controller;

import com.extracenter.backend.dto.QuizQuestionDTO;
import com.extracenter.backend.dto.QuizResultResponse;
import com.extracenter.backend.dto.QuizSubmissionRequest;
import com.extracenter.backend.dto.StudentQuestionDTO;
import com.extracenter.backend.dto.StudentQuizDTO;
import com.extracenter.backend.dto.QuizGenerationRequest;
import com.extracenter.backend.repository.MaterialRepository;
import com.extracenter.backend.repository.QuizRepository;
import com.extracenter.backend.repository.QuizSubmissionRepository;
import com.extracenter.backend.entity.Material;
import com.extracenter.backend.dto.CreateQuizRequest;
import com.extracenter.backend.dto.QuizDashboardDTO;
import com.extracenter.backend.service.QuizService;
import com.extracenter.backend.entity.Quiz;
import com.extracenter.backend.entity.QuizQuestion;
import com.extracenter.backend.entity.QuizSubmission;
import com.extracenter.backend.service.DocumentExtractionService;
import com.extracenter.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpServerErrorException;

import org.springframework.security.core.Authentication;
import com.extracenter.backend.entity.User;
import com.extracenter.backend.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private QuizSubmissionRepository quizSubmissionRepository;

    @Autowired
    private DocumentExtractionService documentExtractionService;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private QuizRepository quizRepository;

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
        System.out.println("🔄 Processing quiz update request for ID: " + id);
        try {
            // 1. Fetch the existing quiz record from the database
            Quiz existingQuiz = quizRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quiz not found with ID: " + id));

            // 2. Update the parent settings fields
            existingQuiz.setTitle(request.getTitle());
            existingQuiz.setMaxAttempts(request.getMaxAttempts());
            existingQuiz.setIsGraded(request.getIsGraded());
            existingQuiz.setDueDate(request.getDueDate());

            // 3. Clear the existing questions list to clear old records out of the DB
            // (Because orphanRemoval = true is set in Quiz.java, this cleans up the DB
            // automatically)
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
            System.out.println("Quiz ID " + id + " successfully updated!");

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

        List<StudentQuestionDTO> studentQuestions = quiz.getQuestions().stream()
                .map(q -> new StudentQuestionDTO(q.getId(), q.getQuestionText(), q.getOptions()))
                .collect(Collectors.toList());

        // 3. Assemble and return the safe DTO payload container
        StudentQuizDTO secureQuizPayload = new StudentQuizDTO(quiz.getId(), quiz.getTitle(), studentQuestions);

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
}