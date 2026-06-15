import { Download, Plus, SlidersHorizontal, X } from "lucide-react";
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
            </>
          ) : null}
        </div>

        {/* Right Controls Container: Switches state parameters */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl shadow-inner">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={13} className={editMode ? "text-indigo-600" : "text-zinc-400"} />
              <span className={`text-xs font-bold uppercase tracking-wider ${editMode ? "text-indigo-900" : "text-zinc-500"}`}>
                Edit Mode
              </span>
            </div>

            <button
              type="button"
              onClick={onEditModeToggle}
              className={`relative inline-flex h-6 w-11 items-center flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-4 focus:ring-indigo-500/10 ${editMode ? "bg-[var(--color-main,rgba(79,70,229,1))]" : "bg-zinc-200"
                }`}
              aria-label="Toggle edit mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/[0.05] transition duration-200 ease-in-out ${editMode ? "translate-x-5" : "translate-x-0"
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