"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ArrowLeft,
    BarChart3,
    Users,
    Trophy,
    AlertCircle,
    Search,
    Loader2,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Inbox,
    User
} from "lucide-react";
import toast from "react-hot-toast";
import api from '@/utils/axiosConfig';

interface Props {
    quizId: number;
    quizTitle: string;
    onBack: () => void;
}

interface StudentResultRow {
    studentId: number;
    studentName: string;
    email: string;
    highestScore: number;
    attemptsTaken: number;
    lastSubmittedAt: string;
}

interface ReportData {
    averageScore: number;
    totalSubmissions: number;
    highestScore: number;
    lowestScore: number;
    totalQuestions: number;
    studentResults: StudentResultRow[];
}

export default function TeacherQuizResultsView({ quizId, quizTitle, onBack }: Props) {
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/quizzes/${quizId}/teacher-report`);
                setReport(response.data);
            } catch (error: any) {
                console.error("Error fetching quiz class report:", error);
                toast.error("Failed to load quiz performance analytics.");
            } finally {
                setIsLoading(false);
            }
        };

        if (quizId) fetchReportData();
    }, [quizId]);

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "No entry recorded";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredRoster = useMemo(() => {
        if (!report) return [];
        return report.studentResults.filter(row =>
            row.studentName.toLowerCase().includes(keyword.toLowerCase()) ||
            row.email.toLowerCase().includes(keyword.toLowerCase())
        );
    }, [report, keyword]);

    const totalPages = Math.ceil(filteredRoster.length / rowsPerPage) || 1;

    const paginatedRoster = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredRoster.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRoster, currentPage]);

    if (isLoading) {
        return (
            <div className="space-y-6 mt-6 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-4">
                    <div className="w-36 h-9 bg-zinc-100 rounded-lg" />
                    <div className="space-y-1.5">
                        <div className="h-6 bg-zinc-200 rounded w-1/4" />
                        <div className="h-3.5 bg-zinc-100 rounded w-1/6" />
                    </div>
                </div>
                {/* Cards Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-zinc-50 border border-zinc-100 rounded-xl" />
                    ))}
                </div>
                {/* Table Layout Container Skeleton */}
                <div className="border border-zinc-200 rounded-xl bg-white h-96" />
            </div>
        );
    }

    const totalQuestions = report?.totalQuestions || 0;

    return (
        <div className="space-y-6 m-6">
            {/* ACTION HEADER BAR */}
            <div className="flex flex-col gap-4">
                {/* Row 1: Back Button */}
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--color-text)] bg-white px-3 h-9 rounded-lg hover:underline active:scale-[0.98]"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Quizzes</span>
                    </button>
                </div>

                {/* Row 2: Title and Subtitle */}
                <div>
                    <h2 className="text-xl font-bold text-[var(--color-main)] tracking-tight">{quizTitle}</h2>
                    <p className="text-xs text-[var(--color-text)] font-medium mt-0.5">Class Performance Analytics & Grade Registry</p>
                </div>
            </div>

            {/* PERFORMANCE OVERVIEW INSIGHT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-xs flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-zinc-50 text-[var(--color-main)]">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <span className="block text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">Class Average</span>
                        <div className="text-xl font-bold text-[var(--color-text)] mt-0.5">
                            {report ? report.averageScore : 0} <span className="text-xs font-normal">/ {totalQuestions} pts</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-xs flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-zinc-50 text-[var(--color-main)]">
                        <Users size={20} />
                    </div>
                    <div>
                        <span className="block text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">Turned In</span>
                        <div className="text-xl font-bold text-[var(--color-text)] mt-0.5">
                            {report ? report.totalSubmissions : 0} <span className="text-xs font-normal">Students</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-xs flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <span className="block text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">Highest Score</span>
                        <div className="text-xl font-bold text-emerald-700 mt-0.5">
                            {report ? report.highestScore : 0} <span className="text-xs font-normal text-emerald-600/70">/ {totalQuestions} pts</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-xs flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <span className="block text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">Lowest Score</span>
                        <div className="text-xl font-bold text-rose-700 mt-0.5">
                            {report ? report.lowestScore : 0} <span className="text-xs font-normal text-rose-600/70">/ {totalQuestions} pts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CORE REGISTRY SECTION */}
            <div className="bg-white border border-zinc-100 shadow-xs rounded-xl overflow-hidden">
                <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/40">
                    <div className="font-semibold text-[var(--color-text)] flex items-center gap-2 text-sm">
                        <Users size={16} className="text-[var(--color-main)]" />
                        <span>Student Grade Registry ({filteredRoster.length})</span>
                    </div>

                    {/* SEARCH FILTER BOX */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-main)]">
                            <Search size={14} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by student details..."
                            value={keyword}
                            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 h-9 text-xs border border-zinc-200 rounded-lg outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-zinc-100 transition-all text-[var(--color-text)]"
                        />
                    </div>
                </div>

                {/* RECORD STRUCT TABLE LAYOUT */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-[var(--color-main)] border-b border-zinc-100 text-[var(--color-soft-white)] font-semibold text-xs uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Student Profile</th>
                                <th className="p-4 text-center w-36">Attempts Run</th>
                                <th className="p-4 text-center w-52">Last Active Timestamp</th>
                                <th className="p-4 text-center w-36">Best Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedRoster.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                                            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 mb-2.5">
                                                <Inbox size={20} />
                                            </div>
                                            <h4 className="text-sm font-medium text-[var(--color-text)]">No student profiles found</h4>
                                            <p className="text-xs text-[var(--color-text)] opacity-60 max-w-xs mt-0.5">
                                                {keyword ? "No records matched your specific filter input context details." : "This assessment roster does not have submission lines recorded yet."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRoster.map((row, index) => {
                                    const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                                    return (
                                        <tr key={row.studentId} className="hover:bg-zinc-50/30 transition-colors group">
                                            <td className="p-4 text-center text-[var(--color-text)] font-mono text-xs font-medium">{globalIndex}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[var(--color-main)] group-hover:bg-zinc-100 transition-colors shrink-0">
                                                        <User size={15} />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[var(--color-text)] text-sm leading-tight">{row.studentName}</div>
                                                        <div className="text-xs text-[var(--color-text)] opacity-60 flex items-center gap-1 mt-1 font-normal">
                                                            <Mail size={12} className="opacity-50" />
                                                            <span>{row.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 bg-zinc-50 border border-zinc-100 text-[var(--color-text)] font-medium rounded-full text-xs">
                                                    {row.attemptsTaken} used
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-[var(--color-text)] text-xs whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 bg-zinc-50/50 border border-zinc-100/60 px-2 py-1 rounded-md font-medium">
                                                    <Calendar size={13} className="text-[var(--color-main)]" />
                                                    <span>{formatDateTime(row.lastSubmittedAt)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-50 border border-zinc-200 text-[var(--color-main)] rounded-md text-xs font-bold">
                                                    {row.highestScore} / {totalQuestions}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* INFRASTRUCTURE PAGINATION DRAWER FOOTER */}
                {filteredRoster.length > rowsPerPage && (
                    <div className="bg-zinc-50/50 px-5 py-3 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-[var(--color-text)]">
                        <div>
                            Showing <span className="font-semibold">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                            <span className="font-semibold">{Math.min(currentPage * rowsPerPage, filteredRoster.length)}</span> of{" "}
                            <span className="font-semibold">{filteredRoster.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 border border-zinc-200 bg-white rounded-md hover:bg-zinc-50 disabled:opacity-40 transition disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <div className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md font-bold">
                                Page {currentPage} of {totalPages}
                            </div>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-zinc-200 bg-white rounded-md hover:bg-zinc-50 disabled:opacity-40 transition disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}