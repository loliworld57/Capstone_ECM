import { useState } from "react";
import { X } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    if (weight < 0 || weight > 100) {
      setError("Weight must be between 0 and 100");
      return;
    }

    if (weight % 5 !== 0) {
      setError("Weight must be divisible by 5");
      return;
    }

    const data = { name: name.trim(), weight };

    if (mode === "create" && onCreate) {
      onCreate(data);
    } else if (mode === "edit" && onUpdate) {
      onUpdate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "create" ? "Add Category" : "Edit Category"}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Assignment, Quiz, Final Exam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be divisible by 5</p>
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
