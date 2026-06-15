"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    ClipboardList,
    Search,
    Plus,
    Download,
    Trash2,
    Loader2,
    X,
    Clock,
    Eye,
    Paperclip,
    ArrowUpDown,
    Users,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    SlidersHorizontal
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';
import AssignmentForm from "./AddAssignmentForm";
import AssignmentDetailModal from "./AssignmentDetail";

interface Props {
    courseId: number;
    readOnly?: boolean;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    fileUrl: string | null;
    fileName: string | null;
    createdDate: string;
}

type SortField = 'title' | 'createdDate';
type SortOrder = 'asc' | 'desc';

export default function CourseAssignments({ courseId, readOnly = false }: Props) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Combined Sorting State
    const [sortField, setSortField] = useState<SortField>('createdDate');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [submissionCounts, setSubmissionCounts] = useState<Record<number, number>>({});

    // Modal Management
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [viewSubmissionsId, setViewSubmissionsId] = useState<number | null>(null);

    // Fetch assignments list from Backend
    const fetchAssignments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/assignments/course/${courseId}`);
            const data = response.data || [];
            setAssignments(data);

            // Fetch submission counts dynamically in parallel 
            const counts: Record<number, number> = {};
            await Promise.all(
                data.map(async (assignment: Assignment) => {
                    try {
                        const subResponse = await api.get(`/assignments/${assignment.id}/submissions`);
                        counts[assignment.id] = subResponse.data.length;
                    } catch (error) {
                        console.error(`Error fetching submissions for assignment ${assignment.id}:`, error);
                        counts[assignment.id] = 0;
                    }
                })
            );
            setSubmissionCounts(counts);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast.error("Unable to load the assignments list.");
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            fetchAssignments();
            setCurrentPage(1); // Reset page on course shift
        }
    }, [courseId, fetchAssignments]);

    // Reset pagination to page 1 whenever the search keyword changes
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isOverdue = (dueDateStr: string) => {
        return new Date(dueDateStr).getTime() < new Date().getTime();
    };

    // Derived State: Filtering, Sorting, and Pagination
    const processedAssignments = useMemo(() => {
        let result = assignments.filter((a) =>
            a.title.toLowerCase().includes(keyword.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortField === 'title') {
                return sortOrder === 'asc'
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            } else {
                const dateA = new Date(a.createdDate).getTime();
                const dateB = new Date(b.createdDate).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        return result;
    }, [assignments, keyword, sortField, sortOrder]);

    const paginatedAssignments = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedAssignments.slice(startIndex, startIndex + pageSize);
    }, [processedAssignments, currentPage, pageSize]);

    const totalPages = Math.ceil(processedAssignments.length / pageSize) || 1;

    const stats = useMemo(() => {
        const total = assignments.length;
        const overdueCount = assignments.filter(a => isOverdue(a.dueDate)).length;
        return { total, overdueCount };
    }, [assignments]);

    const executeDelete = async () => {
        if (confirmDeleteId === null) return;

        setDeletingId(confirmDeleteId);
        try {
            await api.delete(`/assignments/${confirmDeleteId}`);
            toast.success("Assignment deleted successfully!");
            setAssignments(assignments.filter(a => a.id !== confirmDeleteId));
            if (paginatedAssignments.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        } catch (error) {
            console.error("Error deleting assignment:", error);
            toast.error("Error deleting assignment.");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 m-4">
            {/* --- METRICS SUB-DASHBOARD --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all duration-200">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:scale-105 transition-all duration-200 shadow-sm text-slate-500">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Total Assignments</p>
                        <h4 className="text-2xl font-bold text-slate-800">{stats.total}</h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all duration-200">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:scale-105 transition-all duration-200 shadow-sm text-slate-500">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Total Submissions</p>
                        <h4 className="text-2xl font-bold text-slate-800">
                            {Object.values(submissionCounts).reduce((a, b) => a + b, 0)}
                        </h4>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 sm:col-span-2 md:col-span-1 group hover:shadow-md transition-all duration-200">
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 group-hover:bg-white group-hover:scale-105 transition-all duration-200 shadow-sm text-rose-500">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Overdue Tasks</p>
                        <h4 className="text-2xl font-bold text-rose-600">{stats.overdueCount}</h4>
                    </div>
                </div>
            </div>

            {/* MAIN LAYER WITH APPLIED THEMING */}
            <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-md overflow-hidden transition-all duration-300">

                {/* --- DELETE CONFIRM MODAL --- */}
                {confirmDeleteId !== null && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Assignment?</h3>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Are you sure you want to delete this assignment? All student submissions will also be permanently deleted. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deletingId !== null}
                                    className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    disabled={deletingId !== null}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40"
                                >
                                    {deletingId !== null ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {deletingId !== null ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- REMAINING INNER MODALS --- */}
                {selectedAssignment && (
                    <AssignmentDetailModal
                        courseId={courseId}
                        assignment={selectedAssignment}
                        readOnly={readOnly}
                        onClose={() => setSelectedAssignment(null)}
                        onRefresh={() => {
                            fetchAssignments();
                            setSelectedAssignment(null);
                        }}
                    />
                )}

                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-[var(--color-main)]">
                                <h2 className="font-bold text-white text-lg">Create Assignment</h2>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-white hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all duration-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-2">
                                <AssignmentForm
                                    courseId={courseId}
                                    onSuccess={() => {
                                        setIsAddModalOpen(false);
                                        fetchAssignments();
                                    }}
                                    onCancel={() => setIsAddModalOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {viewSubmissionsId !== null && (
                    <SubmissionsModal
                        assignmentId={viewSubmissionsId}
                        courseId={courseId}
                        onClose={() => setViewSubmissionsId(null)}
                        onRefresh={fetchAssignments}
                    />
                )}

                {/* THEMED MAIN HEADER */}
                <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5 font-semibold tracking-wide">
                        <ClipboardList size={20} className="opacity-90" />
                        <span>Course Assignments</span>
                        <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-medium">{assignments.length}</span>
                    </div>

                    {!readOnly && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-white text-[var(--color-main)] hover:bg-slate-50 active:scale-95 px-4 py-2 rounded-xl transition-all duration-200 text-xs font-bold shadow-sm"
                        >
                            <Plus size={16} strokeWidth={2.5} /> Create Assignment
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* SEARCH FILTERS */}
                    <div className="mb-5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search assignments by title..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-200 rounded-xl focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 outline-none transition-all duration-200"
                        />
                    </div>

                    {/* DYNAMIC CONTENT AND ASSIGNMENTS TABLE */}
                    <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-inner bg-white">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                                    <th className="p-4 select-none cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors duration-150" onClick={() => handleSort('title')}>
                                        <div className="flex items-center gap-1.5">
                                            <span>Assignment Title</span>
                                            <ArrowUpDown size={14} className={`transition-all duration-150 ${sortField === 'title' ? 'text-[var(--color-main)]' : 'text-slate-400 opacity-40'}`} />
                                        </div>
                                    </th>
                                    <th className="p-4 w-32 text-center select-none">Submissions</th>
                                    <th className="p-4 w-52 select-none cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors duration-150" onClick={() => handleSort('createdDate')}>
                                        <div className="flex items-center gap-1.5">
                                            <span>Due Date</span>
                                            <ArrowUpDown size={14} className={`transition-all duration-150 ${sortField === 'createdDate' ? 'text-[var(--color-main)]' : 'text-slate-400 opacity-40'}`} />
                                        </div>
                                    </th>
                                    <th className="p-4 w-52 text-center select-none">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12">
                                            <Loader2 size={28} className="animate-spin text-[var(--color-main)] mx-auto mb-3 opacity-80" />
                                            <p className="text-slate-400 font-medium text-xs tracking-wide">Loading assignment structure...</p>
                                        </td>
                                    </tr>
                                ) : processedAssignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-slate-400 py-12 text-sm">
                                            {keyword ? "No assignments match your search." : "No assignments uploaded yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAssignments.map((assignment) => {
                                        const overdue = isOverdue(assignment.dueDate);
                                        const submittedCount = submissionCounts[assignment.id] || 0;
                                        return (
                                            <tr key={assignment.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1.5 max-w-xs md:max-w-md lg:max-w-xl">
                                                        <button
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                            className="text-left font-medium text-slate-700 hover:text-[var(--color-main)] hover:underline transition-colors duration-150 line-clamp-1 break-all"
                                                        >
                                                            {assignment.title}
                                                        </button>
                                                        {assignment.fileName && (
                                                            <a
                                                                href={assignment.fileUrl || "#"}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline w-fit bg-blue-50/50 px-2.5 py-1 rounded-xl border border-blue-100 shadow-sm"
                                                            >
                                                                <Paperclip size={12} />
                                                                <span className="line-clamp-1 break-all">{assignment.fileName}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 group-hover:bg-white text-xs font-bold transition-all min-w-[40px]">
                                                        {submittedCount}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-rose-500' : 'text-slate-500'}`}>
                                                        <Clock size={13} />
                                                        <span>{formatDateTime(assignment.dueDate)}</span>
                                                        {overdue && (
                                                            <span className="text-[10px] uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md font-bold">
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* --- ADDED: ASSIGNMENT DETAIL VIEW BUTTON --- */}
                                                        <button
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                                            title="View Details"
                                                        >
                                                            <Eye size={14} />
                                                            <span>Details</span>
                                                        </button>

                                                        <button
                                                            onClick={() => setViewSubmissionsId(assignment.id)}
                                                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                                            title="View Student Submissions"
                                                        >
                                                            {/* Note: changed icon to Users to avoid duplicating the Eye icon */}
                                                            <Users size={14} />
                                                            <span>Submissions</span>
                                                        </button>

                                                        {!readOnly && (
                                                            <button
                                                                onClick={() => setConfirmDeleteId(assignment.id)}
                                                                className="inline-flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50/30 p-2 text-rose-500 shadow-sm transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                                                title="Delete Assignment"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* PAGINATION FOOTER */}
                        {!isLoading && processedAssignments.length > 0 && (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 tracking-wide">
                                            Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                            <span className="font-semibold text-slate-700">
                                                {Math.min(currentPage * pageSize, processedAssignments.length)}
                                            </span>{" "}
                                            of <span className="font-semibold text-slate-700">{processedAssignments.length}</span> assignments
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 ${page === currentPage
                                                        ? "z-10 bg-[var(--color-main)] border-[var(--color-main)] text-white"
                                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center p-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

// Submissions Modal Component
function SubmissionsModal({ assignmentId, courseId, onClose, onRefresh }: { assignmentId: number; courseId: number; onClose: () => void; onRefresh: () => void }) {
    const [students, setStudents] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState<Record<number, boolean>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studentsResponse, submissionsResponse] = await Promise.all([
                api.get(`/courses/${courseId}/students`),
                api.get(`/assignments/${assignmentId}/submissions`)
            ]);
            setStudents(Array.from(studentsResponse.data || []));
            setSubmissions(submissionsResponse.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Unable to load students and submissions.");
        } finally {
            setLoading(false);
        }
    }, [courseId, assignmentId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGrade = async (submissionId: number, score: number, feedback: string) => {
        setGrading(prev => ({ ...prev, [submissionId]: true }));
        try {
            await api.put(`/assignments/submissions/${submissionId}/grade`, { score, feedback });
            toast.success("Submission graded successfully!");
            fetchData();
            onRefresh();
        } catch (error: any) {
            const backendMsg = error?.response?.data?.error;
            console.error("Error grading submission:", error);
            toast.error(backendMsg ? `Error: ${backendMsg}` : "Error grading submission.");
        } finally {
            setGrading(prev => ({ ...prev, [submissionId]: false }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">Student Submissions</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Manage evaluation pipelines and context verification records.</p>
                    </div>
                    <button onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Loading student profiles...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm font-medium">
                            No students enrolled in this course context setup.
                        </div>
                    ) : (
                        students.map((student) => {
                            const studentSubmission = submissions.find(
                                sub => sub?.studentId === student.id
                            );

                            return (
                                <StudentSubmissionItem
                                    key={student.id}
                                    student={student}
                                    submission={studentSubmission}
                                    onGrade={handleGrade}
                                    grading={grading[studentSubmission?.id] || false}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// Student Submission Item Component
function StudentSubmissionItem({ student, submission, onGrade, grading }: { student: any; submission?: any; onGrade: (id: number, score: number, feedback: string) => void; grading: boolean }) {
    const [score, setScore] = useState(submission?.score || '');
    const [feedback, setFeedback] = useState(submission?.feedback || '');
    const [showGradeForm, setShowGradeForm] = useState(false);

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const isLate = submission?.status === 'LATE';
    const hasSubmitted = !!submission;

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                <div className="text-left sm:text-right">
                    {hasSubmitted ? (
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 font-medium">Submitted: {formatDateTime(submission.submittedAt)}</p>
                            {isLate && <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">LATE</span>}
                        </div>
                    ) : (
                        <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">Pending submission</span>
                    )}
                </div>
            </div>

            {hasSubmitted && submission.fileUrl && (
                <div className="mb-4">
                    <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium bg-blue-50/40 border border-blue-100 px-2.5 py-1 rounded"
                    >
                        <Download size={14} /> {submission.fileName || "Download attachment"}
                    </a>
                </div>
            )}

            {hasSubmitted && submission.status === 'GRADED' ? (
                <div className="bg-green-50/50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="inline-flex items-center gap-1 font-bold text-green-800 text-sm">
                            <CheckCircle size={14} className="text-green-600" /> Score: {submission.score}
                        </span>
                        <button
                            onClick={() => setShowGradeForm(true)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Change Grade
                        </button>
                    </div>
                    {submission.feedback && (
                        <p className="text-xs text-gray-600 mt-1 pl-5">Feedback: <span className="italic">"{submission.feedback}"</span></p>
                    )}
                </div>
            ) : hasSubmitted ? (
                !showGradeForm && (
                    <button
                        onClick={() => setShowGradeForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm"
                    >
                        Grade Submission
                    </button>
                )
            ) : null}

            {showGradeForm && hasSubmitted && (
                <div className="mt-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="space-y-3 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Score</label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="Enter grade mark"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Feedback notes</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                rows={2}
                                placeholder="Add helpful assessment commentary..."
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => onGrade(submission.id, Number.isNaN(parseFloat(score)) ? 0 : parseFloat(score), feedback)}
                                disabled={grading}
                                className="inline-flex items-center justify-center min-w-[90px] bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {grading ? <Loader2 size={14} className="animate-spin" /> : 'Save Grade'}
                            </button>
                            <button
                                onClick={() => setShowGradeForm(false)}
                                className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}   