"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { PaymentPlanType, saveTuitionAccount, StudentTuition } from "@/services/financeService";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface Props {
    tuition: StudentTuition;
    onSaved: () => Promise<void>;
    onClose: () => void;
}

type CustomInstallment = { dueDate: string; amountDueVnd: string };

export default function TuitionPlanEditor({ tuition, onSaved, onClose }: Props) {



    const [planType, setPlanType] = useState<PaymentPlanType>(tuition.paymentPlanType || "FULL_COURSE");
    const [startDate, setStartDate] = useState(tuition.planStartDate || new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(tuition.planEndDate || startDate);
    const [monthlyAmount, setMonthlyAmount] = useState("");
    const [totalSessions, setTotalSessions] = useState(String(tuition.totalSessions || ""));
    const [purchasedSessions, setPurchasedSessions] = useState(String(tuition.purchasedSessions || ""));
    const [customInstallments, setCustomInstallments] = useState<CustomInstallment[]>(
        tuition.paymentPlanType === "CUSTOM_PLAN" && tuition.installments.length
            ? tuition.installments.map((item) => ({ dueDate: item.dueDate, amountDueVnd: String(item.amountDueVnd) }))
            : [{ dueDate: startDate, amountDueVnd: String(tuition.finalTuitionVnd) }]
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (planType === "CUSTOM_PLAN" && customInstallments.length === 0) {
            setCustomInstallments([{ dueDate: startDate, amountDueVnd: String(tuition.finalTuitionVnd) }]);
        }
    }, [planType, customInstallments.length, startDate, tuition.finalTuitionVnd]);

    const customTotal = customInstallments.reduce((sum, item) => sum + (Number(item.amountDueVnd) || 0), 0);

    const handleSave = async () => {
        if (!startDate || !endDate) {
            toast.error("Start date and end date are required.");
            return;
        }
        if (planType === "CUSTOM_PLAN" && customTotal !== tuition.finalTuitionVnd) {
            toast.error("Custom installment total must equal final tuition.");
            return;
        }
        if (planType === "SESSION_PACKAGE" && (!Number(purchasedSessions) || Number(purchasedSessions) <= 0)) {
            toast.error("Purchased sessions must be greater than zero.");
            return;
        }

        try {
            setSaving(true);
            await saveTuitionAccount({
                enrollmentId: tuition.enrollmentId,
                paymentPlanType: planType,
                startDate,
                endDate,
                monthlyAmountVnd: planType === "MONTHLY" && monthlyAmount ? Number(monthlyAmount) : undefined,
                totalSessions: planType === "SESSION_PACKAGE" && totalSessions ? Number(totalSessions) : undefined,
                purchasedSessions: planType === "SESSION_PACKAGE" ? Number(purchasedSessions) : undefined,
                installments: planType === "CUSTOM_PLAN"
                    ? customInstallments.map((item) => ({ dueDate: item.dueDate, amountDueVnd: Number(item.amountDueVnd) }))
                    : undefined,
            });
            toast.success("Tuition plan saved.");
            await onSaved();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Unable to save tuition plan.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--color-main)] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[var(--color-main)]/20 p-5">
                    <div>
                        <h3 className="font-bold text-[var(--color-text)]">Configure Tuition Plan</h3>
                        <p className="text-sm text-gray-500">{tuition.courseName}</p>
                    </div>
                    <button onClick={onClose} className="rounded p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
                </div>

                <div className="space-y-4 p-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Payment plan</label>
                        <select value={planType} onChange={(event) => setPlanType(event.target.value as PaymentPlanType)} className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none">
                            <option value="FULL_COURSE">Full Course</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="SESSION_PACKAGE">Session Package</option>
                            <option value="CUSTOM_PLAN">Custom Plan</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Start date</label>
                            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">End date</label>
                            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none" />
                        </div>
                    </div>

                    {planType === "MONTHLY" && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">Monthly amount (optional)</label>
                            <input type="number" min={1} value={monthlyAmount} onChange={(event) => setMonthlyAmount(event.target.value)} placeholder="Automatically divided when empty" className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none" />
                        </div>
                    )}

                    {planType === "SESSION_PACKAGE" && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Course sessions</label>
                                <input type="number" min={1} value={totalSessions} onChange={(event) => setTotalSessions(event.target.value)} className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Purchased sessions</label>
                                <input type="number" min={1} value={purchasedSessions} onChange={(event) => setPurchasedSessions(event.target.value)} className="w-full rounded-lg border border-[var(--color-main)]/30 p-3 outline-none" />
                            </div>
                        </div>
                    )}

                    {planType === "CUSTOM_PLAN" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">Custom installments</h4>
                                    <p className="text-xs text-gray-500">Total: {customTotal.toLocaleString("vi-VN")} / {tuition.finalTuitionVnd.toLocaleString("vi-VN")} VND</p>
                                </div>
                                <button onClick={() => setCustomInstallments((items) => [...items, { dueDate: endDate, amountDueVnd: "" }])} className="inline-flex items-center gap-2 rounded border border-[var(--color-main)] px-3 py-2 text-sm text-[var(--color-main)]">
                                    <Plus size={15} /> Add installment
                                </button>
                            </div>
                            {customInstallments.map((item, index) => (
                                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                    <input type="date" value={item.dueDate} onChange={(event) => setCustomInstallments((items) => items.map((current, currentIndex) => currentIndex === index ? { ...current, dueDate: event.target.value } : current))} className="rounded border border-[var(--color-main)]/30 p-2" />
                                    <input type="number" min={1} value={item.amountDueVnd} onChange={(event) => setCustomInstallments((items) => items.map((current, currentIndex) => currentIndex === index ? { ...current, amountDueVnd: event.target.value } : current))} placeholder="Amount" className="rounded border border-[var(--color-main)]/30 p-2" />
                                    <button onClick={() => setCustomInstallments((items) => items.filter((_, currentIndex) => currentIndex !== index))} className="rounded border border-[var(--color-alert)] p-2 text-[var(--color-alert)]"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-[var(--color-main)]/20 p-5">
                    <button onClick={onClose} className="rounded-lg border border-[var(--color-main)] px-4 py-2 text-[var(--color-main)]">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] px-4 py-2 font-semibold text-white hover:bg-white hover:text-[var(--color-main)] disabled:opacity-60">
                        <Save size={16} /> {saving ? "Saving..." : "Save Plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
