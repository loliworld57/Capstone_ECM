package com.extracenter.backend.dto;

import java.util.List;

public class QuizSubmissionRequest {
    private List<AnswerPayload> answers;

    public List<AnswerPayload> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerPayload> answers) {
        this.answers = answers;
    }

    public static class AnswerPayload {
        private Long questionId;
        private String selectedOption;

        public Long getQuestionId() {
            return questionId;
        }

        public void setQuestionId(Long questionId) {
            this.questionId = questionId;
        }

        public String getSelectedOption() {
            return selectedOption;
        }

        public void setSelectedOption(String selectedOption) {
            this.selectedOption = selectedOption;
        }
    }
}