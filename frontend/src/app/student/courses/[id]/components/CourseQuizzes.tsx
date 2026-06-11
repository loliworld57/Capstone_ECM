"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, Search, Loader2, PlayCircle, Clock, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import TakeQuizView from "./TakeQuizView";

interface Props {
    courseId: number;
    readOnly?: boolean;
}

interface Quiz {
    id: number;
    title: string;
    dueDate: string;
    maxAttempts: number;
    isGraded: boolean;
    highestScore: number | null;   // Live from backend DTO
    totalQuestions: number | null; // Live from backend DTO
    attemptsTaken: number;          // Live from backend DTO
}

export default function CourseQuizzes({ courseId, readOnly = false }: Props) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const quizRes = await api.get(`/quizzes/course/${courseId}`);
            setQuizzes(quizRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load real-time quiz dashboard.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredQuizzes = Array.isArray(quizzes)
        ? quizzes.filter((q) => q.title.toLowerCase().includes(keyword.toLowerCase()))
        : [];

    if (activeQuizId) {
        return (
            <TakeQuizView
                quizId={activeQuizId}
                onBack={() => {
                    setActiveQuizId(null);
                    fetchData(); // This instantly pulls down their fresh score row upon submission!
                }}
            />
        );
    }

    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm mt-6 overflow-hidden">
            {/* HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={18} />
                    Available Course Quizzes ({quizzes.length})
                </div>
            </div>

            <div className="p-6">
                {/* SEARCH BAR */}
                <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search quizzes by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none transition"
                    />
                </div>

                {/* QUIZZES TABLE */}
                <div className="overflow-x-auto border border-[var(--color-main)] rounded-lg">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-[var(--color-main)]">
                                <th className="p-4 font-semibold">Quiz Title</th>
                                <th className="p-4 font-semibold w-44">Due Date</th>
                                <th className="p-4 font-semibold w-40 text-center">Attempts Progress</th>
                                <th className="p-4 font-semibold w-36 text-center">Highest Score</th>
                                <th className="p-4 font-semibold w-36 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10">
                                        <Loader2 size={24} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-gray-500">Syncing live database records...</p>
                                    </td>
                                </tr>
                            ) : filteredQuizzes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-500 py-10 border-dashed">
                                        {keyword ? "No quizzes match your search." : "No quizzes found yet."}
                                    </td>
                                </tr>
                            ) : (
                                filteredQuizzes.map((quiz) => {
                                    const isPastDue = new Date(quiz.dueDate) < new Date();
                                    const hasTaken = quiz.attemptsTaken > 0;

                                    // Evaluate if they have any attempts remaining
                                    // maxAttempts === 0 means unlimited attempts
                                    const hasAttemptsLeft = quiz.maxAttempts === 0 || quiz.attemptsTaken < quiz.maxAttempts;
                                    const isLockedOut = !hasAttemptsLeft;

                                    return (
                                        <tr key={quiz.id} className="border-b last:border-0 border-gray-200 hover:bg-[var(--color-secondary)]/5 transition">

                                            {/* 1. Title & Grading Indicator */}
                                            <td className="p-4 font-semibold text-[var(--color-text)]">
                                                {quiz.title}
                                                {quiz.isGraded && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 border border-green-200">
                                                        Graded
                                                    </span>
                                                )}
                                            </td>

                                            {/* 2. Due Date Status */}
                                            <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className={isPastDue && !hasTaken ? "text-red-500" : "text-gray-400"} />
                                                    <span className={isPastDue && !hasTaken ? "text-red-600 font-bold" : ""}>
                                                        {formatDate(quiz.dueDate)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 3. Real-Time Attempts Progress Counter */}
                                            <td className="p-4 text-center font-medium text-gray-700">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isLockedOut ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {quiz.maxAttempts === 0
                                                        ? `${quiz.attemptsTaken} taken (∞ left)`
                                                        : `${quiz.attemptsTaken} / ${quiz.maxAttempts} used`
                                                    }
                                                </span>
                                            </td>

                                            {/* 4. Live Highest Grade Display */}
                                            <td className="p-4 text-center">
                                                {hasTaken ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                                                            <CheckCircle size={12} />
                                                            {quiz.highestScore} / {quiz.totalQuestions}
                                                        </span>
                                                    </div>
                                                ) : isPastDue ? (
                                                    <span className="text-xs text-red-500 font-bold flex items-center justify-center gap-1">
                                                        <AlertTriangle size={12} /> Missed
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Not taken yet</span>
                                                )}
                                            </td>

                                            {/* 5. Smart Action Routing (Start / Retake / Locked Out) */}
                                            <td className="p-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => setActiveQuizId(quiz.id)}
                                                        disabled={isLockedOut || (isPastDue && !hasTaken)}
                                                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition w-full shadow-sm ${isLockedOut
                                                                ? "text-gray-400 bg-gray-100 cursor-not-allowed border"
                                                                : isPastDue
                                                                    ? "text-gray-400 bg-gray-50 cursor-not-allowed border-dashed"
                                                                    : hasTaken
                                                                        ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                                                                        : "text-white bg-green-600 hover:bg-green-700"
                                                            }`}
                                                    >
                                                        {isLockedOut ? (
                                                            <>
                                                                <Lock size={14} /> Maxed Out
                                                            </>
                                                        ) : hasTaken ? (
                                                            <>
                                                                <PlayCircle size={14} /> Retake Quiz
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle size={14} /> Start Quiz
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}