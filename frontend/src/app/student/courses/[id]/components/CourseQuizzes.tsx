"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    BrainCircuit, 
    Search, 
    Loader2, 
    PlayCircle, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    Lock,
    ChevronLeft,
    ChevronRight,
    Award,
    Inbox
} from "lucide-react";
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

const ITEMS_PER_PAGE = 5;

export default function CourseQuizzes({ courseId, readOnly = false }: Props) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const quizRes = await api.get(`/quizzes/course/${courseId}`);
            setQuizzes(quizRes.data || []);
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

    // Reset to first page when search criteria matches change
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Calculate score color threshold based on percentage performance
    const getScoreColorClass = (score: number | null, total: number | null) => {
        if (score === null || total === null || total === 0) return "bg-gray-50 text-gray-600 border-gray-200";
        const percentage = (score / total) * 100;
        
        if (percentage >= 80) {
            return "bg-green-50 text-green-700 border-green-200";
        } else if (percentage >= 50) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        } else {
            return "bg-red-50 text-red-700 border-red-200";
        }
    };

    // Filter logic
    const filteredQuizzes = useMemo(() => {
        const rawList = Array.isArray(quizzes) ? quizzes : [];
        return rawList.filter((q) => q.title.toLowerCase().includes(keyword.toLowerCase()));
    }, [quizzes, keyword]);

    // Pagination splits
    const totalPages = Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE);
    const paginatedQuizzes = useMemo(() => {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuizzes.slice(offset, offset + ITEMS_PER_PAGE);
    }, [filteredQuizzes, currentPage]);

    if (activeQuizId) {
        return (
            <TakeQuizView
                quizId={activeQuizId}
                onBack={() => {
                    setActiveQuizId(null);
                    fetchData();
                }}
            />
        );
    }

    return (
        <div className="bg-white rounded-xl border border-[var(--color-main)]/20 shadow-sm mt-6 overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                        <BrainCircuit size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold leading-none">Available Course Quizzes</h3>
                        <p className="text-xs text-white/70 font-normal mt-1">
                            Assess your knowledge metrics and track attempt limitations
                        </p>
                    </div>
                </div>
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                    {quizzes.length} Total
                </span>
            </div>

            <div className="p-6 space-y-4">
                {/* SEARCH BAR */}
                <div className="relative max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[var(--color-main)] transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search quizzes by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10 outline-none transition-all"
                    />
                </div>

                {/* QUIZZES DATA CONTAINER */}
                <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-inner">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-gray-100">
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500">Quiz Title</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-48">Due Date</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-44 text-center">Attempts Progress</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-40 text-center">Highest Score</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-36 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <Loader2 size={26} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-400">Syncing live database records...</p>
                                    </td>
                                </tr>
                            ) : paginatedQuizzes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Inbox size={32} className="text-gray-300" />
                                            <p className="text-sm font-medium">
                                                {keyword ? "No quizzes match your search layout." : "No quizzes mapped yet."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedQuizzes.map((quiz) => {
                                    const isPastDue = new Date(quiz.dueDate) < new Date();
                                    const hasTaken = quiz.attemptsTaken > 0;
                                    const hasAttemptsLeft = quiz.maxAttempts === 0 || quiz.attemptsTaken < quiz.maxAttempts;
                                    const isLockedOut = !hasAttemptsLeft;
                                    const isCriticalOverdue = isPastDue && !hasTaken;

                                    return (
                                        <tr 
                                            key={quiz.id} 
                                            className={`hover:bg-gray-50/80 transition-colors group ${
                                                isCriticalOverdue ? 'bg-red-50/20 hover:bg-red-50/40' : ''
                                            }`}
                                        >
                                            {/* 1. Title & Evaluation Mode Badge */}
                                            <td className="p-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <span className="font-semibold text-gray-800 text-sm group-hover:text-[var(--color-main)] transition-colors">
                                                        {quiz.title}
                                                    </span>
                                                    {quiz.isGraded && (
                                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)]/20 w-fit">
                                                            <Award size={10} /> Graded
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 2. Due Date Column */}
                                            <td className="p-4 whitespace-nowrap">
                                                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                                    isCriticalOverdue ? "text-red-600 font-bold" : "text-gray-600"
                                                }`}>
                                                    <Clock size={14} className={isCriticalOverdue ? "text-red-500" : "text-[var(--color-main)]"} />
                                                    <span>{formatDate(quiz.dueDate)}</span>
                                                </div>
                                            </td>

                                            {/* 3. Attempts Limit Progression Counter */}
                                            <td className="p-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                                    isLockedOut 
                                                        ? "bg-red-50 text-red-700 border-red-100" 
                                                        : "bg-gray-100 text-gray-700 border-transparent"
                                                }`}>
                                                    {quiz.maxAttempts === 0
                                                        ? `${quiz.attemptsTaken} taken (∞ left)`
                                                        : `${quiz.attemptsTaken} / ${quiz.maxAttempts} used`
                                                    }
                                                </span>
                                            </td>

                                            {/* 4. Color-Coded Highest Grade Segment */}
                                            <td className="p-4 text-center whitespace-nowrap">
                                                {hasTaken ? (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-xs ${
                                                        getScoreColorClass(quiz.highestScore, quiz.totalQuestions)
                                                    }`}>
                                                        <CheckCircle size={13} />
                                                        {quiz.highestScore} / {quiz.totalQuestions}
                                                    </span>
                                                ) : isPastDue ? (
                                                    <span className="text-xs text-red-500 font-bold inline-flex items-center gap-1 bg-red-50 border border-red-200/40 px-2.5 py-1 rounded-xl">
                                                        <AlertTriangle size={13} /> Missed
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Not taken yet</span>
                                                )}
                                            </td>

                                            {/* 5. Custom Smart Interactive Actions Trigger */}
                                            <td className="p-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => !readOnly && setActiveQuizId(quiz.id)}
                                                    disabled={isLockedOut || isCriticalOverdue || readOnly}
                                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition w-full border shadow-sm active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        isLockedOut
                                                            ? "text-gray-400 bg-gray-100 border-gray-200"
                                                            : isCriticalOverdue
                                                                ? "text-gray-400 bg-gray-50 border-dashed border-gray-200"
                                                                : hasTaken
                                                                    ? "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                                                                    : "text-white bg-green-600 border-green-500 hover:bg-green-700"
                                                    }`}
                                                >
                                                    {isLockedOut ? (
                                                        <>
                                                            <Lock size={13} /> Maxed Out
                                                        </>
                                                    ) : hasTaken ? (
                                                        <>
                                                            <PlayCircle size={13} /> Retake
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle size={13} /> Start Quiz
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION LAYOUT STEP FOOTER */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500">
                            Showing page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> ({filteredQuizzes.length} total elements)
                        </p>
                        
                        <div className="inline-flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all border ${
                                        page === currentPage
                                            ? "bg-[var(--color-main)] border-[var(--color-main)] text-white shadow-sm"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}