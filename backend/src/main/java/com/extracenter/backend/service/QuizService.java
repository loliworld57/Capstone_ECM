package com.extracenter.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.extracenter.backend.dto.CreateQuizRequest;
import com.extracenter.backend.dto.QuizQuestionDTO;
import com.extracenter.backend.entity.Quiz;
import com.extracenter.backend.entity.QuizQuestion;
import com.extracenter.backend.repository.QuizRepository;
import com.extracenter.backend.repository.ScoreItemRepository;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ScoreItemRepository scoreItemRepository;

    @Transactional
    public Quiz saveQuiz(CreateQuizRequest request) {

        // 1. Create the main Quiz entity
        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setCourseId(request.getCourseId());
        quiz.setMaterialId(request.getMaterialId());
        quiz.setMaxAttempts(request.getMaxAttempts());
        quiz.setIsGraded(request.getIsGraded());
        quiz.setDueDate(request.getDueDate());
        quiz.setScoreItemId(request.getScoreItemId());
        quiz.setDurationInMinutes(request.getDurationInMinutes());

        // 2. Map the DTO questions to the Entity questions
        List<QuizQuestion> questionEntities = new ArrayList<>();

        for (QuizQuestionDTO dto : request.getQuestions()) {
            QuizQuestion q = new QuizQuestion();
            q.setQuestionText(dto.getQuestion());
            q.setOptions(dto.getOptions());
            q.setCorrectAnswer(dto.getCorrectAnswer());
            q.setExplanation(dto.getExplanation());

            q.setQuiz(quiz);

            questionEntities.add(q);
        }

        // 3. Attach the questions to the quiz
        quiz.setQuestions(questionEntities);

        Quiz savedQuiz = quizRepository.save(quiz);

        // 2. CRITICAL FIX: Link the chosen Gradebook column to the newly created quiz
        if (request.getScoreItemId() != null) {
            scoreItemRepository.findById(request.getScoreItemId()).ifPresent(item -> {
                item.setQuiz(savedQuiz);
                scoreItemRepository.save(item);
            });
        }

        return savedQuiz;
    }

    
}