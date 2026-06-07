"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ClipboardList,
    Search,
    Loader2,
    Clock,
    Eye,
    CheckCircle2,
    XCircle,
    Filter
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

export default function StudentCourseAssignments({ courseId }: Props) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);

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

            // TODO: when backend provides student submission status per assignment, remove this mock.
            // For now we keep real assignment data only.
            setAssignments(response.data);

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

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const isOverdue = (dueDateStr: string) => {
        return new Date(dueDateStr).getTime() < new Date().getTime();
    };

    const filteredAssignments = assignments.filter((a) =>
        a.title.toLowerCase().includes(keyword.toLowerCase()) &&
        (!showOverdueOnly || isOverdue(a.dueDate))
    );

    return (
        <div className="bg-[var(--color-soft-white)] rounded-xl border border-[var(--color-main)] shadow-sm mt-6 overflow-hidden">

            {/* HEADER */}
            <div className="bg-[var(--color-main)] text-white px-6 py-4 flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                    <ClipboardList size={18} />
                    Assignments ({assignments.length})
                </div>

                <button
                    onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm font-bold ${showOverdueOnly ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'
                        }`}
                    title={showOverdueOnly ? 'Show all assignments' : 'Show overdue only'}
                >
                    <Filter size={16} /> {showOverdueOnly ? 'Overdue Only' : 'All Assignments'}
                </button>
            </div>

            <div className="p-6">
                {/* SEARCH BAR */}
                <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search assignments by title..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none transition"
                    />
                </div>

                {/* ASSIGNMENTS TABLE */}
                <div className="overflow-x-auto border border-[var(--color-main)] rounded-lg">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] border-b border-[var(--color-main)]">
                                <th className="p-4 font-semibold">Assignment Title</th>
                                <th className="p-4 font-semibold w-40 text-center">Status</th>
                                <th className="p-4 font-semibold w-56">Due Date</th>
                                <th className="p-4 font-semibold w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-10">
                                        <Loader2 size={24} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                                        <p className="text-gray-500">Loading assignments...</p>
                                    </td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 py-10 border-dashed">
                                        No assignments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => {
                                    const overdue = isOverdue(assignment.dueDate);
                                    const submitted =
                                        assignment.submissionStatus === "SUBMITTED" ||
                                        assignment.submissionStatus === "SCORED" ||
                                        assignment.submissionStatus === "LATE";
                                    return (
                                        <tr key={assignment.id} className="border-b last:border-0 border-gray-200 hover:bg-[var(--color-secondary)]/5 transition group">
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => router.push(`/student/courses/${courseId}/assignments/${assignment.id}`)}
                                                        className="font-bold text-[var(--color-text)] text-base text-left hover:text-[var(--color-main)] hover:underline transition"
                                                    >
                                                        {assignment.title}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* STATUS COLUMN */}
                                            <td className="p-4 text-center">
                                                {submitted ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                            <CheckCircle2 size={14} /> Submitted
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {assignment.submittedAt ? formatDateTime(assignment.submittedAt) : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                        <XCircle size={14} /> Not Submitted
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                <div className={`flex items-center gap-1.5 font-medium ${overdue && !submitted ? 'text-red-600' : 'text-gray-600'}`}>
                                                    <Clock size={16} className={overdue && !submitted ? 'text-red-500' : 'text-[var(--color-main)]'} />
                                                    {formatDateTime(assignment.dueDate)}
                                                </div>
                                                {(overdue && !submitted) && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase mt-1 inline-block">Overdue</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => router.push(`/student/courses/${courseId}/assignments/${assignment.id}`)}
                                                        className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition"
                                                        title="View Assignment"
                                                    >
                                                        <Eye size={18} />
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