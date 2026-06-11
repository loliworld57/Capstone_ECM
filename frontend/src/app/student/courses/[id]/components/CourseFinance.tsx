"use client";

import { useEffect, useState } from "react";
import { ReceiptText, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import { formatVnd, getMyTuition, StudentTuition } from "@/services/financeService";

interface Props {
    courseId: number;
}

export default function CourseFinance({ courseId }: Props) {
    const [tuition, setTuition] = useState<StudentTuition | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="rounded-xl bg-white p-6 text-center text-gray-500">Loading tuition information...</div>;
    }

    if (!tuition) {
        return <div className="rounded-xl bg-white p-6 text-center text-gray-500">No tuition information is available for this course.</div>;
    }

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
                    <WalletCards size={20} className="text-[var(--color-main)]" />
                    Tuition Summary
                </h3>
                <p className="text-sm text-gray-500">This page only shows payments recorded by your tutor center.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-text)]">{tuition.paymentPlanType.replace("_", " ")}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Final Tuition</p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-main)]">{formatVnd(tuition.finalTuitionVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Paid</p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-text)]">{formatVnd(tuition.totalPaidVnd)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-4">
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="mt-1 text-lg font-bold text-[var(--color-alert)]">{formatVnd(tuition.remainingVnd)}</p>
                </div>
            </div>

            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-5">
                <h4 className="mb-3 flex items-center gap-2 font-bold text-[var(--color-text)]">
                    <ReceiptText size={18} className="text-[var(--color-main)]" />
                    Payment Schedule
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-secondary)]/10">
                            <tr>
                                <th className="p-3">No.</th>
                                <th className="p-3">Due Date</th>
                                <th className="p-3 text-right">Due</th>
                                <th className="p-3 text-right">Paid</th>
                                <th className="p-3 text-right">Remaining</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tuition.installments.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                    <td className="p-3">{item.installmentNumber}</td>
                                    <td className="p-3">{item.dueDate}</td>
                                    <td className="p-3 text-right">{formatVnd(item.amountDueVnd)}</td>
                                    <td className="p-3 text-right">{formatVnd(item.amountPaidVnd)}</td>
                                    <td className="p-3 text-right font-semibold">{formatVnd(item.remainingVnd)}</td>
                                    <td className="p-3">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-xl border border-[var(--color-main)]/20 bg-white p-5">
                <h4 className="mb-3 font-bold text-[var(--color-text)]">Payment History</h4>
                {tuition.paymentHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No payments have been recorded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {tuition.paymentHistory.map((payment, index) => (
                            <div key={`${payment.paidAt}-${index}`} className="flex items-center justify-between rounded-lg border border-[var(--color-main)]/20 p-3">
                                <div>
                                    <p className="font-medium text-[var(--color-text)]">{payment.paidAt}</p>
                                    {payment.note && <p className="text-xs text-gray-500">{payment.note}</p>}
                                </div>
                                <p className="font-bold text-[var(--color-main)]">{formatVnd(payment.amountVnd)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
