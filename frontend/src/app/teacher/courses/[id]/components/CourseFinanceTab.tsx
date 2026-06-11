"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, ReceiptText, RefreshCw, Settings } from "lucide-react";
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

export default function CourseFinanceTab({ courseId, isManager }: Props) {
    const [rows, setRows] = useState<StudentTuitionRow[]>([]);
    const [loadingTuition, setLoadingTuition] = useState(true);
    const [paymentDrafts, setPaymentDrafts] = useState<Record<number, { amountVnd: string; paidAt: string; installmentId?: string; note: string }>>({});
    const [editingPlan, setEditingPlan] = useState<StudentTuitionRow | null>(null);

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

    const updateDraft = (enrollmentId: number, patch: Partial<{ amountVnd: string; paidAt: string; installmentId?: string; note: string }>) => {
        setPaymentDrafts((current) => ({
            ...current,
            [enrollmentId]: {
                amountVnd: "",
                paidAt: today,
                installmentId: "",
                note: "",
                ...(current[enrollmentId] || {}),
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-secondary)]/10 text-[var(--color-text)]">
                            <tr>
                                <th className="p-3">Student</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3 text-right">Final Fee</th>
                                <th className="p-3 text-right">Paid</th>
                                <th className="p-3 text-right">Remaining</th>
                                <th className="p-3">Status</th>
                                {isManager && <th className="p-3 min-w-[430px]">Manage Tuition</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loadingTuition ? (
                                <tr><td colSpan={isManager ? 7 : 6} className="p-6 text-center text-gray-500">Loading tuition...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={isManager ? 7 : 6} className="p-6 text-center text-gray-500">No tuition accounts found for this course.</td></tr>
                            ) : rows.map((row) => {
                                const draft = paymentDrafts[row.enrollmentId] || { amountVnd: "", paidAt: today, installmentId: "", note: "" };
                                return (
                                    <tr key={row.enrollmentId} className="border-t border-gray-100 align-top">
                                        <td className="p-3 font-medium text-[var(--color-text)]">{row.studentName}</td>
                                        <td className="p-3">{row.paymentPlanType.replace("_", " ")}</td>
                                        <td className="p-3 text-right">{formatVnd(row.finalTuitionVnd)}</td>
                                        <td className="p-3 text-right">{formatVnd(row.totalPaidVnd)}</td>
                                        <td className="p-3 text-right font-semibold">{formatVnd(row.remainingVnd)}</td>
                                        <td className="p-3">
                                            <span className="rounded-full border border-[var(--color-main)]/20 px-2 py-1 text-xs font-semibold">
                                                {row.tuitionStatus}
                                            </span>
                                        </td>
                                        {isManager && (
                                            <td className="p-3">
                                                <button
                                                    onClick={() => setEditingPlan(row)}
                                                    disabled={row.totalPaidVnd > 0}
                                                    title={row.totalPaidVnd > 0 ? "Plan is locked after the first payment" : "Configure tuition plan"}
                                                    className="mb-2 inline-flex items-center gap-2 rounded border border-[var(--color-main)] px-2 py-1.5 text-xs font-semibold text-[var(--color-main)] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Settings size={14} /> Configure Plan
                                                </button>
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
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
