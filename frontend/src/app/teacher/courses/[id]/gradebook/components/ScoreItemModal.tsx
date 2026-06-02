"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { ScoreCategory } from "@/services/gradebookService";

interface ScoreItemModalProps {
  categories: ScoreCategory[];
  mode: "create" | "edit";
  initialData?: { name: string; categoryId: number };
  onClose: () => void;
  onCreate?: (categoryId: number, data: { name: string }) => void;
  onUpdate?: (data: { name: string; categoryId: number }) => void;
}

export default function ScoreItemModal({
  categories,
  mode,
  initialData,
  onClose,
  onCreate,
  onUpdate,
}: ScoreItemModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.categoryId || categories[0]?.id || 0
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategoryId(initialData.categoryId);
    } else {
      setName("");
      setCategoryId(categories[0]?.id || 0);
    }
  }, [initialData, categories]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Score item name is required");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      if (mode === "create" && onCreate) {
        onCreate(categoryId, { name: name.trim() });
        toast.success("Score item created successfully");
      }

      if (mode === "edit" && onUpdate) {
        onUpdate({ name: name.trim(), categoryId });
        toast.success("Score item updated successfully");
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
            {mode === "create" ? "Create Score Item" : "Edit Score Item"}
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
              Score Item Name <span className="text-[var(--color-negative)]">*</span>
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Quiz 1"
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Category
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.weight}%)
                </option>
              ))}
            </select>
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