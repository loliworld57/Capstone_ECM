"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, ReceiptText, RefreshCw, Settings, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import FinanceRecordPanel from "@/components/FinanceRecordPanel";
import { getStudentsInCourse } from "@/services/courseService";
import {
    createCourseFinanceRecord,
    createTuitionPayment,
    deleteCourseFinanceRecord,
    formatVnd,
    getCourseFinanceMonthlyReport,
    getCourseFinanceRecords,
    getStudentTuition,
    StudentTuition,
} from "@/services/financeService";
import TuitionPlanEditor from "./TuitionPlanEditor";

interface Props {
    courseId: number;
    isManager: boolean;
}

type StudentTuitionRow = StudentTuition & {
    studentId: number;
    studentName: string;
};

type SortField = "studentName" | "totalPaidVnd" | "remainingVnd";

export default function CourseFinanceTab({ courseId, isManager }: Props) {
    const [rows, setRows] = useState<StudentTuitionRow[]>([]);
    const [loadingTuition, setLoadingTuition] = useState(true);
    const [paymentDrafts, setPaymentDrafts] = useState<Record<number, { amountVnd: string; paidAt: string; installmentId?: string; note: string }>>({});
    const [editingPlan, setEditingPlan] = useState<StudentTuitionRow | null>(null);

    // --- SEARCH, SORT, FILTER & PAGINATION STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [planFilter, setPlanFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>("studentName");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const loadTuition = async () => {
        try {
            setLoadingTuition(true);
            const students = await getStudentsInCourse(courseId);
            const tuitionLists = await Promise.all(
                (students || []).map(async (student: any) => {
                    try {
                        const list = await getStudentTuition(student.id);
                        const tuition = list.find((item) => item.courseId === courseId);
                        return tuition
                            ? {
                                ...tuition,
                                studentId: student.id,
                                studentName: `${student.lastName || ""} ${student.firstName || ""}`.trim(),
                            }
                            : null;
                    } catch {
                        return null;
                    }
                })
            );
            setRows(tuitionLists.filter(Boolean) as StudentTuitionRow[]);
            setCurrentPage(1);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load tuition data.");
        } finally {
            setLoadingTuition(false);
        }
    };

    useEffect(() => {
        loadTuition();
    }, [courseId]);

    const updateDraft = (
        enrollmentId: number,
        patch: Partial<{
            amountVnd: string;
            paidAt: string;
            installmentId?: string;
            note: string;
        }>
    ) => {
        setPaymentDrafts((current) => ({
            ...current,
            [enrollmentId]: {
                ...(current[enrollmentId] ?? {
                    amountVnd: "",
                    paidAt: today,
                    installmentId: "",
                    note: "",
                }),
                ...patch,
            },
        }));
    };

    const submitPayment = async (row: StudentTuitionRow) => {
        const draft = paymentDrafts[row.enrollmentId] || { amountVnd: "", paidAt: today, installmentId: "", note: "" };
        const amount = Number(draft.amountVnd);
        if (!amount || amount <= 0) {
            toast.error("Enter a valid payment amount.");
            return;
        }

        try {
            await createTuitionPayment({
                enrollmentId: row.enrollmentId,
                amountVnd: amount,
                paidAt: draft.paidAt || today,
                note: draft.note,
                installmentId: draft.installmentId ? Number(draft.installmentId) : undefined,
            });
            toast.success("Payment recorded.");
            updateDraft(row.enrollmentId, { amountVnd: "", note: "", installmentId: "" });
            await loadTuition();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to record payment.");
        }
    };

    // --- SORTING FUNCTIONALITY ---
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // --- EXTRACT OPTIONS FOR FILTER DROPDOWNS ---
    const uniquePlans = useMemo(() => Array.from(new Set(rows.map((r) => r.paymentPlanType))), [rows]);
    const uniqueStatuses = useMemo(() => Array.from(new Set(rows.map((r) => r.tuitionStatus))), [rows]);

    // --- FILTER & SORT PROCESSING ---
    const processedRows = useMemo(() => {
        let result = [...rows];

        // Search by Name
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            result = result.filter((r) => r.studentName.toLowerCase().includes(query));
        }

        // Filter by Status
        if (statusFilter !== "") {
            result = result.filter((r) => r.tuitionStatus === statusFilter);
        }

        // Filter by Plan
        if (planFilter !== "") {
            result = result.filter((r) => r.paymentPlanType === planFilter);
        }

        // Handle Tri-Column Sort Logic
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "studentName") {
                comparison = a.studentName.localeCompare(b.studentName);
            } else {
                comparison = (a[sortField] || 0) - (b[sortField] || 0);
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });

        return result;
    }, [rows, searchTerm, statusFilter, planFilter, sortField, sortDirection]);

    // --- PAGINATION MATHEMATICS ---
    const totalPages = Math.ceil(processedRows.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedRows.slice(startIndex, startIndex + itemsPerPage);
    }, [processedRows, currentPage]);

    // --- STATUS COLOR HELPER ---
    const getStatusStyles = (status: string) => {
        const lower = status.toLowerCase();
        if (lower.includes("paid") && !lower.includes("unpaid") && !lower.includes("partially")) {
            return "bg-green-50 text-green-700 border-green-200";
        }
        if (lower.includes("partial") || lower.includes("progress") || lower.includes("owing")) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }
        if (lower.includes("unpaid") || lower.includes("overdue") || lower.includes("debt")) {
            return "bg-red-50 text-red-700 border-red-200";
        }
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="space-y-6">
            {editingPlan && (
                <TuitionPlanEditor tuition={editingPlan} onSaved={loadTuition} onClose={() => setEditingPlan(null)} />
            )}
            <FinanceRecordPanel
                title="Course Manual Income / Expenses"
                loadRecords={(start, end) => getCourseFinanceRecords(courseId, start, end)}
                loadReport={(date) => getCourseFinanceMonthlyReport(courseId, date)}
                createRecord={(data) => createCourseFinanceRecord(courseId, data)}
                deleteRecord={deleteCourseFinanceRecord}
            />

            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[var(--color-main)]/20 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                            <ReceiptText size={20} className="text-[var(--color-main)]" />
                            Student Tuition
                        </h3>
                        <p className="text-sm text-gray-500">Record offline tuition payments and review balances.</p>
                    </div>
                    <button
                        onClick={loadTuition}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-main)] px-3 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white"
                    >
                        <RefreshCw size={15} />
                        Refresh
                    </button>
                </div>

                {/* --- FILTERS CONTROL BAR --- */}
                <div className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-3">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search student name..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-main)]"
                        />
                    </div>
                    <div>
                        <select
                            value={planFilter}
                            onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[var(--color-main)]"
                        >
                            <option value="">All Payment Plans</option>
                            {uniquePlans.map((plan) => (
                                <option key={plan} value={plan}>{plan.replace("_", " ")}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[var(--color-main)]"
                        >
                            <option value="">All Statuses</option>
                            {uniqueStatuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-secondary)]/10 text-[var(--color-text)]">
                            <tr>
                                <th className="p-3 cursor-pointer select-none" onClick={() => handleSort("studentName")}>
                                    <div className="flex items-center gap-1 hover:text-[var(--color-main)] transition">
                                        Student <ArrowUpDown size={14} className="opacity-70" />
                                    </div>
                                </th>
                                <th className="p-3">Plan</th>
                                <th className="p-3 text-right">Final Fee</th>
                                <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort("totalPaidVnd")}>
                                    <div className="flex items-center justify-end gap-1 hover:text-[var(--color-main)] transition">
                                        Paid <ArrowUpDown size={14} className="opacity-70" />
                                    </div>
                                </th>
                                <th className="p-3 text-right cursor-pointer select-none" onClick={() => handleSort("remainingVnd")}>
                                    <div className="flex items-center justify-end gap-1 hover:text-[var(--color-main)] transition">
                                        Remaining <ArrowUpDown size={14} className="opacity-70" />
                                    </div>
                                </th>
                                <th className="p-3">Status</th>
                                {isManager && <th className="p-3 min-w-[430px]">Manage Tuition</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loadingTuition ? (
                                <tr><td colSpan={isManager ? 7 : 6} className="p-6 text-center text-gray-500 align-middle">Loading tuition...</td></tr>
                            ) : paginatedRows.length === 0 ? (
                                <tr><td colSpan={isManager ? 7 : 6} className="p-6 text-center text-gray-500 align-middle">No tuition accounts found matching your criteria.</td></tr>
                            ) : paginatedRows.map((row) => {
                                const draft = paymentDrafts[row.enrollmentId] || { amountVnd: "", paidAt: today, installmentId: "", note: "" };
                                return (
                                    <tr key={row.enrollmentId} className="border-t border-gray-100 align-middle hover:bg-gray-50/50 transition">
                                        <td className="p-3 font-medium text-[var(--color-text)] align-middle">{row.studentName}</td>
                                        <td className="p-3 align-middle">{row.paymentPlanType.replace("_", " ")}</td>
                                        <td className="p-3 text-right align-middle">{formatVnd(row.finalTuitionVnd)}</td>
                                        <td className="p-3 text-right align-middle">{formatVnd(row.totalPaidVnd)}</td>
                                        <td className="p-3 text-right font-semibold align-middle">{formatVnd(row.remainingVnd)}</td>
                                        <td className="p-3 align-middle">
                                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold whitespace-nowrap ${getStatusStyles(row.tuitionStatus)}`}>
                                                {row.tuitionStatus}
                                            </span>
                                        </td>
                                        {isManager && (
                                            <td className="p-3 align-middle">
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <button
                                                            onClick={() => setEditingPlan(row)}
                                                            disabled={row.totalPaidVnd > 0}
                                                            title={row.totalPaidVnd > 0 ? "Plan is locked after the first payment" : "Configure tuition plan"}
                                                            className="inline-flex items-center gap-2 rounded border border-[var(--color-main)] px-2 py-1.5 text-xs font-semibold text-[var(--color-main)] disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <Settings size={14} /> Configure Plan
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select
                                                            value={draft.installmentId || ""}
                                                            onChange={(event) => updateDraft(row.enrollmentId, { installmentId: event.target.value })}
                                                            className="rounded border border-[var(--color-main)]/30 px-2 py-2 outline-none"
                                                        >
                                                            <option value="">Auto apply</option>
                                                            {row.installments.map((installment) => (
                                                                <option key={installment.id} value={installment.id}>
                                                                    #{installment.installmentNumber} {installment.dueDate} - {formatVnd(installment.remainingVnd)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={draft.amountVnd}
                                                            onChange={(event) => updateDraft(row.enrollmentId, { amountVnd: event.target.value })}
                                                            placeholder="Amount"
                                                            className="rounded border border-[var(--color-main)]/30 px-2 py-2 outline-none"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={draft.paidAt}
                                                            onChange={(event) => updateDraft(row.enrollmentId, { paidAt: event.target.value })}
                                                            className="rounded border border-[var(--color-main)]/30 px-2 py-2 outline-none"
                                                        />
                                                        <button
                                                            onClick={() => submitPayment(row)}
                                                            className="inline-flex items-center justify-center gap-2 rounded border-2 border-[var(--color-main)] bg-[var(--color-main)] px-2 py-2 font-semibold text-white transition hover:bg-white hover:text-[var(--color-main)]"
                                                        >
                                                            <CreditCard size={15} />
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION CONTROL BAR --- */}
                {processedRows.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-100 p-4 text-xs text-gray-500">
                        <div>
                            Showing <b>{Math.min(processedRows.length, (currentPage - 1) * itemsPerPage + 1)}</b> to{" "}
                            <b>{Math.min(processedRows.length, currentPage * itemsPerPage)}</b> of{" "}
                            <b>{processedRows.length}</b> students
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-gray-700 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}