"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Sparkles,
    Loader2,
    Copy,
    Check,
    Save,
    X,
    FileText,
    Wand2
} from "lucide-react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import TiptapEditor from "@/components/TiptapEditor";

interface AiSummaryModalProps {
    materialId: number;
    existingSummary?: string;
    initialState: "INPUT" | "REVIEW";
    onSaveSuccess: () => void;
    onCancel: () => void;
}

export default function AiSummaryModal({
    materialId,
    existingSummary,
    initialState,
    onSaveSuccess,
    onCancel
}: AiSummaryModalProps) {
    const [status, setStatus] = useState<"INPUT" | "LOADING" | "REVIEW">(initialState);
    const [requirement, setRequirement] = useState("");
    const [generatedSummary, setGeneratedSummary] = useState(existingSummary || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
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

    // Helper to strip HTML tags for plain text fallback
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
            
            // Generate asynchronous blobs for both formatting options
            const htmlBlob = new Blob([generatedSummary], { type: "text/html" });
            const textBlob = new Blob([plainText], { type: "text/plain" });

            // Write both formats natively to the target system clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": htmlBlob,
                    "text/plain": textBlob,
                })
            ]);

            setIsCopied(true);
            toast.success("Rich text copied to clipboard!");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy rich text data: ", err);
            toast.error("Failed to copy formatted text.");
        }
    };

    const handleGenerate = async () => {
        setStatus("LOADING");
        try {
            const response = await api.post("/ai/generate-summary", {
                materialId: materialId,
                requirement: requirement
            }, {
                timeout: 60000
            });
            setGeneratedSummary(response.data.summary);
            setStatus("REVIEW");
        } catch (error: any) {
            console.error("AI Generation failed", error);
            const errorMessage = error.response?.data || error.message || "Failed to generate summary.";

            setAlertConfig({
                isOpen: true,
                title: "Generation Failed",
                message: errorMessage,
                confirmText: "Understood",
                onConfirm: closeAlert
            });
            setStatus("INPUT");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put(`/ai/save-summary/${materialId}`, {
                summary: generatedSummary
            });
            toast.success("Summary saved successfully!");
            onSaveSuccess();
        } catch (error) {
            console.error("Failed to save", error);
            setAlertConfig({
                isOpen: true,
                title: "Save Failed",
                message: "There was a problem saving your summary. Please try again.",
                confirmText: "Try Again",
                onConfirm: closeAlert
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        /* Screen Escape Layer Container */
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

            {/* Main Workspace Frame */}
            <div className="w-full max-w-4xl flex flex-col max-h-[85vh] text-slate-800 bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                
                {/* Header Context Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[var(--color-main)]" />
                        <span className="text-sm font-bold tracking-wide uppercase text-slate-700">
                            AI Summary Generation Hub
                        </span>
                    </div>
                    <button 
                        onClick={onCancel}
                        disabled={status === "LOADING" || isSaving}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Inner Stage Controller Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    
                    {/* STATE 1: INPUT COMPOSITION */}
                    {status === "INPUT" && (
                        <div className="space-y-4 max-w-2xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center space-y-2 mb-6">
                                <div className="inline-flex p-3 bg-[var(--color-main)]/10 rounded-full text-[var(--color-main)]">
                                    <Wand2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Customize AI Assistant Output</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    Provide custom parameters below to guide the model outline generation structural format options.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Specific Requirements <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 outline-none transition-all duration-200 resize-none shadow-xs"
                                        rows={5}
                                        maxLength={100}
                                        placeholder="e.g., Focus only on grammar rules, extract key dates, or format into clear bullet points..."
                                        value={requirement}
                                        onChange={(e) => setRequirement(e.target.value)}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400 tracking-wider">
                                        {requirement.length} / 100
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STATE 2: LOADING PROGRESS WINDOW */}
                    {status === "LOADING" && (
                        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-200">
                            <div className="relative flex items-center justify-center mb-5">
                                <div className="absolute w-14 h-14 rounded-full bg-[var(--color-main)]/10 animate-ping"></div>
                                <Loader2 className="w-9 h-9 animate-spin text-[var(--color-main)]" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 tracking-wide animate-pulse">
                                Gemini AI is processing document contents...
                            </p>
                            <p className="text-xs text-slate-400 mt-1">This may take up to a minute</p>
                        </div>
                    )}

                    {/* STATE 3: REVIEW & LIVE EDIT SURFACE */}
                    {status === "REVIEW" && (
                        <div className="space-y-3 h-full animate-in fade-in zoom-in-98 duration-200">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Interactive Editor Workspace
                                </label>

                                <button
                                    onClick={handleCopy}
                                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 ${isCopied
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    {isCopied ? <Check size={14} /> : <Copy size={13} />}
                                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                                </button>
                            </div>
                            
                            {/* Rich Tiptap Text Core Canvas Wrapper */}
                            <div className="bg-white rounded-xl shadow-xs border border-slate-100">
                                <TiptapEditor
                                    content={generatedSummary}
                                    onChange={setGeneratedSummary}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Dynamic Action Panels */}
                <div className="p-4 flex items-center justify-between gap-3 border-t border-slate-100 shrink-0 bg-slate-50/70">
                    
                    {/* Left Actions Contextual Controls */}
                    <div>
                        {status === "REVIEW" && (
                            <button
                                onClick={() => setStatus("INPUT")}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/60 px-3 py-2 rounded-xl transition-all shadow-xs active:scale-95"
                                disabled={isSaving}
                            >
                                <Sparkles size={13} />
                                <span>Regenerate with AI</span>
                            </button>
                        )}
                    </div>

                    {/* Right Confirmation Controls */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            disabled={status === "LOADING" || isSaving}
                        >
                            Cancel
                        </button>

                        {status === "INPUT" && (
                            <button
                                onClick={handleGenerate}
                                className="inline-flex items-center gap-2 bg-[var(--color-main)] text-white px-5 py-2.5 rounded-xl hover:brightness-105 font-semibold text-sm transition-all shadow-md active:scale-95"
                            >
                                <Sparkles size={15} />
                                <span>Generate Summary</span>
                            </button>
                        )}

                        {status === "REVIEW" && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !generatedSummary.trim()}
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <Save size={15} />
                                )}
                                <span>{isSaving ? "Saving changes..." : "Approve & Save"}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}