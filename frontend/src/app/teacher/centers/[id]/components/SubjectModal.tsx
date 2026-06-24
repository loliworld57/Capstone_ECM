"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import {
  createCenterSubject,
  updateCenterSubject,
  CenterSubject,
} from "@/services/centerService";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface Props {
  centerId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subject?: CenterSubject) => void;
  subject?: CenterSubject | null;
}

export default function SubjectModal({
  centerId,
  isOpen,
  onClose,
  onSuccess,
  subject,
}: Props) {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setDescription(subject.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [subject]);

  const handleSubmit = async () => {

    if (!name.trim()) {
      toast.error("Subject name is required.");
      return;
    }

    try {

      if (subject) {
        await updateCenterSubject(centerId, subject.id, {
          name,
          description,
        });
        toast.success("Subject updated successfully");
        onSuccess(subject);
      } else {
        const newly = await createCenterSubject(centerId, {
          name,
          description,
        });
        toast.success("Subject created successfully");
        onSuccess(newly);
      }

      onClose();

    } catch {
      toast.error("Operation failed");
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in">

        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {subject ? "Edit Subject" : "Create Subject"}
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

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Subject Name <span className="text-[var(--color-negative)]">*</span>
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Mathematics"
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-secondary)] outline-none bg-white"
            />
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
            Save
          </button>

        </div>

      </div>

    </div>
  );
}