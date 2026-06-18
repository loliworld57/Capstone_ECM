"use client";

import React, { useState } from "react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";
import { Sparkles, Loader2, X, FileText, Copy, Check } from "lucide-react";

interface AiSummaryModalProps {
    materialId: number;
    existingSummary?: string;
    onCancel: () => void;
}

export default function AiSummaryModalStudent({
    materialId,
    existingSummary,
    onCancel
}: AiSummaryModalProps) {
    const [generatedSummary] = useState(existingSummary || "");
    const [copied, setCopied] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "OK",
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    // Copy Content Handler
    const handleCopy = async () => {
        if (!generatedSummary) return;
        try {
            await navigator.clipboard.writeText(generatedSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            setAlertConfig({
                isOpen: true,
                title: "Copy Failed",
                message: "Could not automatically copy text to clipboard.",
                confirmText: "OK",
                onConfirm: closeAlert
            });
        }
    };

    return (
        <div className="w-full space-y-4 text-[var(--color-text)]">
            <ConfirmModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                cancelText="Close"
                onConfirm={alertConfig.onConfirm}
                onClose={closeAlert}
            />

            {/* Header / Context Label */}
            <div className="flex items-center justify-between border-b border-[var(--color-main)]/10 pb-3">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--color-main)]" />
                    <label className="text-sm font-semibold tracking-wide uppercase opacity-80">
                        Study Material Insight
                    </label>
                </div>
                {generatedSummary && (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-main)]/10 text-[var(--color-main)]">
                            <Sparkles className="w-3.5 h-3.5" /> AI Summary
                        </span>
                    </div>
                )}
            </div>

            {/* Content Container Area */}
            <div className="relative group">
                {generatedSummary ? (
                    <div className="relative">
                        <textarea
                            className="w-full bg-white border border-[var(--color-main)]/10 rounded-xl p-4 pr-12 text-sm leading-relaxed text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-main)]/40 focus:border-[var(--color-main)] transition-all outline-none shadow-sm resize-none"
                            rows={12}
                            value={generatedSummary}
                            readOnly
                        />
                        {/* Floating Micro-Copy Button */}
                        <button
                            onClick={handleCopy}
                            title="Copy summary"
                            className="absolute top-3 right-3 p-2 bg-[var(--color-soft-white)] border border-[var(--color-main)]/10 hover:border-[var(--color-main)]/30 rounded-lg shadow-sm text-[var(--color-text)]/70 hover:text-[var(--color-main)] active:scale-95 transition-all duration-150"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-600 animate-scaleIn" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                ) : (
                    /* Elegant Empty State inside text boundaries if summary hasn't been generated yet */
                    <div className="w-full border border-dashed border-[var(--color-main)]/20 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 min-h-[220px]">
                        <div className="p-3 bg-[var(--color-main)]/5 rounded-full mb-3 text-[var(--color-main)]">
                            <Sparkles className="w-6 h-6 opacity-40" />
                        </div>
                        <h4 className="text-sm font-semibold mb-1">No Summary Available</h4>
                        <p className="text-xs text-[var(--color-text)]/60 max-w-xs leading-normal">
                            An AI-generated summary is not currently available for this study material. Please check back later.
                        </p>
                    </div>
                )}
            </div>

            {/* Action Bar Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[var(--color-main)]/5">
                <button
                    onClick={onCancel}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--color-text)]/70 hover:text-[var(--color-text)] hover:bg-black/5 rounded-xl transition-all duration-150"
                >
                    <X className="w-4 h-4" />
                    Close View
                </button>

                {generatedSummary && (
                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[var(--color-main)] hover:brightness-110 rounded-xl shadow-md hover:shadow-lg hover:shadow-[var(--color-main)]/10 active:scale-[0.98] transition-all duration-150"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy Full Text
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}