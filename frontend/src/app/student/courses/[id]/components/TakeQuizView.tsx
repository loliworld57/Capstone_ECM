"use client";

import React, { useState, useEffect } from 'react';
import { Clock, SendHorizontal, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from '@/utils/axiosConfig';

interface TakeQuizViewProps {
    quizId: number;
    onBack: () => void;
}

export default function TakeQuizView({ quizId, onBack }: TakeQuizViewProps) {
    const [quizData, setQuizData] = useState<any>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutes in seconds default
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        const loadQuizDetails = async () => {
            try {
                // Fetch the full quiz with questions from your backend endpoint
                const res = await api.get(`/quizzes/student/${quizId}`);
                setQuizData(res.data);
            } catch (err) {
                console.error("Failed to load quiz active instance", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadQuizDetails();
    }, [quizId]);

    // Timer Countdown handling loop
    useEffect(() => {
        if (isLoading || results || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isLoading, results, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionId: number, optionText: string) => {
        if (results) return; // Freeze selections once submitted
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionText }));
    };

    const handleSubmitQuiz = async () => {
        // Build map schema format matching your student submission processing pipeline
        setIsSubmitting(true);
        try {
            const payload = {
                quizId: quizId,
                answers: Object.entries(selectedAnswers).map(([qId, val]) => ({
                    questionId: Number(qId),
                    selectedOption: val
                }))
            };

            const response = await api.post(`/quizzes/${quizId}/submit`, payload);
            setResults(response.data); // Backends sends score metrics & correct checks
        } catch (error) {
            console.error("Submission failed", error);
            alert("Could not process your answers. Please try submitting again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="p-12 text-center text-gray-500">
            <Clock className="animate-spin mx-auto mb-2 text-blue-600" size={32} />
            Loading active exam workspace...
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto mt-6 px-4 pb-12 text-gray-800">
            {/* STICKY WORKSPACE HEADER BAR */}
            <div className="sticky top-0 bg-white z-40 shadow-md border rounded-xl p-4 flex items-center justify-between mb-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-1 font-medium">
                        <ArrowLeft size={14} /> Back to Course Dashboard
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">{quizData?.title}</h1>
                </div>

                {!results && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg font-bold ${timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-gray-50 text-gray-700"
                        }`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* IF RESULTS LOADED: SHOW CONGRATS HERO SUMMARY BADGE */}
            {results && (
                <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl mb-6 flex items-center gap-4">
                    <CheckCircle2 size={48} className="text-green-600 flex-shrink-0" />
                    <div>
                        <h2 className="text-xl font-bold text-green-900">Quiz Completed Successfully!</h2>
                        <p className="text-sm text-green-700 font-medium mt-0.5">
                            You scored <span className="font-extrabold">{results.score} out of {quizData.questions.length}</span> questions correctly.
                        </p>
                    </div>
                </div>
            )}

            {/* EXAM CORE QUESTIONS LOOP TREE */}
            <div className="space-y-6">
                {quizData?.questions.map((q: any, idx: number) => {
                    const studentAnswer = selectedAnswers[q.id];

                    return (
                        <div key={q.id} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <p className="font-bold text-base mb-4 text-gray-900">
                                Question {idx + 1}: <span className="font-semibold text-gray-800">{q.questionText}</span>
                            </p>

                            <div className="grid grid-cols-1 gap-2.5">
                                {q.options.map((opt: string, optIdx: number) => {
                                    const isSelected = studentAnswer === opt;

                                    return (
                                        <button
                                            key={optIdx}
                                            type="button"
                                            onClick={() => handleOptionSelect(q.id, opt)}
                                            className={`p-3 px-4 rounded-xl border text-left text-sm transition flex items-center gap-3 ${isSelected
                                                ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500"
                                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-gray-50 text-gray-500"
                                                }`}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ACTIONS FOOTER SUBMISSION BAR */}
            {!results && (
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting || Object.keys(selectedAnswers).length === 0}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? "Processing Submission..." : "Submit Answers"}
                        <SendHorizontal size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}