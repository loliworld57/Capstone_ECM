"use client";

import { useState, useEffect } from "react";
import {
    BrainCircuit,
    Search,
    Plus,
    Trash2,
    Loader2,
    PlayCircle,
    BarChart2,
    Clock,
    Edit3,
    Sparkles,
    HelpCircle,
    Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import ConfirmModal from "@/components/ConfirmModal";
import CreateQuizModal from "./CreateQuizModal";
import TeacherQuizResultsView from "./TeacherQuizResultView";

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
    questionsCount: number;
}

export default function CourseQuizzes({ courseId, readOnly = false }: Props) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [materials, setMaterials] = useState<[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

    const [selectedQuizForReport, setSelectedQuizForReport] = useState<{ id: number; title: string } | null>(null);

    // Fetch Quizzes and Materials
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const quizRes = await api.get(`/quizzes/course/${courseId}`);
            setQuizzes(quizRes.data);

            // Fetch materials so we can pass them into the Create Quiz Modal
            if (!readOnly) {
                const matRes = await api.get(`/materials/course/${courseId}`);
                setMaterials(matRes.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load quizzes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "No due date";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredQuizzes = Array.isArray(quizzes)
        ? quizzes.filter((q) => q.title.toLowerCase().includes(keyword.toLowerCase()))
        : [];

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await api.delete(`/quizzes/${id}`);
            toast.success("Quiz deleted successfully!");
            setQuizzes((current) => current.filter((q) => q.id !== id));
        } catch (error) {
            console.error("Error deleting quiz:", error);
            toast.error("Error deleting quiz.");
        } finally {
            setDeletingId(null);
            setPendingDeleteId(null);
        }
    };

    const pendingDeleteQuiz = Array.isArray(quizzes)
        ? quizzes.find((q) => q.id === pendingDeleteId)
        : null;

    if (selectedQuizForReport) {
        return (
            <TeacherQuizResultsView
                quizId={selectedQuizForReport.id}
                quizTitle={selectedQuizForReport.title}
                onBack={() => setSelectedQuizForReport(null)}
            />
        );
    }

    return (
        <div className="w-full bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <ConfirmModal
                isOpen={!readOnly && pendingDeleteId !== null}
                title="Delete Quiz"
                message={`Are you sure you want to delete "${pendingDeleteQuiz?.title}"? All student attempts will be lost. This cannot be undone.`}
                confirmText="Delete"
                onClose={() => setPendingDeleteId(null)}
                onConfirm={() => (pendingDeleteId !== null ? handleDelete(pendingDeleteId) : undefined)}
            />

            {/* --- CREATE QUIZ MODAL --- */}
            {isCreateModalOpen && (
                <CreateQuizModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingQuizId(null);
                        fetchData();
                    }}
                    courseId={courseId}
                    existingMaterials={materials}
                    quizIdToEdit={editingQuizId}
                />
            )}

            {/* HEADER HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[var(--color-soft-white)] rounded-lg text-[var(--color-main)]">
                        <BrainCircuit size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold leading-none">Course Quizzes</h2>
                        <p className="text-xs text-zinc-200 mt-1">
                            {isLoading ? "Loading assessments..." : `${quizzes.length} available assessments`}
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-main)] hover:bg-[var(--color-main)] hover:text-white hover:border-white border-2 px-4 h-10 rounded-xl transition text-sm font-bold shadow-sm active:scale-[0.98]"
                    >
                        <Sparkles size={16} />
                        <span>Create AI Quiz</span>
                    </button>
                )}
            </div>

            <div className="p-6">
                {/* SEARCH BAR BAR */}
                <div className="mb-6 relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search quizzes by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 h-11 text-sm border border-zinc-200 rounded-xl focus:border-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-100 transition-all"
                    />
                </div>

                {/* Loading state placeholders */}
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-11 bg-zinc-50 border border-zinc-200 rounded-xl" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-zinc-50/50 border border-zinc-100 rounded-xl" />
                        ))}
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    /* Clean Empty States layout */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 px-4 text-center">
                        <div className="p-3 bg-white border border-zinc-200 rounded-xl text-zinc-400 mb-3 shadow-sm">
                            {keyword ? <Search size={22} /> : <Inbox size={22} />}
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-800">
                            {keyword ? "No matching quizzes found" : "No quizzes assignment yet"}
                        </h3>
                        <p className="text-xs text-zinc-500 max-w-xs mt-1">
                            {keyword 
                                ? "We couldn't find any results matching your current search criteria." 
                                : "Get started by generating complete interactive test sessions using AI."}
                        </p>
                    </div>
                ) : (
                    /* GRID LAYOUT DATA TABLE */
                    <div className="overflow-hidden border border-zinc-200 rounded-xl bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-[var(--color-main)] border-b border-zinc-200 text-[var(--color-soft-white)] font-semibold">
                                        <th className="p-4">Quiz Title</th>
                                        <th className="p-4 w-52">Due Date</th>
                                        <th className="p-4 w-44 text-center">Attempts Allowance</th>
                                        <th className="p-4 w-48 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredQuizzes.map((quiz) => (
                                        <tr key={quiz.id} className="hover:bg-zinc-50 transition-colors group">
                                            {/* Quiz Title details */}
                                            <td className="p-4">
                                                <div className="flex items-start gap-2.5">
                                                    <div>
                                                        <div className="font-semibold text-[var(--color-text)]">{quiz.title}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Due Date block status */}
                                            <td className="p-4 text-zinc-600 font-medium whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 text-[var(--color-main)] bg-zinc-50 border border-zinc-200/60 rounded-md px-2 py-1 text-xs">
                                                    <Clock size={13} className="text-zinc-400" />
                                                    <span>{formatDate(quiz.dueDate)}</span>
                                                </div>
                                            </td>

                                            {/* Attempts Limits constraints styling badges */}
                                            <td className="p-4 text-center whitespace-nowrap">
                                                {quiz.maxAttempts === 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                                                        Unlimited
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/50">
                                                        {quiz.maxAttempts} Times
                                                    </span>
                                                )}
                                            </td>

                                            {/* Unified Contextual Buttons layout actions row */}
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {readOnly ? (
                                                        /* Student execution trigger action button link */
                                                        <button className="inline-flex items-center justify-center gap-1.5 text-blue-700 hover:text-white hover:bg-blue-600 border border-blue-200 bg-blue-50/50 px-3 h-8.5 rounded-lg font-semibold text-xs transition-all active:scale-[0.97]">
                                                            <PlayCircle size={14} />
                                                            <span>Take Quiz</span>
                                                        </button>
                                                    ) : (
                                                        /* Faculty administrative actions dashboard links array */
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedQuizForReport({ id: quiz.id, title: quiz.title })}
                                                                className="hover:text-[var(--color-main)] inline-flex items-center justify-center gap-1 text-[var(--color-text)] border border-zinc-200 bg-white hover:border-[var(--color-main)] px-2.5 h-8.5 rounded-lg font-semibold text-xs shadow-xs transition"
                                                                title="View Results"
                                                            >
                                                                <BarChart2 size={20} />
                                                                <span>Results</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="hover:text-[var(--color-main)] inline-flex items-center justify-center gap-1 text-[var(--color-text)] border border-zinc-200 bg-white hover:border-[var(--color-main)] px-2.5 h-8.5 rounded-lg font-semibold text-xs shadow-xs transition"
                                                                title="Edit Quiz"
                                                                onClick={() => {
                                                                    setEditingQuizId(quiz.id);
                                                                    setIsCreateModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit3 size={20}/>
                                                                <span>Edit</span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setPendingDeleteId(quiz.id)}
                                                                disabled={deletingId === quiz.id}
                                                                className="inline-flex items-center justify-center w-8.5 h-8.5 text-zinc-400 hover:text-rose-600 border border-transparent hover:border-rose-200 hover:bg-rose-50/50 rounded-lg transition disabled:opacity-40"
                                                                title="Delete Quiz"
                                                            >
                                                                {deletingId === quiz.id ? (
                                                                    <Loader2 size={20} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={20} />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}