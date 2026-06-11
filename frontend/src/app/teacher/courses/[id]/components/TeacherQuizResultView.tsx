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
    ChevronRight
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

    // Format utility for submission dates
    const formatDateTime = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Filter roster rows dynamically based on name search string
    const filteredRoster = useMemo(() => {
        if (!report) return [];
        return report.studentResults.filter(row =>
            row.studentName.toLowerCase().includes(keyword.toLowerCase()) ||
            row.email.toLowerCase().includes(keyword.toLowerCase())
        );
    }, [report, keyword]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredRoster.length / rowsPerPage) || 1;

    const paginatedRoster = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredRoster.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredRoster, currentPage]);

    if (isLoading) {
        return (
            <div className="p-12 text-center text-gray-500 bg-white border border-[var(--color-main)] rounded-xl mt-6">
                <Loader2 size={28} className="animate-spin text-[var(--color-main)] mx-auto mb-2" />
                <p className="text-sm font-medium">Assembling live class score evaluations...</p>
            </div>
        );
    }

    const totalQuestions = report?.totalQuestions || 0;

    return (
        <div className="space-y-6 mt-6 animate-fadeIn">
            {/* BACK BUTTON ACTION BAR */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white border px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-3xs"
                >
                    <ArrowLeft size={14} /> Back to Quizzes
                </button>
                <div>
                    <h2 className="text-xl font-extrabold text-[var(--color-text)]">{quizTitle}</h2>
                    <p className="text-xs text-gray-400 font-medium">Class Performance Analytics & Grade Registry</p>
                </div>
            </div>

            {/* CLASS PERFORMANCE SCOREBOARD STATS HERO BLOCKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-3xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[var(--color-main)]/10 text-[var(--color-main)]">
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Class Average</span>
                        <span className="text-2xl font-black text-gray-900 mt-0.5">
                            {report ? report.averageScore : 0} <span className="text-xs text-gray-400 font-normal">/ {totalQuestions} pts</span>
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-3xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                        <Users size={22} />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Turned In</span>
                        <span className="text-2xl font-black text-blue-900 mt-0.5">
                            {report ? report.totalSubmissions : 0} <span className="text-xs text-gray-400 font-normal">Students</span>
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-3xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-50 text-green-600">
                        <Trophy size={22} />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Highest Score</span>
                        <span className="text-2xl font-black text-green-900 mt-0.5">
                            {report ? report.highestScore : 0} <span className="text-xs text-gray-400 font-normal">/ {totalQuestions} pts</span>
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-3xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-50 text-red-600">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Lowest Score</span>
                        <span className="text-2xl font-black text-red-900 mt-0.5">
                            {report ? report.lowestScore : 0} <span className="text-xs text-gray-400 font-normal">/ {totalQuestions} pts</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN ROSTER SECTION CONTAINER */}
            <div className="bg-white border border-[var(--color-main)] shadow-sm rounded-xl overflow-hidden">
                <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="font-bold text-[var(--color-text)] flex items-center gap-2">
                        <Users size={16} className="text-[var(--color-main)]" />
                        Student Grade Registry ({filteredRoster.length})
                    </div>

                    {/* IN-TABLE INSTANT ROSTER FILTER */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={14} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by student name..."
                            value={keyword}
                            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-[var(--color-main)] transition"
                        />
                    </div>
                </div>

                {/* HISTORICAL ROSTER DATA TABLE CONTAINER */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse bg-white">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 border-b font-bold text-xs uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Student Profile</th>
                                <th className="p-4 text-center w-36">Attempts Run</th>
                                <th className="p-4 text-center w-44">Last Active Timestamp</th>
                                <th className="p-4 text-center w-36">Best Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRoster.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-500 py-12 italic">
                                        {keyword ? "No student results match your tracking input filter criteria." : "No student submission record rows found for this exam layout yet."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRoster.map((row, index) => {
                                    const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                                    return (
                                        <tr key={row.studentId} className="border-b last:border-0 hover:bg-gray-50/50 transition font-medium">
                                            <td className="p-4 text-center text-gray-400 font-mono text-xs">{globalIndex}</td>
                                            <td className="p-4">
                                                <div className="text-gray-900 font-bold text-base">{row.studentName}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 font-normal">
                                                    <Mail size={12} /> {row.email}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 font-bold rounded-full text-xs border">
                                                    {row.attemptsTaken} used
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-500 text-xs whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {formatDateTime(row.lastSubmittedAt)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-black shadow-3xs">
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

                {/* TABLE PAGINATION DRAWER CONTROL */}
                {filteredRoster.length > rowsPerPage && (
                    <div className="bg-gray-50 px-5 py-3.5 border-t flex items-center justify-between text-xs font-semibold text-gray-500">
                        <div>
                            Showing <span className="font-bold">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                            <span className="font-bold">{Math.min(currentPage * rowsPerPage, filteredRoster.length)}</span> of{" "}
                            <span className="font-bold">{filteredRoster.length}</span> students
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 border bg-white rounded-md hover:bg-gray-50 disabled:opacity-40 transition disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <div className="px-3 py-1 bg-white border rounded-md shadow-3xs font-bold text-gray-700">
                                Page {currentPage} of {totalPages}
                            </div>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border bg-white rounded-md hover:bg-gray-50 disabled:opacity-40 transition disabled:cursor-not-allowed"
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