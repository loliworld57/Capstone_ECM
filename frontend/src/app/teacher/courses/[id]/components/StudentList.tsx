"use client";

import { useState, useEffect } from "react";
import { getStudentsInCourse } from "@/services/courseService";
import { User as UserIcon, Search, ChevronLeft, ChevronRight, Copy, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
    courseId: number;
    readOnly?: boolean;
}

const ITEMS_PER_PAGE = 10;
type SortDirection = "none" | "asc" | "desc";

export default function StudentList({ courseId, readOnly }: Props) {
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [keyword, setKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Sorting & Clipboard Tracking States
    const [sortDirection, setSortDirection] = useState<SortDirection>("none");
    const [copiedText, setCopiedText] = useState<string | null>(null);

    useEffect(() => {
        loadEnrolled();
    }, [courseId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, sortDirection]);

    const loadEnrolled = async () => {
        try {
            setIsLoading(true);
            const data = await getStudentsInCourse(courseId);
            setEnrolledStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load students:", error);
            setEnrolledStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Clipboard Copy Helper Method
    const handleCopyToClipboard = (text: string) => {
        if (!text || text === "—") return;
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 1500);
    };

    // Sorting State Toggle Controller
    const handleSortToggle = () => {
        setSortDirection((prev) => {
            if (prev === "none") return "asc";
            if (prev === "asc") return "desc";
            return "none";
        });
    };

    // 1. Filter structural logic
    const filteredStudents = enrolledStudents.filter((student) => {
        if (!keyword.trim()) return true;

        const searchLower = keyword.toLowerCase();
        const studentName = `${student?.lastName || ""} ${student?.firstName || ""}`.toLowerCase();
        const studentEmail = (student?.email || "").toLowerCase();
        
        const studentPhone = (
            student?.phoneNumber || 
            student?.phone || 
            student?.mobile || 
            student?.tele || 
            student?.contact || 
            ""
        ).toLowerCase();

        return (
            studentName.includes(searchLower) || 
            studentEmail.includes(searchLower) || 
            studentPhone.includes(searchLower)
        );
    });

    // 2. Sort structural logic execution
    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (sortDirection === "none") return 0;
        
        const nameA = `${a?.lastName || ""} ${a?.firstName || ""}`.toLowerCase().trim();
        const nameB = `${b?.lastName || ""} ${b?.firstName || ""}`.toLowerCase().trim();

        if (sortDirection === "asc") {
            return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        } else {
            return nameB.localeCompare(nameA, undefined, { sensitivity: "base" });
        }
    });

    // 3. Calculate pagination index positions safely
    const totalPages = Math.max(1, Math.ceil((sortedStudents.length) / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-xl overflow-hidden">
            {/* COMPONENT SUBHEADER */}
            <div className="border-b border-[var(--color-text)]/10 px-6 py-4 flex items-center justify-between gap-4 bg-[var(--color-main)]/[0.01]">
                <div className="flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <UserIcon size={18} className="text-[var(--color-main)]" />
                    <h2>Enrolled Students</h2>
                    <span className="text-xs bg-[var(--color-main)]/10 text-[var(--color-main)] px-2 py-0.5 rounded-full font-semibold">
                        {enrolledStudents.length} Total
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* SEARCH INPUT BAR */}
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text)]/40">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search student profile by name, email, or phone..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-text)]/15 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] outline-none transition-all placeholder:text-[var(--color-text)]/30 text-[var(--color-text)] font-medium"
                    />
                </div>

                {/* STRUCTURAL DATA TABLE */}
                <div className="overflow-x-auto border border-[var(--color-text)]/10 rounded-xl">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-main)] text-[var(--color-soft-white)] border-b border-[var(--color-text)]/10 select-none">
                                <th className="p-4 font-bold w-20 text-center">Index</th>
                                <th 
                                    onClick={handleSortToggle}
                                    className="p-4 font-bold cursor-pointer hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Full Name</span>
                                        <span className="text-[var(--color-soft-white)] transition-colors">
                                            {sortDirection === "none" && <ArrowUpDown size={14} className="opacity-50" />}
                                            {sortDirection === "asc" && <ArrowUp size={14} />}
                                            {sortDirection === "desc" && <ArrowDown size={14} />}
                                        </span>
                                    </div>
                                </th>
                                <th className="p-4 font-bold">Email Address</th>
                                <th className="p-4 font-bold">Phone Number</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-text)]/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-[var(--color-text)]/40 py-12 font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[var(--color-main)] border-t-transparent rounded-full animate-spin" />
                                            <span>Querying student roster records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-[var(--color-text)]/40 py-12 font-medium bg-gray-50/30">
                                        {keyword ? "No operational records match your search parameters." : "No students are registered to this class module."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((student, index) => {
                                    const fullName = `${student?.lastName || ""} ${student?.firstName || ""}`.trim();
                                    const email = student?.email || "—";
                                    const activePhone = student?.phoneNumber || "—";

                                    return (
                                        <tr
                                            key={student?.id || index}
                                            className="text-[var(--color-text)] hover:bg-[var(--color-main)]/[0.01] transition-colors group"
                                        >
                                            <td className="p-4 text-center font-semibold text-[var(--color-text)]/40 bg-gray-50/20">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="p-4 font-bold tracking-tight">
                                                {fullName || "Unnamed Student"}
                                            </td>
                                            <td className="p-4 font-medium text-[var(--color-text)]/60">
                                                <div className="flex items-center justify-between gap-4 max-w-xs">
                                                    <span className="truncate">{email}</span>
                                                    {email !== "—" && (
                                                        <button
                                                            onClick={() => handleCopyToClipboard(email)}
                                                            className="text-[var(--color-text)]/30 hover:text-[var(--color-main)] p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            title="Copy Email"
                                                        >
                                                            {copiedText === email ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-[var(--color-text)]/60">
                                                <div className="flex items-center justify-between gap-4 max-w-[180px]">
                                                    <span>{activePhone}</span>
                                                    {activePhone !== "—" && (
                                                        <button
                                                            onClick={() => handleCopyToClipboard(activePhone)}
                                                            className="text-[var(--color-text)]/30 hover:text-[var(--color-main)] p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            title="Copy Phone Number"
                                                        >
                                                            {copiedText === activePhone ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
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
                </div>

                {/* ✅ IMPROVED PAGINATION SYSTEM CONTROLS */}
                {!isLoading && sortedStudents.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[var(--color-text)]/5">
                        <p className="text-xs font-semibold text-[var(--color-text)]/50">
                            Showing <span className="text-[var(--color-text)]">{startIndex + 1}</span> to{" "}
                            <span className="text-[var(--color-text)]">
                                {Math.min(endIndex, filteredStudents.length)}
                            </span>{" "}
                            of <span className="text-[var(--color-text)]">{filteredStudents.length}</span> candidates
                        </p>
                        
                        {/* Only render action controls if there is actually more than 1 page to browse */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-[var(--color-text)]/15 text-[var(--color-text)]/70 hover:border-[var(--color-main)] hover:text-[var(--color-main)] transition-all bg-white disabled:opacity-40 disabled:hover:border-[var(--color-text)]/15 disabled:hover:text-[var(--color-text)]/70 disabled:cursor-not-allowed active:scale-95"
                                >
                                    <ChevronLeft size={14} className="stroke-[2.5]" />
                                    Previous
                                </button>
                                
                                <div className="text-xs font-bold text-[var(--color-text)]/60 px-3">
                                    Page {currentPage} of {totalPages}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-[var(--color-text)]/15 text-[var(--color-text)]/70 hover:border-[var(--color-main)] hover:text-[var(--color-main)] transition-all bg-white disabled:opacity-40 disabled:hover:border-[var(--color-text)]/15 disabled:hover:text-[var(--color-text)]/70 disabled:cursor-not-allowed active:scale-95"
                                >
                                    Next
                                    <ChevronRight size={14} className="stroke-[2.5]" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}