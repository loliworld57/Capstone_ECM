import { useState } from "react";
import { X } from "lucide-react";
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
  const [name, setName] = useState(initialData?.name || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || 0));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Score item name is required");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    if (mode === "create" && onCreate) {
      onCreate(categoryId, { name: name.trim() });
    } else if (mode === "edit" && onUpdate) {
      onUpdate({ name: name.trim(), categoryId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "create" ? "Add Score Item" : "Edit Score Item"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Score Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Quiz 1, Homework 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.weight}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {mode === "create" ? "Add" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
