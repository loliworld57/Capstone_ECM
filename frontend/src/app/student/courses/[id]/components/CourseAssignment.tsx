"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardList,
    Search,
    Loader2,
    Clock,
    Eye,
    CheckCircle2,
    XCircle,
    Filter,
    AlertCircle,
    Award,
    ChevronLeft,
    ChevronRight,
    Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';

interface Props {
    courseId: number;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    fileUrl: string | null;
    fileName: string | null;
    createdDate: string;
    submissionStatus?: "SUBMITTED" | "NOT_SUBMITTED" | "LATE" | "SCORED";
    submittedAt?: string | null;
}

const ITEMS_PER_PAGE = 5;

export default function StudentCourseAssignments({ courseId }: Props) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch assignments
    const fetchAssignments = async () => {
        setIsLoading(true);
        try {
            const user = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            const response = await api.get(
                `/assignments/course/${courseId}/student/${user.id}`
            );
            setAssignments(response.data || []);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast.error("Unable to load the assignments list.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchAssignments();
    }, [courseId]);

    // Reset pagination window when matching filters update
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, showOverdueOnly]);

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const isOverdue = (dueDateStr: string) => {
        return new Date(dueDateStr).getTime() < new Date().getTime();
    };

    // Filtered Output Set
    const filteredAssignments = useMemo(() => {
        return assignments.filter((a) => {
            const matchesKeyword = a.title.toLowerCase().includes(keyword.toLowerCase());
            const matchesOverdue = !showOverdueOnly || (isOverdue(a.dueDate) && !["SUBMITTED", "SCORED", "LATE"].includes(a.submissionStatus || ""));
            return matchesKeyword && matchesOverdue;
        });
    }, [assignments, keyword, showOverdueOnly]);

    // Pagination Calculations
    const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
    const paginatedAssignments = useMemo(() => {
        const startOffset = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAssignments.slice(startOffset, startOffset + ITEMS_PER_PAGE);
    }, [filteredAssignments, currentPage]);

    // Render helper for dynamic semantic assignment status badges
    const renderStatusBadge = (status: string, overdue: boolean) => {
        switch (status) {
            case "SCORED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-positive)]/10 text-[var(--color-positive)] border border-[var(--color-positive)] shadow-sm">
                        <Award size={13} /> Graded
                    </span>
                );
            case "SUBMITTED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)] shadow-sm">
                        <CheckCircle2 size={13} /> Submitted
                    </span>
                );
            case "LATE":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                        <Clock size={13} /> Submitted Late
                    </span>
                );
            case "NOT_SUBMITTED":
            default:
                if (overdue) {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm animate-pulse">
                            <AlertCircle size={13} /> Missing / Overdue
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 shadow-sm">
                        <XCircle size={13} /> Not Submitted
                    </span>
                );
        }
    };

    return (
        <div className="bg-white rounded-xl border border-[var(--color-main)]/20 shadow-sm mt-6 overflow-hidden">
            
            {/* HEADER COMPONENT */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold leading-none">Course Assignments</h3>
                        <p className="text-xs text-white/70 font-normal mt-1">
                            Manage, track metrics, and submit course milestones
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all text-xs font-bold border active:scale-95 whitespace-nowrap self-end sm:self-auto ${
                        showOverdueOnly 
                            ? 'bg-red-500 border-red-400 hover:bg-red-600 text-white shadow-sm' 
                            : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                    }`}
                >
                    <Filter size={14} /> {showOverdueOnly ? 'Viewing Overdue Missing Only' : 'Filter Overdue Missing'}
                </button>
            </div>

            <div className="p-6 space-y-4">
                {/* INTERACTIVE SEARCH BAR */}
                <div className="relative group max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[var(--color-main)] transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tasks by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10 outline-none transition-all"
                    />
                </div>

                {/* STRUCTURAL CONTENT CONTROL NODE */}
                <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-inner">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-gray-100">
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500">Assignment Title</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-44 text-center">Status</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-56">Due Date</th>
                                <th className="p-4 font-bold tracking-wide uppercase text-[11px] text-gray-500 w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16">
                                        <Loader2 size={26} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-400">Fetching task items details...</p>
                                    </td>
                                </tr>
                            ) : paginatedAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Inbox size={32} className="text-gray-300" />
                                            <p className="text-sm font-medium">No recorded assignments match filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAssignments.map((assignment) => {
                                    const overdue = isOverdue(assignment.dueDate);
                                    const status = assignment.submissionStatus || "NOT_SUBMITTED";
                                    const submitted = ["SUBMITTED", "SCORED", "LATE"].includes(status);
                                    const isCriticalOverdue = overdue && !submitted;

                                    return (
                                        <tr 
                                            key={assignment.id} 
                                            className={`hover:bg-gray-50/80 transition-colors group ${
                                                isCriticalOverdue ? 'bg-red-50/20 hover:bg-red-50/40' : ''
                                            }`}
                                        >
                                            <td className="p-4">
                                                <button
                                                    onClick={() => router.push(`/student/courses/${courseId}/assignments/${assignment.id}`)}
                                                    className="font-semibold text-gray-800 text-sm text-left group-hover:text-[var(--color-main)] group-hover:underline transition-all block max-w-xs sm:max-w-md truncate"
                                                >
                                                    {assignment.title}
                                                </button>
                                            </td>

                                            <td className="p-4 text-center whitespace-nowrap">
                                                <div className="flex flex-col items-center gap-1">
                                                    {renderStatusBadge(status, overdue)}
                                                    {assignment.submittedAt && (
                                                        <span className="text-[10px] font-medium text-gray-400">
                                                            {formatDateTime(assignment.submittedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 whitespace-nowrap">
                                                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                                    isCriticalOverdue ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                    <Clock size={14} className={isCriticalOverdue ? 'text-red-500' : 'text-[var(--color-main)]'} />
                                                    {formatDateTime(assignment.dueDate)}
                                                </div>
                                            </td>

                                            <td className="p-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => router.push(`/student/courses/${courseId}/assignments/${assignment.id}`)}
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                                                        isCriticalOverdue
                                                            ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:text-[var(--color-main)] hover:border-[var(--color-main)]/30 hover:bg-[var(--color-main)]/5'
                                                    }`}
                                                >
                                                    <Eye size={13} /> View Task
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION DATA CONTROLS FOOTER */}
                {!isLoading && totalPages > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500">
                            Showing page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> ({filteredAssignments.length} total tasks)
                        </p>
                        <div className="inline-flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
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
                                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-sm"
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