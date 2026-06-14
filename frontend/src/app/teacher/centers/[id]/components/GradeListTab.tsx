"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2Icon, Trash2, BookPlus, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
    CenterGrade,
    deleteCenterGrade,
    getCenterGrades,
} from "@/services/centerService";
import GradeModal from "./GradeModal";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
    centerId: number;
    isManager: boolean;
}

export default function GradeListTab({ centerId, isManager }: Props) {
    const rowsPerPage = 8; // Adjust rows per page here
    const [grades, setGrades] = useState<CenterGrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<CenterGrade | null>(null);
    const [deletingGrade, setDeletingGrade] = useState<CenterGrade | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getCenterGrades(centerId);
            setGrades(res);
        } catch (error) {
            console.error(error);
            toast.error("Cannot load grades.");
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const filteredGrades = useMemo(() => {
        const query = searchName.trim().toLowerCase();
        return grades.filter((grade) => !query || grade.name.toLowerCase().includes(query));
    }, [grades, searchName]);

    // Reset to page 1 when user searches
    useEffect(() => {
        setCurrentPage(1);
    }, [searchName, grades]);

    const totalPages = Math.max(1, Math.ceil(filteredGrades.length / rowsPerPage));

    // Handle array boundary edge cases
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Get slice of grades for current page
    const paginatedGrades = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredGrades.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredGrades, currentPage]);

    const handleDelete = async (grade: CenterGrade) => {
        try {
            await deleteCenterGrade(centerId, grade.id);
            toast.success("Grade deleted.");
            setDeletingGrade(null);
            fetch();
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Could not delete grade.";
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-sm font-medium text-[var(--color-text)] opacity-70 animate-pulse">
                Loading educational grades...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <GradeModal
                centerId={centerId}
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetch}
                grade={editingGrade}
            />

            <ConfirmModal
                isOpen={!!deletingGrade}
                title="Delete Grade level"
                message={`Are you sure you want to permanently delete "${deletingGrade?.name || ""}"? This action cannot be undone.`}
                confirmText="Delete"
                onClose={() => setDeletingGrade(null)}
                onConfirm={() => (deletingGrade ? handleDelete(deletingGrade) : undefined)}
            />

            {/* MODERNIZED HEADER STYLE BLOCK */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-main)]">
                            <BookPlus size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
                                Grades Directory
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Configure system age parameters and school structure tiers ({filteredGrades.length} listed)
                            </p>
                        </div>
                    </div>
                </div>

                {isManager && (
                    <button
                        onClick={() => {
                            setEditingGrade(null);
                            setModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 border border-transparent bg-[var(--color-main)] hover:opacity-95 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all outline-none shadow-xs shrink-0 self-start sm:self-auto"
                    >
                        <Plus size={16} className="stroke-[2.5]" />
                        Add Grade
                    </button>
                )}
            </div>

            {/* CONTAINER INPUT CONTEXT SEARCH */}
            <div className="relative max-w-md bg-gray-50 p-1.5 rounded-xl border border-gray-200/60">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search records by grade tier name..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition placeholder-gray-400 focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
                />
            </div>

            {/* CONDITIONAL SYSTEM RESPONSES */}
            {grades.length === 0 ? (
                <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <BookPlus size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium">No system grade categories configured yet.</p>
                </div>
            ) : filteredGrades.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200 shadow-xs">
                    No directory records match your active filtering parameters.
                </div>
            ) : (
                /* OPTIMIZED ROBUST TABLE DESIGN */
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                {/* FLAT, CONTEMPORARY TABLE HEADER */}
                                <thead className="bg-[var(--color-main)] border-b border-gray-200 text-white uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">Grade Level</th>
                                        <th className="px-6 py-3.5">Age Distribution</th>
                                        <th className="px-6 py-3.5">Description Summary</th>
                                        {isManager && <th className="px-6 py-3.5 text-right">Actions</th>}
                                    </tr>
                                </thead>

                                {/* HOVER DYNAMIC TABLE BODY */}
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {paginatedGrades.map((grade) => (
                                        <tr 
                                            key={grade.id} 
                                            className="transition-colors duration-150 hover:bg-gray-50/40 group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-main)] tracking-wide">
                                                    {grade.name}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-[var(--color-text)]">
                                                {grade.fromAge != null && grade.toAge != null ? (
                                                    <span className="bg-gray-100/80 px-2 py-1 rounded-md border border-gray-200/50 text-gray-600">
                                                        {grade.fromAge} – {grade.toAge} yrs
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-normal italic">Unspecified</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-500 max-w-sm">
                                                <p className={grade.description ? "truncate font-medium text-gray-600" : "italic text-gray-400"}>
                                                    {grade.description || "No supplemental details document provided."}
                                                </p>
                                            </td>

                                            {isManager && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                                    <div className="flex justify-end items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {/* DISTINCT ACTIONS MATRIX */}
                                                        <button
                                                            onClick={() => {
                                                                setEditingGrade(grade);
                                                                setModalOpen(true);
                                                            }}
                                                            className="p-1.5 border border-gray-200 bg-white text-gray-500 rounded-md hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all outline-none"
                                                            title="Modify Configuration"
                                                        >
                                                            <Edit2Icon size={20} className="stroke-[2.5]" />
                                                        </button>

                                                        <button
                                                            onClick={() => setDeletingGrade(grade)}
                                                            className="p-1.5 border border-gray-200 bg-white text-gray-400 rounded-md hover:text-[var(--color-alert)] hover:bg-red-50 hover:border-red-200 transition-all outline-none"
                                                            title="Remove Tier Configuration"
                                                        >
                                                            <Trash2 size={20} className="stroke-[2.5]" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PAGINATION PANEL FOOTER */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between text-xs">
                        <p className="font-medium text-gray-500">
                            Showing <span className="font-bold text-[var(--color-text)]">{(currentPage - 1) * rowsPerPage + 1}</span> -{" "}
                            <span className="font-bold text-[var(--color-text)]">{Math.min(currentPage * rowsPerPage, filteredGrades.length)}</span> of{" "}
                            <span className="font-bold text-[var(--color-text)]">{filteredGrades.length}</span> entries
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white select-none outline-none"
                            >
                                Previous
                            </button>

                            <span className="font-bold text-gray-600 min-w-[70px] text-center">
                                Page {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white select-none outline-none"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}