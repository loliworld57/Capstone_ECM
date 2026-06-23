"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";
import { Sparkles, X, FileText, Copy, Check, Info } from "lucide-react";
import toast from "react-hot-toast";

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
    const [mounted, setMounted] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "OK",
        onConfirm: () => { }
    });

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    // Helper to strip HTML tags for plain text clipboard fallback
    const stripHtml = (html: string) => {
        if (typeof window === "undefined") return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    // Upgraded Rich Text Copy Handler
    const handleCopy = async () => {
        if (!generatedSummary) return;
        try {
            const plainText = stripHtml(generatedSummary);
            
            const htmlBlob = new Blob([generatedSummary], { type: "text/html" });
            const textBlob = new Blob([plainText], { type: "text/plain" });

            // Writes formatted and fallback versions concurrently
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": htmlBlob,
                    "text/plain": textBlob,
                })
            ]);

            setCopied(true);
            toast.success("Rich text copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy rich text: ", err);
            setAlertConfig({
                isOpen: true,
                title: "Copy Failed",
                message: "Could not automatically copy rich text formatting to your clipboard.",
                confirmText: "OK",
                onConfirm: closeAlert
            });
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">

            <ConfirmModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                cancelText="Close"
                onConfirm={alertConfig.onConfirm}
                onClose={closeAlert}
            />

            {/* Main Modal Surface */}
            <div className="w-full max-w-4xl flex flex-col max-h-[85vh] text-slate-800 bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">

                {/* Header Section */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[var(--color-main)]" />
                        <span className="text-sm font-bold tracking-wide uppercase text-slate-700 flex items-center gap-1.5">
                            Study Material Insight
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {generatedSummary && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-main)]/10 text-[var(--color-main)]">
                                <Sparkles className="w-3.5 h-3.5" /> AI Summary
                            </span>
                        )}
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Inner Scrollable Wrapper */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {generatedSummary ? (
                        <div className="relative border border-slate-100 rounded-xl p-6 bg-white shadow-xs min-h-[350px]">

                            {/* Floating Micro-Copy Button */}
                            <button
                                onClick={handleCopy}
                                title="Copy summary"
                                className="absolute top-4 right-4 p-2 bg-white border border-slate-200 hover:border-[var(--color-main)]/30 rounded-lg shadow-xs text-slate-500 hover:text-[var(--color-main)] active:scale-95 transition-all duration-150 z-10"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>

                            {/* FIXED: Explicit prose bullet injection fallbacks */}
                            <div
                                className="prose prose-slate max-w-none focus:outline-none text-sm leading-relaxed
                                           prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg 
                                           prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4 prose-li:my-1 prose-p:my-3
                                           [&_ul]:list-disc [&_ul]:pl-5 [&_li]:list-item"
                                dangerouslySetInnerHTML={{ __html: generatedSummary }}
                            />
                        </div>
                    ) : (
                        /* Empty State Container */
                        <div className="w-full border border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white min-h-[350px]">
                            <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                                <Info className="w-8 h-8 opacity-60" />
                            </div>
                            <h4 className="text-base font-semibold mb-1 text-slate-700">No Summary Available</h4>
                            <p className="text-sm text-slate-400 max-w-sm leading-normal">
                                An AI-generated summary is not currently available for this study material. Please check back later.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-4 flex items-center justify-between gap-3 border-t border-slate-100 shrink-0 bg-slate-50/70">
                    <button
                        onClick={onCancel}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-150"
                    >
                        <span>Close</span>
                    </button>
                    {generatedSummary && (
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-main)] hover:brightness-105 rounded-xl shadow-md active:scale-[0.98] transition-all duration-150"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}