import React, { useState, useEffect } from "react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";

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

    // Start with the state passed from the parent's button click
    const [status, setStatus] = useState<"INPUT" | "LOADING" | "REVIEW">(initialState);
    const [requirement, setRequirement] = useState("");
    const [generatedSummary, setGeneratedSummary] = useState(existingSummary || "");
    const [isSaving, setIsSaving] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "OK",
        onConfirm: () => { }
    });

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    // ACTION 1: Send to AI
    const handleGenerate = async () => {
        setStatus("LOADING");
        try {
            const response = await api.post("/ai/generate-summary", {
                materialId: materialId, // Pass the ID instead of text!
                requirement: requirement
            }, {
                timeout: 60000 // Give the AI up to 60 seconds to process large PDFs!
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
            onSaveSuccess(); // Closes modal and refreshes table in the parent
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

    // --- RENDER JUST THE CONTENT (No outer modal wrapper) ---
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Any specific requirements for the AI? (Optional)
                    </label>
                    <textarea
                        className="w-full border rounded-md p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        maxLength={100}
                        placeholder="e.g., Focus only on grammar rules, or keep it under 3 bullet points..."
                        value={requirement}
                        onChange={(e) => setRequirement(e.target.value)}
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                        {requirement.length} / 100
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 px-4 py-2">
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-semibold transition-all"
                        >
                            ✨ Generate Summary
                        </button>
                    </div>
                </div>
            )}

            {/* STATE 2: LOADING */}
            {status === "LOADING" && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium animate-pulse">
                        Gemini AI is analyzing your lesson...
                    </p>
                </div>
            )}

            {/* STATE 3: REVIEW & EDIT */}
            {status === "REVIEW" && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review and Edit Summary:
                    </label>
                    <textarea
                        className="w-full border rounded-md p-3 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                        rows={8}
                        value={generatedSummary}
                        onChange={(e) => setGeneratedSummary(e.target.value)}
                    />

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => setStatus("INPUT")}
                            className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium bg-gray-100 rounded-md"
                            disabled={isSaving}
                        >
                            🔄 Regenerate
                        </button>

                        <div className="flex gap-2">
                            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 px-4 py-2">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold transition-all disabled:bg-gray-400"
                            >
                                {isSaving ? "Saving..." : "💾 Approve & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}