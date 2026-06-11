"use client";

import { useState, useEffect } from "react";
import {
    BrainCircuit,
    Search,
    Plus,
    Trash2,
    Loader2,
    PlayCircle,
    BarChart,
    Clock,
    Edit
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
        console.log("Quizzes updated:", quizzes);
    }, [quizzes]);

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
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm mt-6 overflow-hidden">

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
                        setEditingQuizId(null); // Clear editing status safely on close
                        fetchData();
                    }}
                    courseId={courseId}
                    existingMaterials={materials}
                    quizIdToEdit={editingQuizId}
                />
            )}

            {/* HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={18} />
                    Course Quizzes ({quizzes.length})
                </div>

                {!readOnly && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition text-sm font-bold shadow-sm"
                    >
                        <Plus size={16} /> ✨ Create AI Quiz
                    </button>
                )}
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
                                <th className="p-4 font-semibold w-48">Due Date</th>
                                <th className="p-4 font-semibold w-32 text-center">Settings</th>
                                <th className="p-4 font-semibold w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10">
                                        <Loader2 size={24} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-gray-500">Loading quizzes...</p>
                                    </td>
                                </tr>
                            ) : filteredQuizzes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-10 border-dashed">
                                        {keyword ? "No quizzes match your search." : "No quizzes created yet."}
                                    </td>
                                </tr>
                            ) : (
                                filteredQuizzes.map((quiz) => (
                                    <tr key={quiz.id} className="border-b last:border-0 border-gray-200 hover:bg-[var(--color-secondary)]/5 transition group">

                                        {/* Title */}
                                        <td className="p-4 font-semibold text-[var(--color-text)]">
                                            {quiz.title}
                                            {/* {quiz.isGraded && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Graded
                                                </span>
                                            )} */}
                                        </td>

                                        {/* Due Date */}
                                        <td className="p-4 text-gray-500 font-medium flex items-center gap-2">
                                            <Clock size={14} /> {formatDate(quiz.dueDate)}
                                        </td>

                                        {/* Settings (Attempts) */}
                                        <td className="p-4 text-center text-gray-500 text-xs font-semibold">
                                            {quiz.maxAttempts === 0 ? "Unlimited Attempts" : `${quiz.maxAttempts} Attempt(s)`}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {readOnly ? (
                                                    // STUDENT ACTIONS
                                                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition font-semibold">
                                                        <PlayCircle size={16} /> Take Quiz
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedQuizForReport({ id: quiz.id, title: quiz.title })}
                                                            className="flex items-center gap-1 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition font-semibold"
                                                            title="View Results"
                                                        >
                                                            <BarChart size={16} /> Results
                                                        </button>

                                                        <button
                                                            className="flex items-center gap-1 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition font-semibold"
                                                            title="Edit Quiz"
                                                            onClick={() => {
                                                                setEditingQuizId(quiz.id);
                                                                setIsCreateModalOpen(true);
                                                            }}
                                                        >
                                                            <Edit size={16} /> Edit
                                                        </button>

                                                        <button
                                                            onClick={() => setPendingDeleteId(quiz.id)}
                                                            disabled={deletingId === quiz.id}
                                                            className="p-2 text-red-500 hover:text-white hover:bg-red-500 border border-red-200 rounded-lg transition disabled:opacity-50"
                                                            title="Delete Quiz"
                                                        >
                                                            {deletingId === quiz.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}