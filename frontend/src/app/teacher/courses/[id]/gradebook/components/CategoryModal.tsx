"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface CategoryModalProps {
  mode: "create" | "edit";
  initialData?: { name: string; weight: number };
  onClose: () => void;
  onCreate?: (data: { name: string; weight: number }) => void;
  onUpdate?: (data: { name: string; weight: number }) => void;
}

export default function CategoryModal({
  mode,
  initialData,
  onClose,
  onCreate,
  onUpdate,
}: CategoryModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [weight, setWeight] = useState(initialData?.weight || 0);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (weight < 0 || weight > 100) {
      toast.error("Weight must be between 0 and 100");
      return;
    }

    if (weight % 5 !== 0) {
      toast.error("Weight must be divisible by 5");
      return;
    }

    const data = { name: name.trim(), weight };

    try {
      if (mode === "create" && onCreate) {
        onCreate(data);
        toast.success("Category created successfully");
      }

      if (mode === "edit" && onUpdate) {
        onUpdate(data);
        toast.success("Category updated successfully");
      }

      onClose();
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in">

        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {mode === "create" ? "Create Category" : "Edit Category"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Category Name <span className="text-[var(--color-negative)]">*</span>
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quiz, Assignment, Final Exam"
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Weight (%)
            </label>

            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            />

            <p className="text-xs text-gray-500 mt-1">
              Must be divisible by 5
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white px-4 py-2 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition"
          >
            {mode === "create" ? "Create" : "Save"}
          </button>

        </div>

      </div>
    </div>
  );
}