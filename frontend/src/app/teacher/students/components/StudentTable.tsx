"use client";

import { useState } from "react";
import {
    Mail,
    Phone,
    Building2,
    Unlink,
    Trash2,
    Edit2,
    KeyRound,
    RotateCcw,
    Copy,
    Check,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react";

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    canManage: boolean;
    connectedCenters?: { id: number; name: string }[];
}

interface Props {
    students: Student[];
    loading: boolean;
    onAssign?: (studentId: number) => void;
    onDelete?: (studentId: number) => void;
    onResetPassword?: (student: Student) => void;
    onRollback?: (student: Student) => void;
    deleteLabel?: string;
    onEdit?: (student: any) => void;
    showAffiliatedCenters?: boolean;
}

type SortDirection = "none" | "asc" | "desc";

export default function StudentTable({
    students,
    loading,
    onAssign,
    onDelete,
    onResetPassword,
    onRollback,
    deleteLabel = "Delete",
    onEdit,
    showAffiliatedCenters = true,
}: Props) {
    // Sorting & Clipboard Toast Emulation States
    const [sortDirection, setSortDirection] = useState<SortDirection>("none");
    const [copiedText, setCopiedText] = useState<string | null>(null);

    // Clipboard Copy Handler Method
    const handleCopyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 1500);
    };

    // Sort Toggle State Logic
    const handleSortToggle = () => {
        setSortDirection((prev) => {
            if (prev === "none") return "asc";
            if (prev === "asc") return "desc";
            return "none";
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16 text-[var(--color-text)]/60 font-medium bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--color-main)] border-t-transparent rounded-full animate-spin" />
                    <span>Loading student records...</span>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-[var(--color-text)]/15 rounded-xl bg-[var(--color-text)]/[0.02] text-center m-4">
                <p className="text-sm font-semibold text-[var(--color-text)]/80">No students found</p>
                <p className="text-xs text-[var(--color-text)]/40 mt-1">Try modifying your text search keywords or filter scope options.</p>
            </div>
        );
    }

    // Processing Sort array modifications natively
    const sortedStudents = [...students].sort((a, b) => {
        if (sortDirection === "none") return 0;

        const nameA = `${a?.lastName || ""} ${a?.firstName || ""}`.toLowerCase().trim();
        const nameB = `${b?.lastName || ""} ${b?.firstName || ""}`.toLowerCase().trim();

        if (sortDirection === "asc") {
            return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        } else {
            return nameB.localeCompare(nameA, undefined, { sensitivity: "base" });
        }
    });

    return (
        <div className="w-full overflow-x-auto bg-white">
            <table className="w-full table-auto text-left text-sm whitespace-nowrap">
                {/* TABLE HEADER */}
                <thead className="bg-[var(--color-text)]/[0.02] text-[var(--color-text)]/60 uppercase text-xs font-bold tracking-wider border-b border-[var(--color-text)]/15 select-none">
                    <tr>
                        <th
                            onClick={handleSortToggle}
                            className="px-6 py-3.5 font-bold cursor-pointer hover:bg-[var(--color-main)]/[0.04] hover:text-[var(--color-text)] transition-colors group"
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Student Profile</span>
                                <span className="text-[var(--color-text)]/40 group-hover:text-[var(--color-text)]/80 transition-colors">
                                    {sortDirection === "none" && <ArrowUpDown size={13} />}
                                    {sortDirection === "asc" && <ArrowUp size={13} className="text-[var(--color-main)]" />}
                                    {sortDirection === "desc" && <ArrowDown size={13} className="text-[var(--color-main)]" />}
                                </span>
                            </div>
                        </th>
                        <th className="px-6 py-3.5 font-semibold">Contact Details</th>
                        {showAffiliatedCenters && (
                            <th className="px-6 py-3.5 font-semibold">Affiliated Centers</th>
                        )}
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y divide-[var(--color-text)]/5">
                    {sortedStudents.map((student) => {
                        const emailValue = student?.email || "";
                        const phoneValue = student?.phoneNumber || "";

                        return (
                            <tr
                                key={student.id}
                                className="hover:bg-[var(--color-main)]/[0.01] transition-colors group"
                            >
                                {/* STUDENT INFO */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[var(--color-main)]/10 text-[var(--color-main)] flex items-center justify-center font-bold text-sm tracking-wide shrink-0 border border-[var(--color-main)]/10">
                                            {student.lastName ? student.lastName.charAt(0) : "S"}
                                        </div>

                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-[var(--color-text)] text-sm group-hover:text-[var(--color-main)] transition-colors">
                                                {student.lastName} {student.firstName}
                                            </p>
                                            <p className="text-xs font-medium text-[var(--color-text)]/40 tracking-wide">
                                                {new Date(student.dateOfBirth).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "2-digit",
                                                }).replace(/\//g, "/")}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* CONTACT INFO WITH INTEGRATED HOVER COPY SHORTCUTS */}
                                <td className="px-6 py-4">
                                    <div className="space-y-1.5 text-[var(--color-text)]/80">
                                        {/* EMAIL ROW CONTAINER */}
                                        <div className="flex items-center justify-between gap-4 max-w-xs group/item">
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                <Mail size={14} className="text-[var(--color-text)]/40 shrink-0" />
                                                <span className="truncate max-w-[200px]">{emailValue || "—"}</span>
                                            </div>
                                            {emailValue && (
                                                <button
                                                    onClick={() => handleCopyToClipboard(emailValue)}
                                                    className="text-[var(--color-text)]/30 hover:text-[var(--color-main)] p-1 rounded transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                                                    title="Copy Email Address"
                                                >
                                                    {copiedText === emailValue ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                                                </button>
                                            )}
                                        </div>

                                        {/* PHONE NUMBER ROW CONTAINER */}
                                        <div className="flex items-center justify-between gap-4 max-w-xs group/item">
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                <Phone size={14} className="text-[var(--color-text)]/40 shrink-0" />
                                                <span>
                                                    {phoneValue || (
                                                        <span className="text-[var(--color-text)]/30 font-normal italic">No contact number</span>
                                                    )}
                                                </span>
                                            </div>
                                            {phoneValue && (
                                                <button
                                                    onClick={() => handleCopyToClipboard(phoneValue)}
                                                    className="text-[var(--color-text)]/30 hover:text-[var(--color-main)] p-1 rounded transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                                                    title="Copy Phone Number"
                                                >
                                                    {copiedText === phoneValue ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* CENTERS BADGES */}
                                {showAffiliatedCenters && (
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                                            {student.connectedCenters && student.connectedCenters.length > 0 ? (
                                                student.connectedCenters.map((center) => (
                                                    <span
                                                        key={center.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)]/20"
                                                    >
                                                        <Building2 size={12} className="text-[var(--color-main)]/60" />
                                                        {center.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-[var(--color-text)]/40 italic font-medium">
                                                    Unassigned
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {/* ACTIONS CELL */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-1.5">
                                        {onAssign && (
                                            <button
                                                onClick={() => onAssign(student.id)}
                                                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--color-main)] bg-[var(--color-main)]/10 border border-[var(--color-main)]/20 hover:bg-[var(--color-main)] hover:text-white transition-all"
                                            >
                                                Assign
                                            </button>
                                        )}

                                        {student.canManage !== false && (
                                            <>
                                                {onRollback && (
                                                    <button
                                                        onClick={() => onRollback(student)}
                                                        className="p-1.5 border border-[var(--color-text)]/15 bg-white text-[var(--color-text)]/70 rounded-lg hover:bg-[var(--color-main)]/10 hover:text-[var(--color-main)] hover:border-[var(--color-main)]/20 transition-all shadow-sm"
                                                        title="Rollback operational path"
                                                    >
                                                        <RotateCcw size={15} className="stroke-[2.5]" />
                                                    </button>
                                                )}

                                                {onResetPassword && (
                                                    <button
                                                        onClick={() => onResetPassword(student)}
                                                        className="p-1.5 border border-[var(--color-text)]/15 bg-white text-[var(--color-text)]/70 rounded-lg hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
                                                        title="Reset secure login credentials"
                                                    >
                                                        <KeyRound size={15} className="stroke-[2.5]" />
                                                    </button>
                                                )}

                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(student)}
                                                        className="p-1.5 border border-[var(--color-text)]/15 bg-white text-[var(--color-text)]/70 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                                        title="Modify operational variables"
                                                    >
                                                        <Edit2 size={15} className="stroke-[2.5]" />
                                                    </button>
                                                )}

                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(student.id)}
                                                        className="p-1.5 border border-[var(--color-text)]/15 bg-white text-[var(--color-text)]/60 rounded-lg hover:bg-[var(--color-alert)]/10 hover:text-[var(--color-alert)] hover:border-[var(--color-alert)]/20 transition-all shadow-sm"
                                                        title={deleteLabel}
                                                    >
                                                        {deleteLabel === "Remove" || deleteLabel === "Roll Out" ? (
                                                            <Unlink size={15} className="stroke-[2.5]" />
                                                        ) : (
                                                            <Trash2 size={15} className="stroke-[2.5]" />
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}