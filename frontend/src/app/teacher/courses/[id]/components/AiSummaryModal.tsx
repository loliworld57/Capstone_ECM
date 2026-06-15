"use client";

import React, { useState } from "react";
import { 
    Sparkles, 
    Loader2, 
    RotateCcw, 
    Copy, 
    Check, 
    Save 
} from "lucide-react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

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

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "OK",
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    // Copy Content Feature
    const handleCopy = async () => {
        if (!generatedSummary) return;
        try {
            await navigator.clipboard.writeText(generatedSummary);
            setIsCopied(true);
            toast.success("Summary copied to clipboard!");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast.error("Failed to copy text.");
        }
    };

    // ACTION 1: Send to AI
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

    // ACTION 2: Save to Database
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

    return (
        <div className="w-full">
            <ConfirmModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.confirmText}
                cancelText="Close"
                onConfirm={alertConfig.onConfirm}
                onClose={closeAlert}
            />

            {/* STATE 1: INPUT */}
            {status === "INPUT" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <label className="block text-sm font-semibold text-slate-700">
                        Any specific requirements for the AI? <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 outline-none transition-all duration-200 resize-none"
                            rows={4}
                            maxLength={100}
                            placeholder="e.g., Focus only on grammar rules, or keep it under 3 bullet points..."
                            value={requirement}
                            onChange={(e) => setRequirement(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-400 tracking-wider">
                            {requirement.length} / 100
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end items-center gap-3">
                        <button 
                            onClick={onCancel} 
                            className="text-slate-500 hover:text-slate-700 font-medium text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="inline-flex items-center gap-2 bg-[var(--color-main)] text-white px-5 py-2.5 rounded-xl hover:opacity-95 font-semibold text-sm transition-all shadow-sm active:scale-95"
                        >
                            <Sparkles size={16} />
                            <span>Generate Summary</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STATE 2: LOADING */}
            {status === "LOADING" && (
                <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-200">
                    <div className="relative flex items-center justify-center mb-4">
                        <div className="absolute w-12 h-12 rounded-full bg-[var(--color-main)]/10 animate-ping"></div>
                        <Loader2 size={36} className="animate-spin text-[var(--color-main)]" />
                    </div>
                    <p className="text-slate-600 font-medium text-sm tracking-wide animate-pulse">
                        Gemini AI is analyzing your lesson...
                    </p>
                </div>
            )}

            {/* STATE 3: REVIEW & EDIT */}
            {status === "REVIEW" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-slate-700">
                            Review and Edit Summary:
                        </label>
                        
                        {/* Copy Code Feature Action Button */}
                        <button
                            onClick={handleCopy}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                                isCopied 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                            title="Copy to Clipboard"
                        >
                            {isCopied ? <Check size={14} /> : <Copy size={13} />}
                            <span>{isCopied ? "Copied!" : "Copy"}</span>
                        </button>
                    </div>

                    <textarea
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed focus:bg-white focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 outline-none transition-all duration-200"
                        rows={10}
                        value={generatedSummary}
                        onChange={(e) => setGeneratedSummary(e.target.value)}
                        disabled={isSaving}
                    />

                    <div className="pt-2 flex justify-between items-center">
                        <button
                            onClick={() => setStatus("INPUT")}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/60 px-3.5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                            disabled={isSaving}
                        >
                            <RotateCcw size={13} />
                            <span>Regenerate</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onCancel} 
                                className="text-slate-500 hover:text-slate-700 font-medium text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !generatedSummary.trim()}
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                <span>{isSaving ? "Saving..." : "Approve & Save"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}