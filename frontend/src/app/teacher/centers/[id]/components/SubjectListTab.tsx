"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2Icon, Trash2, BookA, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
    CenterSubject,
    deleteCenterSubject,
    getCenterSubjects,
} from "@/services/centerService";
import SubjectModal from "./SubjectModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface Props {
    centerId: number;
    isManager: boolean;
}

export default function SubjectListTab({ centerId, isManager }: Props) {
    const rowsPerPage = 8; // Adjust items per page here
    const [subjects, setSubjects] = useState<CenterSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<CenterSubject | null>(null);
    const [deletingSubject, setDeletingSubject] = useState<CenterSubject | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getCenterSubjects(centerId);
            setSubjects(res);
        } catch (error) {
            console.error(error);
            toast.error("Cannot load subjects.");
        } finally {
            setLoading(false);
        }
    }, [centerId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const filteredSubjects = useMemo(() => {
        const query = searchName.trim().toLowerCase();
        return subjects.filter((subject) => !query || subject.name.toLowerCase().includes(query));
    }, [subjects, searchName]);

    // Reset back to page 1 whenever search filters alter data matrices
    useEffect(() => {
        setCurrentPage(1);
    }, [searchName, subjects]);

    const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / rowsPerPage));

    // Handle array boundary edge cases
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Get slice of subjects for the current page grid row
    const paginatedSubjects = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredSubjects.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredSubjects, currentPage]);

    const handleCreate = () => {
        setEditingSubject(null);
        setModalOpen(true);
    };

    const handleEdit = (subject: CenterSubject) => {
        setEditingSubject(subject);
        setModalOpen(true);
    };

    const handleDelete = async (subject: CenterSubject) => {
        try {
            await deleteCenterSubject(centerId, subject.id);
            toast.success("Subject deleted.");
            setDeletingSubject(null);
            fetch();
        } catch (error: any) {
            const responseData = error?.response?.data;
            const message =
                responseData?.error ||
                responseData?.message ||
                (typeof responseData === "string" ? responseData : null) ||
                "Could not delete subject.";
            toast.error(message);
        }
    };

    useLockBodyScroll(isModalOpen || !!deletingSubject);

    if (loading) {
        return (
            <div className="p-12 text-center text-sm font-medium text-[var(--color-text)] opacity-70 animate-pulse">
                Loading subjects roster...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SubjectModal
                centerId={centerId}
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetch();
                }}
                subject={editingSubject}
            />

            <ConfirmModal
                isOpen={!!deletingSubject}
                title="Delete Subject"
                message={`Are you sure you want to permanently delete "${deletingSubject?.name || ""}"? This action cannot be undone.`}
                confirmText="Delete"
                onClose={() => setDeletingSubject(null)}
                onConfirm={() => (deletingSubject ? handleDelete(deletingSubject) : undefined)}
            />

            {/* UPGRADED HEADER STYLE BLOCK */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-main)]">
                            <BookA size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-[var(--color-text)] tracking-tight">
                                Subjects Catalog
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Manage and configure organization modules ({filteredSubjects.length} records found)
                            </p>
                        </div>
                    </div>
                </div>

                {isManager && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 border border-transparent bg-[var(--color-main)] hover:opacity-95 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all outline-none shadow-xs shrink-0 self-start sm:self-auto"
                    >
                        <Plus size={16} className="stroke-[2.5]" />
                        Add Subject
                    </button>
                )}
            </div>

            {/* SEARCH INPUT */}
            <div className="relative max-w-md bg-gray-50 p-1.5 rounded-xl border border-gray-200/60">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search subject by name..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition placeholder-gray-400 focus:border-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-main)]/10"
                />
            </div>

            {/* SUBELEMENT GRID LAYOUT */}
            {subjects.length === 0 ? (
                <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <BookA size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium">No subjects created for this center yet.</p>
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200 shadow-xs">
                    No subjects match your active search parameters.
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {paginatedSubjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="flex min-h-[160px] flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                            >
                                {/* TOP CARD BAR - CONTENT AND TOP BUTTON LAYOUT */}
                                <div className="space-y-3.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="inline-flex rounded-lg border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-main)] tracking-wide truncate max-w-[65%]">
                                            {subject.name}
                                        </div>

                                        {/* DISTINCT BUTTON INTERACTIVE MATRIX MOVED TO TOP */}
                                        {isManager && (
                                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="p-1.5 border border-gray-200 bg-white text-gray-500 rounded-md hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all outline-none"
                                                    title="Modify Configuration"
                                                >
                                                    <Edit2Icon size={20} className="stroke-[2.5]" />
                                                </button>

                                                <button
                                                    onClick={() => setDeletingSubject(subject)}
                                                    className="p-1.5 border border-gray-200 bg-white text-gray-400 rounded-md hover:text-[var(--color-alert)] hover:bg-red-50 hover:border-red-200 transition-all outline-none"
                                                    title="Delete Subject"
                                                >
                                                    <Trash2 size={20} className="stroke-[2.5]" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* CARD CONTENT LAYER */}
                                    <div className="rounded-lg bg-gray-50/70 border border-gray-100 p-3 text-xs text-[var(--color-text)] leading-relaxed">
                                        <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px] mb-1">
                                            Description
                                        </span>
                                        <p className={subject.description ? "text-gray-600 font-medium line-clamp-3" : "text-gray-400 italic"}>
                                            {subject.description || "No description provided for this subject entry."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION PANEL FOOTER */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between text-xs">
                        <p className="font-medium text-gray-500">
                            Showing <span className="font-bold text-[var(--color-text)]">{(currentPage - 1) * rowsPerPage + 1}</span> -{" "}
                            <span className="font-bold text-[var(--color-text)]">{Math.min(currentPage * rowsPerPage, filteredSubjects.length)}</span> of{" "}
                            <span className="font-bold text-[var(--color-text)]">{filteredSubjects.length}</span> entries
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