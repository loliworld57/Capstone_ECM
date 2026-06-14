"use client";

import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { assignTeacherToCourse } from "@/services/courseService";
import { getCenterTeachers, inviteTeacherToCenter } from "@/services/centerService";
import ConfirmModal from "@/components/ConfirmModal";

interface Teacher {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface Props {
  courseId: number | null;
  centerId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteTeacherModal({
  courseId,
  centerId,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filtered, setFiltered] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isCourseAssignment = courseId !== null;

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
      try {
        const data = await getCenterTeachers(centerId);
        setTeachers(data);
        setFiltered([]);
        setAssignSearch("");
        setSelectedTeacherId(null);
        setEmail("");
      } catch {
        toast.error("Failed to load teachers");
      }
    };

    fetchTeachers();
  }, [isOpen, centerId]);

  const handleSearch = (value: string) => {
    setEmail(value);
    setSelectedTeacherId(null);

    if (!value.trim()) {
      setFiltered([]);
      return;
    }

    const filteredTeachers = teachers.filter((t) =>
      `${t.firstName} ${t.lastName} ${t.email}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setFiltered(filteredTeachers);
  };

  const selectTeacher = (teacher: Teacher) => {
    setEmail(teacher.email);
    setSelectedTeacherId(teacher.id);
    setFiltered([]);
  };

  const getCurrentManagerId = () => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;

    try {
      const user = JSON.parse(userRaw);
      return Number(user?.id) || null;
    } catch {
      return null;
    }
  };

  const visibleTeachers = teachers.filter((t) => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return true;

    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    return fullName.includes(q) || t.email.toLowerCase().includes(q);
  });

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  const ensureTeacherLinkedToCenter = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = teachers.find((t) => t.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return existing;
    }

    const managerId = getCurrentManagerId();
    if (!managerId) {
      throw new Error("Manager session not found.");
    }

    const invited = await inviteTeacherToCenter(centerId, managerId, email.trim());
    const invitedTeacher = invited as Teacher;

    setTeachers((prev) => {
      const exists = prev.some((t) => t.id === invitedTeacher.id);
      return exists ? prev : [invitedTeacher, ...prev];
    });

    return invitedTeacher;
  };

  const handleAssignOrInvite = async () => {
    if (isCourseAssignment && !selectedTeacherId) {
      toast.error("Please select a teacher from this center");
      return;
    }

    if (!isCourseAssignment && !email) {
      toast.error("Please enter an email");
      return;
    }

    try {
      setLoading(true);

      const managerId = getCurrentManagerId();
      if (!managerId) {
        toast.error("Manager session not found");
        return;
      }

      if (isCourseAssignment) {
        await assignTeacherToCourse(courseId!, selectedTeacherId!, managerId);
        toast.success("Teacher assigned successfully!");
      } else {
        let teacherId = selectedTeacherId;
        if (!teacherId) {
          const linkedTeacher = await ensureTeacherLinkedToCenter();
          teacherId = linkedTeacher.id;
        }
        toast.success("Teacher invited to center successfully!");
      }

      setEmail("");
      setSelectedTeacherId(null);
      setFiltered([]);
      setConfirmOpen(false);
      onSuccess();
      onClose();
    } catch {
      toast.error(isCourseAssignment ? "Failed to assign teacher" : "Failed to invite teacher");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ConfirmModal
        isOpen={confirmOpen}
        title={isCourseAssignment ? "Confirm Assign Teacher" : "Confirm Invite Teacher"}
        message={isCourseAssignment
          ? `Assign ${selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName} (${selectedTeacher.email})` : "this teacher"} to this course?`
          : `Invite ${email} to become a teacher of this center?`}
        confirmText={isCourseAssignment ? "Assign" : "Invite"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleAssignOrInvite}
      />

      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

        <div className="bg-white rounded-xl shadow-xl w-[420px] p-6 space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Mail size={18} />
            {isCourseAssignment ? "Assign Teacher" : "Invite Teacher"}
          </h2>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isCourseAssignment ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search current center teachers"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-main)]"
            />

            <div className="max-h-56 border rounded-lg divide-y">
              {visibleTeachers.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500">No center teachers found.</div>
              ) : (
                visibleTeachers.map((teacher) => (
                  <button
                    type="button"
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacherId(teacher.id);
                      setEmail(teacher.email);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition ${selectedTeacherId === teacher.id ? "bg-[var(--color-main)]/10" : "hover:bg-gray-100"}`}
                  >
                    <div className="font-medium">
                      {teacher.firstName} {teacher.lastName}
                    </div>
                    <div className="text-gray-500 text-xs">{teacher.email}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="relative">

            <input
              type="text"
              placeholder="Search center teacher or enter teacher email"
              value={email}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--color-main)]"
            />

            {/* Teacher suggestions */}
            {filtered.length > 0 && (
              <div className="absolute w-full bg-white border rounded-lg shadow mt-1 max-h-40 overflow-y-auto z-10">

                {filtered.map((teacher) => (
                  <div
                    key={teacher.id}
                    onClick={() => selectTeacher(teacher)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="font-medium">
                      {teacher.firstName} {teacher.lastName}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {teacher.email}
                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (isCourseAssignment && !selectedTeacherId) {
                toast.error("Please select a teacher from this center");
                return;
              }
              if (!isCourseAssignment && !email.trim()) {
                toast.error("Please enter an email");
                return;
              }
              setConfirmOpen(true);
            }}
            disabled={loading}
            className="px-4 py-2 text-sm bg-[var(--color-main)] text-white rounded-lg hover:bg-[var(--color-secondary)]"
          >
            {loading ? "Saving..." : (isCourseAssignment ? "Assign Teacher" : "Invite Teacher")}
          </button>

        </div>

        </div>
      </div>
    </>
  );
}