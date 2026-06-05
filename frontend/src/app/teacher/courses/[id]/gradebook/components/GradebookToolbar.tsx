import { Download, Plus, X } from "lucide-react";
import Button from "./button";

interface GradebookToolbarProps {
  editMode: boolean;
  hasChanges: boolean;
  onEditModeToggle: () => void;
  onDiscard: () => void;
  onAddCategory: () => void;
  onAddScoreItem: () => void;
  onExport: () => void;
}

export default function GradebookToolbar({
  editMode,
  hasChanges,
  onEditModeToggle,
  onDiscard,
  onAddCategory,
  onAddScoreItem,
  onExport,
}: GradebookToolbarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <Button
                variant="primary"
                onClick={onAddCategory}
                className="gap-2"
              >
                <Plus size={16} />
                Add Score Category
              </Button>
              <Button
                variant="primary"
                onClick={onAddScoreItem}
                className="gap-2"
              >
                <Plus size={16} />
                Add Score Item
              </Button>
              <Button
                variant="excel"
                onClick={onExport}
                className="gap-2"
              >
                <Download size={16} />
                Export Excel
              </Button>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Edit mode</span>
            <button
              type="button"
              onClick={onEditModeToggle}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${editMode ? "border-[var(--color-main)] bg-[var(--color-main)]" : "border-gray-300 bg-gray-200"
                }`}
              aria-label="Toggle edit mode"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${editMode ? "translate-x-7" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {editMode && hasChanges && (
            
            <Button
              onClick={onDiscard}
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <X size={16} />
              Discard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}