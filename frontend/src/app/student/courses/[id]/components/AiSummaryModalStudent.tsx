import React, { useState, useEffect } from "react";
import api from "@/utils/axiosConfig";
import ConfirmModal from "@/components/ConfirmModal";

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
    const [generatedSummary, setGeneratedSummary] = useState(existingSummary || "");

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
        try {
            const response = await api.post("/ai/generate-summary", {
                materialId: materialId, // Pass the ID instead of text!
            }, {
                timeout: 60000 // Give the AI up to 60 seconds to process large PDFs!
            });
            setGeneratedSummary(response.data.summary);

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

            <label className="block text-sm font-medium text-gray-700 mb-2">
                View Summary:
            </label>
            <textarea
                className="w-full border rounded-md p-3 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                rows={8}
                value={generatedSummary}
                readOnly
            />

            <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 px-4 py-2">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}