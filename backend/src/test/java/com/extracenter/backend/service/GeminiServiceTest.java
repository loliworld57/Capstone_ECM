package com.extracenter.backend.service;

import com.extracenter.backend.dto.QuizQuestionDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class GeminiServiceTest {

    @Autowired
    private GeminiService geminiService;

    @Test
    public void testGenerateQuiz() throws Exception {
        // 1. A tiny, hardcoded lesson for the AI to read
        String miniLesson = "Java is a high-level, class-based, object-oriented programming language " +
                "designed to have as few implementation dependencies as possible. It was originally " +
                "developed by James Gosling at Sun Microsystems and released in 1995.";

        System.out.println("🚀 Sending request to Gemini...");

        // 2. Ask for exactly 2 questions
        List<QuizQuestionDTO> quiz = geminiService.generateQuiz(miniLesson, 2);

        // 3. Verify and Print the results!
        assertNotNull(quiz);
        assertEquals(2, quiz.size());

        System.out.println("Gemini responded successfully! Here is the JSON mapped to Java Objects:\n");

        for (int i = 0; i < quiz.size(); i++) {
            QuizQuestionDTO q = quiz.get(i);
            System.out.println("Question " + (i + 1) + ": " + q.getQuestion());
            System.out.println("Options: " + q.getOptions());
            System.out.println("Correct Answer: " + q.getCorrectAnswer());
            System.out.println("Explanation: " + q.getExplanation());
            System.out.println("--------------------------------------------------");
        }
    }
}