"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, TrendingUp, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import FinanceRecordPanel from "@/components/FinanceRecordPanel";
import {
    CenterFinanceDashboard,
    createCenterFinanceRecord,
    deleteCenterFinanceRecord,
    formatVnd,
    getCenterFinanceDashboard,
    getCenterFinanceRecords,
    getMonthRange,
    monthInputToDate,
} from "@/services/financeService";

interface Props {
    centerId: number;
}

export default function CenterFinanceTab({ centerId }: Props) {
    const initialRange = useMemo(() => getMonthRange(), []);
    const [month, setMonth] = useState(initialRange.monthInput);
    const [dashboard, setDashboard] = useState<CenterFinanceDashboard | null>(null);
    const selectedDate = monthInputToDate(month);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await getCenterFinanceDashboard(centerId, selectedDate);
                setDashboard(data);
            } catch (error) {
                console.error(error);
                toast.error("Unable to load center finance dashboard.");
            }
        };

        loadDashboard();
    }, [centerId, selectedDate]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-main)]/20 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                        <WalletCards size={20} className="text-[var(--color-main)]" />
                        Center Finance
                    </h3>
                    <p className="text-sm text-gray-500">Tuition revenue is calculated from recorded tuition payments.</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="rounded-lg border border-[var(--color-main)]/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/40"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-gray-500"><Banknote size={16} /> Revenue</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-main)]">{formatVnd(dashboard?.monthlyRevenueVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-gray-500"><WalletCards size={16} /> Expenses</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-alert)]">{formatVnd(dashboard?.monthlyExpenseVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp size={16} /> Profit</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-text)]">{formatVnd(dashboard?.estimatedProfitVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle size={16} /> Outstanding</p>
                    <p className="mt-1 text-xl font-bold text-[var(--color-negative)]">{formatVnd(dashboard?.outstandingDebtVnd)}</p>
                </div>
            </div>

            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                <h4 className="mb-3 font-bold text-[var(--color-text)]">Overdue Tuition ({dashboard?.overduePaymentCount || 0})</h4>
                {!dashboard?.overduePayments?.length ? (
                    <p className="text-sm text-gray-500">No overdue tuition payments.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--color-secondary)]/10">
                                <tr>
                                    <th className="p-3">Student</th>
                                    <th className="p-3">Course</th>
                                    <th className="p-3">Due Date</th>
                                    <th className="p-3 text-right">Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.overduePayments.map((item) => (
                                    <tr key={item.id} className="border-t border-gray-100">
                                        <td className="p-3 font-medium">{item.studentName}</td>
                                        <td className="p-3">{item.courseName}</td>
                                        <td className="p-3">{item.dueDate}</td>
                                        <td className="p-3 text-right font-semibold">{formatVnd(item.remainingVnd)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <FinanceRecordPanel
                title="Center Manual Income / Expenses"
                loadRecords={(start, end) => getCenterFinanceRecords(centerId, start, end)}
                loadReport={async (date) => {
                    const data = await getCenterFinanceDashboard(centerId, date);
                    return {
                        totalIncomeVnd: data.monthlyRevenueVnd,
                        totalExpenseVnd: data.monthlyExpenseVnd,
                        profitVnd: data.estimatedProfitVnd,
                    };
                }}
                createRecord={(data) => createCenterFinanceRecord(centerId, data)}
                deleteRecord={deleteCenterFinanceRecord}
            />
        </div>
    );
}
