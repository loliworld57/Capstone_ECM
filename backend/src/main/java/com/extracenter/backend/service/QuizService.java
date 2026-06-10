package com.extracenter.backend.service;

import com.extracenter.backend.dto.CreateQuizRequest;
import com.extracenter.backend.dto.QuizQuestionDTO;
import com.extracenter.backend.entity.Quiz;
import com.extracenter.backend.entity.QuizQuestion;
import com.extracenter.backend.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Transactional // Ensures that if something fails, nothing gets saved (no half-saved quizzes)
    public Quiz saveQuiz(CreateQuizRequest request) {

        // 1. Create the main Quiz entity
        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setCourseId(request.getCourseId());
        quiz.setMaterialId(request.getMaterialId());
        quiz.setMaxAttempts(request.getMaxAttempts());
        quiz.setIsGraded(request.getIsGraded());
        quiz.setDueDate(request.getDueDate());

        // 2. Map the DTO questions to the Entity questions
        List<QuizQuestion> questionEntities = new ArrayList<>();

        for (QuizQuestionDTO dto : request.getQuestions()) {
            QuizQuestion q = new QuizQuestion();
            q.setQuestionText(dto.getQuestion());
            q.setOptions(dto.getOptions());
            q.setCorrectAnswer(dto.getCorrectAnswer());
            q.setExplanation(dto.getExplanation());

            // Crucial: Link the question back to the parent quiz!
            q.setQuiz(quiz);

            questionEntities.add(q);
        }

        // 3. Attach the questions to the quiz
        quiz.setQuestions(questionEntities);

        // 4. Save to the database.
        // Because of the CascadeType.ALL on your Quiz entity, this saves the questions
        // too!
        return quizRepository.save(quiz);
    }
}