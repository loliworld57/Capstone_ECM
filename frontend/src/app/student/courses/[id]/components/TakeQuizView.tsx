"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock, SendHorizontal, ArrowLeft, CheckCircle2, Award, FileText, ListOrdered, Loader2 } from "lucide-react";
import api from '@/utils/axiosConfig';
import ConfirmModal from '@/components/ConfirmModal';

interface TakeQuizViewProps {
    quizId: number;
    onBack: () => void;
}

export default function TakeQuizView({ quizId, onBack }: TakeQuizViewProps) {
    const [quizData, setQuizData] = useState<any>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(1800);
    const [results, setResults] = useState<any>(null);

    const selectedAnswersRef = useRef(selectedAnswers);
    useEffect(() => {
        selectedAnswersRef.current = selectedAnswers;
    }, [selectedAnswers]);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        onConfirm: () => void;
    } | null>(null);

    const closeModalConfig = () => setModalConfig(null);

    // 1. FETCH QUIZ DATA EFFECT (Fixed Double Request)
    useEffect(() => {
        let isMounted = true;

        const loadQuizDetails = async () => {
            try {
                const res = await api.get(`/quizzes/student/${quizId}`);

                if (isMounted) {
                    setQuizData(res.data);

                    // Fallback to 30 minutes if durationInMinutes is null/undefined
                    if (res.data?.durationInMinutes && res.data.durationInMinutes > 0) {
                        setTimeLeft(res.data.durationInMinutes * 60);
                    } else {
                        setTimeLeft(30 * 60);
                    }
                }
            } catch (err) {
                console.error("Failed to load quiz active instance", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadQuizDetails();

        return () => {
            isMounted = false; // Cleanup flag
        };
    }, [quizId]);

    // Abstracted Submission Logic
    const executeSubmit = async (currentAnswers: typeof selectedAnswers) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        closeModalConfig();

        try {
            const payload = {
                quizId: quizId,
                answers: Object.entries(currentAnswers).map(([qId, val]) => ({
                    questionId: Number(qId),
                    selectedOption: val
                }))
            };

            const response = await api.post(`/quizzes/${quizId}/submit`, payload);
            setResults(response.data);
        } catch (error) {
            console.error("Submission failed", error);
            alert("Could not process your answers. Please try submitting again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const preventTabClose = (e: BeforeUnloadEvent) => {
            if (results) return;
            e.preventDefault();
            e.returnValue = "Leaving now will lock your exam progress and grade unanswered questions as 0!";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", preventTabClose);
        return () => window.removeEventListener("beforeunload", preventTabClose);
    }, [results]);

    // 2. STABLE COUNTDOWN AND AUTO-SUBMIT EFFECT
    useEffect(() => {
        if (isLoading || results || isSubmitting) return;

        // Auto-submit instantly if time runs out
        if (timeLeft <= 0) {
            executeSubmit(selectedAnswersRef.current);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isLoading, results, timeLeft, isSubmitting]);

    const handleLeaveAssessment = () => {
        if (results) {
            onBack();
            return;
        }

        setModalConfig({
            isOpen: true,
            title: "Leave Assessment?",
            message: "WARNING: Leaving now will instantly finalize and lock your attempt. Any unanswered questions remaining will be graded as INCORRECT (0 pts). Do you wish to proceed?",
            confirmText: "Yes, Exit & Submit",
            onConfirm: () => executeSubmit(selectedAnswersRef.current)
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (questionId: number, optionText: string) => {
        if (results || isSubmitting) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionText }));
    };

    const handleSubmitQuiz = () => {
        if (isSubmitting || results) return;

        setModalConfig({
            isOpen: true,
            title: "Finish & Submit?",
            message: "Are you sure you want to finalize your assessment? You will not be able to change your options after this action.",
            confirmText: "Finish & Submit",
            onConfirm: () => executeSubmit(selectedAnswers)
        });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center text-[var(--color-text)]/70">
            <Loader2 className="animate-spin mb-3 text-[var(--color-main)]" size={40} />
            <p className="text-sm font-medium tracking-wide animate-pulse">Setting up your secure exam environment...</p>
        </div>
    );

    const questionsCount = quizData?.questions?.length || 0;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
        <div className="max-w-4xl mx-auto mt-4 px-4 pb-16 text-[var(--color-text)] antialiased">

            {modalConfig && (
                <ConfirmModal
                    isOpen={modalConfig.isOpen}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    confirmText={modalConfig.confirmText || "Confirm"}
                    onClose={closeModalConfig}
                    onConfirm={modalConfig.onConfirm}
                />
            )}

            {/* STICKY WORKSPACE HEADER BAR */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 border border-[var(--color-main)]/10 shadow-sm rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 transition-all duration-200">
                <div className="space-y-0.5">
                    <button
                        onClick={handleLeaveAssessment}
                        disabled={isSubmitting && !results}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-text)]/60 hover:text-[var(--color-main)] mb-1 font-semibold transition-colors disabled:opacity-40"
                    >
                        <ArrowLeft size={14} /> Leave Assessment
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[var(--color-main)] shrink-0" />
                        <h1 className="text-lg font-bold tracking-tight">{quizData?.title || "Quiz Workspace"}</h1>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {!results && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-xs font-medium border border-gray-100">
                            <ListOrdered size={14} className="opacity-60" />
                            <span>Progress: <strong className="text-[var(--color-main)]">{answeredCount}</strong>/{questionsCount}</span>
                        </div>
                    )}

                    {!results && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-base font-bold shadow-sm tracking-wide transition-all ${timeLeft < 300
                            ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                            : "bg-[var(--color-soft-white)] text-[var(--color-text)] border-[var(--color-main)]/20"
                            }`}>
                            <Clock size={18} className={timeLeft < 300 ? "text-red-500" : "text-[var(--color-main)]"} />
                            {formatTime(timeLeft <= 0 ? 0 : timeLeft)}
                        </div>
                    )}
                </div>
            </div>

            {/* SCORE DISCOVERY SECTION */}
            {results && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 p-6 rounded-2xl mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-500 text-white rounded-2xl shadow-sm shadow-green-500/20">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-green-950">Quiz Finished Successfully!</h2>
                            <p className="text-sm text-green-800/80 mt-1 font-medium max-w-md">
                                Your answers have been successfully locked and recorded. Review your overall grade score below.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white border border-green-200 p-4 rounded-xl shadow-inner shrink-0 self-stretch md:self-auto justify-center">
                        <Award size={24} className="text-green-600" />
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final Result</div>
                            <div className="text-xl font-black text-green-950">
                                {results.score} <span className="text-sm text-gray-400 font-normal">/ {questionsCount} Correct</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EXAM CORE QUESTIONS GRID TREE */}
            <div className="space-y-6">
                {quizData?.questions?.map((q: any, idx: number) => {
                    const studentAnswer = selectedAnswers[q.id];

                    return (
                        <div
                            key={q.id}
                            className={`p-6 bg-white rounded-2xl border transition-all duration-200 shadow-sm ${studentAnswer && !results
                                ? "border-[var(--color-main)]/30 ring-1 ring-[var(--color-main)]/5"
                                : "border-gray-100"
                                }`}
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-main)]/5 text-[var(--color-main)] font-bold text-xs shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <p className="font-bold text-base text-gray-900 leading-snug">
                                    {q.questionText}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pl-0 md:pl-10">
                                {q.options.map((opt: string, optIdx: number) => {
                                    const isSelected = studentAnswer === opt;

                                    return (
                                        <button
                                            key={optIdx}
                                            type="button"
                                            disabled={!!results || isSubmitting}
                                            onClick={() => handleOptionSelect(q.id, opt)}
                                            className={`group w-full p-3.5 px-4 rounded-xl border text-left text-sm transition-all duration-150 flex items-center gap-3.5 ${isSelected
                                                ? "bg-[var(--color-main)]/[0.03] border-[var(--color-main)] text-gray-900 font-semibold shadow-sm"
                                                : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700 disabled:bg-gray-50/50 disabled:border-gray-100"
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                ? "bg-[var(--color-main)] border-[var(--color-main)] text-white shadow-sm shadow-[var(--color-main)]/20"
                                                : "border-gray-200 bg-gray-50 text-gray-400 group-hover:border-gray-300"
                                                }`}>
                                                {String.fromCharCode(65 + optIdx)}
                                            </div>

                                            <span className="flex-1 leading-normal">{opt}</span>
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
                <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <p className="text-xs text-[var(--color-text)]/50 font-medium">
                        {answeredCount === questionsCount
                            ? "All questions answered. Ready to submit."
                            : `Unanswered tasks remaining: ${questionsCount - answeredCount}`}
                    </p>

                    <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting || answeredCount === 0}
                        className="px-6 py-3 bg-[var(--color-main)] text-white font-bold text-sm rounded-xl shadow-md shadow-[var(--color-main)]/10 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2 shrink-0"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing Grade...
                            </>
                        ) : (
                            <>
                                Finish & Submit
                                <SendHorizontal size={16} />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}