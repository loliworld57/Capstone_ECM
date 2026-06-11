"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import {
    FinanceRecord,
    FinanceRecordRequest,
    FinanceReport,
    FinanceType,
    formatVnd,
    getMonthRange,
    monthInputToDate,
} from "@/services/financeService";

interface Props {
    title: string;
    loadRecords: (start: string, end: string) => Promise<FinanceRecord[]>;
    loadReport: (date: string) => Promise<FinanceReport>;
    createRecord: (data: FinanceRecordRequest) => Promise<FinanceRecord>;
    deleteRecord: (recordId: number) => Promise<unknown>;
}

const emptyForm = {
    name: "",
    type: "EXPENSE" as FinanceType,
    amountVnd: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
};

export default function FinanceRecordPanel({ title, loadRecords, loadReport, createRecord, deleteRecord }: Props) {
    const initialRange = useMemo(() => getMonthRange(), []);
    const [month, setMonth] = useState(initialRange.monthInput);
    const [records, setRecords] = useState<FinanceRecord[]>([]);
    const [report, setReport] = useState<FinanceReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const selectedDate = monthInputToDate(month);
    const range = useMemo(() => {
        const [year, monthIndex] = month.split("-").map(Number);
        return getMonthRange(new Date(year, monthIndex - 1, 1));
    }, [month]);

    const refresh = async () => {
        try {
            setLoading(true);
            const [recordData, reportData] = await Promise.all([
                loadRecords(range.start, range.end),
                loadReport(selectedDate),
            ]);
            setRecords(recordData || []);
            setReport(reportData);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load finance data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [range.start, range.end, selectedDate]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const amount = Number(form.amountVnd);
        if (!form.name.trim() || !amount || amount <= 0) {
            toast.error("Please enter a name and valid amount.");
            return;
        }

        try {
            setSaving(true);
            await createRecord({
                name: form.name.trim(),
                type: form.type,
                amountVnd: amount,
                description: form.description.trim(),
                date: form.date,
            });
            setForm(emptyForm);
            toast.success("Finance record saved.");
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to save finance record.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (recordId: number) => {
        try {
            await deleteRecord(recordId);
            toast.success("Finance record deleted.");
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to delete finance record.");
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-main)]/20 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                        <WalletCards size={20} className="text-[var(--color-main)]" />
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">Manual records only. No payment gateway integration.</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/40"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Income</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-main)]">{formatVnd(report?.totalIncomeVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Expenses</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-alert)]">{formatVnd(report?.totalExpenseVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Net</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-text)]">{formatVnd(report?.profitVnd)}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-main)]/20 bg-white p-4 md:grid-cols-6">
                <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Name"
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 outline-none md:col-span-2"
                />
                <select
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value as FinanceType })}
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 outline-none"
                >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                </select>
                <input
                    type="number"
                    min={1}
                    value={form.amountVnd}
                    onChange={(event) => setForm({ ...form, amountVnd: event.target.value })}
                    placeholder="Amount"
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 outline-none"
                />
                <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 outline-none"
                />
                <button
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] px-3 py-2 font-semibold text-white transition hover:bg-white hover:text-[var(--color-main)] disabled:opacity-60"
                >
                    <Plus size={16} />
                    Add
                </button>
                <input
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Description"
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 outline-none md:col-span-6"
                />
            </form>

            <div className="overflow-hidden rounded-xl border border-[var(--color-main)]/20 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--color-secondary)]/10 text-[var(--color-text)]">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">No finance records for this month.</td></tr>
                        ) : records.map((record) => (
                            <tr key={record.id} className="border-t border-gray-100">
                                <td className="p-3">{record.date}</td>
                                <td className="p-3">
                                    <div className="font-medium text-[var(--color-text)]">{record.name}</div>
                                    {record.description && <div className="text-xs text-gray-500">{record.description}</div>}
                                </td>
                                <td className="p-3">{record.type === "INCOME" ? "Income" : "Expense"}</td>
                                <td className="p-3 text-right font-semibold">{formatVnd(record.amountVnd)}</td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="inline-flex rounded border border-[var(--color-alert)] p-2 text-[var(--color-alert)] transition hover:bg-[var(--color-alert)] hover:text-white"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
