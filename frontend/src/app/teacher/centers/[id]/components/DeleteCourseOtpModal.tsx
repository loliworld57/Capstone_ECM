"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { confirmDeleteCourseWithOtp, requestDeleteCourseOtp } from "@/services/courseService";

interface Props {
  isOpen: boolean;
  courseId: number | null;
  courseName?: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteCourseOtpModal({
  isOpen,
  courseId,
  courseName,
  onClose,
  onDeleted,
}: Props) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setOtp(new Array(6).fill(""));
      setOtpSent(false);
      setSendingOtp(false);
      setDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen, otpSent]);

  const managerId = useMemo(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;

    try {
      const parsed = JSON.parse(rawUser);
      return Number(parsed?.id) || null;
    } catch {
      return null;
    }
  }, []);

  const handleSendOtp = async () => {
    if (!courseId) return;
    if (!managerId) {
      toast.error("Manager session not found");
      return;
    }

    try {
      setSendingOtp(true);
      await requestDeleteCourseOtp(courseId, managerId);
      setOtpSent(true);
      setOtp(new Array(6).fill(""));
      toast.success("OTP sent to owner personal email.");
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data ||
        "Cannot send OTP right now. Please try again.";
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (!/^\d+$/.test(pastedData)) return;

    const pastedArray = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];

    pastedArray.forEach((char, index) => {
      newOtp[index] = char;
    });

    setOtp(newOtp);

    const lastIndex = pastedArray.length - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseId) return;
    if (!managerId) {
      toast.error("Manager session not found");
      return;
    }
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    try {
      setDeleting(true);
      await confirmDeleteCourseWithOtp(courseId, managerId, code);
      toast.success("Course archived successfully!");
      onDeleted();
      onClose();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data ||
        "Wrong OTP or failed to delete course.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !courseId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-main)] bg-[var(--color-soft-white)] shadow-xl">
        <div className="border-b border-[var(--color-main)]/20 px-5 py-4">
          <h4 className="text-lg font-bold text-[var(--color-text)]">Archive Course</h4>
        </div>  

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-[var(--color-text)]">
            You are archiving <span className="font-semibold">{courseName || "this course"}</span>.
            The course must already be ended and must not have any active classes.
            Enrollment and finance history will remain available and the course can be restored later.
          </p>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || deleting}
            className="w-full rounded-lg border border-[var(--color-main)] bg-[var(--color-main)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendingOtp ? "Sending OTP..." : (otpSent ? "Resend OTP" : "Send OTP To Owner Email")}
          </button>

          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                placeholder="-"
                aria-label={`OTP digit ${index + 1}`}
                disabled={!otpSent || deleting}
                className="h-14 w-12 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-soft-white)] text-center text-2xl font-bold text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-alert)] focus:ring-2 focus:ring-blue-200"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-[var(--color-main)] px-4 py-2 text-sm font-medium text-[var(--color-main)] transition hover:bg-[var(--color-main)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={!otpSent || deleting || otp.some((d) => !d)}
            className="rounded-lg border border-[var(--color-alert)] bg-[var(--color-alert)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-soft-white)] hover:text-[var(--color-alert)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Archiving..." : "Confirm Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}
