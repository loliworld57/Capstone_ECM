"use client";

import { useEffect, useState, useMemo } from "react";
import { 
    ReceiptText, 
    WalletCards, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    FilterX 
} from "lucide-react";
import toast from "react-hot-toast";
import { formatVnd, getMyTuition, StudentTuition } from "@/services/financeService";

interface Props {
    courseId: number;
}

const HISTORY_ITEMS_PER_PAGE = 5;

export default function CourseFinance({ courseId }: Props) {
    const [tuition, setTuition] = useState<StudentTuition | null>(null);
    const [loading, setLoading] = useState(true);

    // Search and Filter States
    const [searchDate, setSearchDate] = useState("");
    const [searchAmount, setSearchAmount] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const list = await getMyTuition();
                setTuition(list.find((item) => item.courseId === courseId) || null);
            } catch (error) {
                console.error(error);
                toast.error("Unable to load tuition information.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [courseId]);

    // Reset pagination when filter queries change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchDate, searchAmount]);

    // Computed Filtered & Paginated Payment History
    const filteredHistory = useMemo(() => {
        if (!tuition?.paymentHistory) return [];
        return tuition.paymentHistory.filter((payment) => {
            const matchesDate = payment.paidAt.toLowerCase().includes(searchDate.toLowerCase());
            
            let matchesAmount = true;
            if (searchAmount.trim() !== "") {
                const numericSearch = parseFloat(searchAmount.replace(/[^0-9]/g, ""));
                if (!isNaN(numericSearch)) {
                    matchesAmount = payment.amountVnd >= numericSearch;
                }
            }
            return matchesDate && matchesAmount;
        });
    }, [tuition, searchDate, searchAmount]);

    const totalPages = Math.ceil(filteredHistory.length / HISTORY_ITEMS_PER_PAGE);
    
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * HISTORY_ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + HISTORY_ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    // Helper method to resolve individual status tag visual badges
    const getStatusStyles = (status: string) => {
        const normalized = status.toUpperCase().trim();
        if (normalized.includes("PAID") || normalized.includes("COMPLETED") || normalized.includes("DONE")) {
            return "bg-[var(--color-main)]/10 border-[var(--color-main)]/20 text-[var(--color-main)]";
        }
        if (normalized.includes("PARTIAL") || normalized.includes("PROGRESS")) {
            return "bg-[var(--color-secondary)]/20 border-[var(--color-secondary)]/40 text-[var(--color-text)]";
        }
        if (normalized.includes("OVERDUE") || normalized.includes("LATE") || normalized.includes("ALERT")) {
            return "bg-[var(--color-alert)]/10 border-[var(--color-alert)]/20 text-[var(--color-alert)]";
        }
        // Default / Pending style
        return "bg-gray-100 border-gray-200 text-gray-500";
    };

    if (loading) {
        return (
            <div className="rounded-xl bg-white p-8 text-center text-[var(--color-text)]/60 font-medium border border-[var(--color-main)]/10 animate-pulse">
                Loading tuition information...
            </div>
        );
    }

    if (!tuition) {
        return (
            <div className="rounded-xl bg-white p-8 text-center text-[var(--color-text)]/60 font-medium border border-[var(--color-main)]/10">
                No tuition information is available for this course.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section banner */}
            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
                    <WalletCards size={22} className="text-[var(--color-main)]" />
                    Tuition Summary
                </h3>
                <p className="text-sm mt-1 text-[var(--color-text)]/60">
                    This page displays statements and transactions authenticated by your training coordinator center.
                </p>
            </div>

            {/* Quick Metrics KPI Dashboard widgets */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-main)]/15 bg-white p-5 transition-all hover:shadow-sm">
                    <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text)]/50">Plan Selected</p>
                    <p className="mt-2 text-lg font-bold text-[var(--color-text)] tracking-tight">
                        {tuition.paymentPlanType.replace("_", " ")}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/15 bg-white p-5 transition-all hover:shadow-sm">
                    <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text)]/50">Final Tuition</p>
                    <p className="mt-2 text-xl font-black text-[var(--color-main)] tracking-tight">
                        {formatVnd(tuition.finalTuitionVnd)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/15 bg-white p-5 transition-all hover:shadow-sm">
                    <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text)]/50">Total Paid</p>
                    <p className="mt-2 text-xl font-black text-[var(--color-text)] tracking-tight">
                        {formatVnd(tuition.totalPaidVnd)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/15 bg-white p-5 transition-all hover:shadow-sm">
                    <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text)]/50">Outstanding Due</p>
                    <p className="mt-2 text-xl font-black text-[var(--color-alert)] tracking-tight">
                        {formatVnd(tuition.remainingVnd)}
                    </p>
                </div>
            </div>

            {/* Structured installment timetable */}
            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 font-bold text-base text-[var(--color-text)]">
                    <ReceiptText size={18} className="text-[var(--color-main)]" />
                    Payment Milestones Schedule
                </h4>
                <div className="overflow-x-auto rounded-lg border border-[var(--color-main)]/10">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-[var(--color-secondary)]/10 text-[var(--color-text)] font-bold">
                            <tr>
                                <th className="p-3.5 border-b border-[var(--color-main)]/10">No.</th>
                                <th className="p-3.5 border-b border-[var(--color-main)]/10">Due Date</th>
                                <th className="p-3.5 text-right border-b border-[var(--color-main)]/10">Target Due</th>
                                <th className="p-3.5 text-right border-b border-[var(--color-main)]/10">Completed</th>
                                <th className="p-3.5 text-right border-b border-[var(--color-main)]/10">Remaining</th>
                                <th className="p-3.5 text-center border-b border-[var(--color-main)]/10">Payment Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-main)]/5">
                            {tuition.installments.map((item) => (
                                <tr key={item.id} className="hover:bg-[var(--color-secondary)]/5 transition-colors">
                                    <td className="p-3.5 font-medium text-[var(--color-text)]/80">{item.installmentNumber}</td>
                                    <td className="p-3.5 text-[var(--color-text)]/80">{item.dueDate}</td>
                                    <td className="p-3.5 text-right text-[var(--color-text)]">{formatVnd(item.amountDueVnd)}</td>
                                    <td className="p-3.5 text-right font-medium text-[var(--color-main)]">{formatVnd(item.amountPaidVnd)}</td>
                                    <td className="p-3.5 text-right font-bold text-[var(--color-text)]">{formatVnd(item.remainingVnd)}</td>
                                    <td className="p-3.5 text-center">
                                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border tracking-tight ${getStatusStyles(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Interactive Historic Ledger & Audit section */}
            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-bold text-base text-[var(--color-text)]">Payment History Logs</h4>
                    
                    {/* Filters Layout Block */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative flex items-center min-w-[150px]">
                            <Search className="absolute left-3 text-[var(--color-text)]/40" size={15} />
                            <input
                                type="text"
                                placeholder="Filter date..."
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-[var(--color-main)]/20 rounded-lg outline-none text-[var(--color-text)] focus:border-[var(--color-main)] transition-all"
                            />
                        </div>
                        <div className="relative flex items-center min-w-[170px]">
                            <Search className="absolute left-3 text-[var(--color-text)]/40" size={15} />
                            <input
                                type="number"
                                placeholder="Min amount (VND)..."
                                value={searchAmount}
                                onChange={(e) => setSearchAmount(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-[var(--color-main)]/20 rounded-lg outline-none text-[var(--color-text)] focus:border-[var(--color-main)] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Ledger Listing Node Render */}
                {paginatedHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-[var(--color-main)]/20 bg-[var(--color-secondary)]/5">
                        <FilterX size={28} className="text-[var(--color-text)]/30 mb-2" />
                        <p className="text-sm font-medium text-[var(--color-text)]/50">No processed records found matching filters.</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {paginatedHistory.map((payment, index) => (
                            <div 
                                key={`${payment.paidAt}-${index}`} 
                                className="flex items-center justify-between rounded-xl border border-[var(--color-main)]/15 bg-white p-4 transition-all hover:border-[var(--color-main)]/30"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-[var(--color-text)]">{payment.paidAt}</p>
                                    {payment.note && (
                                        <p className="text-xs text-[var(--color-text)]/60 bg-[var(--color-secondary)]/10 px-2 py-0.5 rounded w-max">
                                            {payment.note}
                                        </p>
                                    )}
                                </div>
                                <p className="font-extrabold text-base text-[var(--color-main)] tracking-tight">
                                    +{formatVnd(payment.amountVnd)}
                                </p>
                            </div>
                        ))}

                        {/* Custom Data Table Pagination Footer Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-[var(--color-main)]/10 pt-4 mt-2">
                                <p className="text-xs font-medium text-[var(--color-text)]/60">
                                    Showing page <span className="font-bold text-[var(--color-text)]">{currentPage}</span> of {totalPages} ({filteredHistory.length} ledger logs)
                                </p>
                                <div className="inline-flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center p-1.5 rounded-lg border border-[var(--color-main)]/20 bg-white text-[var(--color-text)]/70 hover:bg-[var(--color-secondary)]/10 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center p-1.5 rounded-lg border border-[var(--color-main)]/20 bg-white text-[var(--color-text)]/70 hover:bg-[var(--color-secondary)]/10 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}