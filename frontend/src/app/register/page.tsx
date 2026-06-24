"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerTeacher } from "@/services/authService";
import toast from "react-hot-toast";
import { UserPlus, Mail, Phone, User, Loader2 } from "lucide-react";

type ApiError = {
  response?: {
    data?: string;
  };
};

type RegisterFormData = {
  firstName: string;
  lastName: string;
  personalEmail: string;
  phoneNumber: string;
};

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

const namePattern = /^[\p{L}\s'-]+$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [redirectEmail, setRedirectEmail] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    const stored = localStorage.getItem("loginResponse");
    if (stored) {
      try {
        const { user } = JSON.parse(stored);
        if (user?.role?.toString() === "TEACHER") {
          router.replace("/teacher/dashboard");
        } else if (user?.role?.toString() === "STUDENT") {
          router.replace("/student/dashboard");
        } else if (user?.role?.toString() === "ADMIN") {
          router.replace("/admin/users");
        } else {
          router.replace("/");
        }
      } catch { }
    }
  }, [router]);

  useEffect(() => {
    if (!redirectEmail) return;

    toast.success("OTP code sent. Redirecting to verification...", {
      duration: 2500,
    });

    const timeoutId = window.setTimeout(() => {
      router.replace(`/verify?email=${encodeURIComponent(redirectEmail)}`);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [redirectEmail, router]);

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    personalEmail: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const validateField = (name: keyof RegisterFormData, value: string) => {
    const trimmedValue = value.trim();

    switch (name) {
      case "firstName":
        if (!trimmedValue) return "First name is required.";
        if (!namePattern.test(trimmedValue)) return "First name cannot contain numbers.";
        return "";
      case "lastName":
        if (!trimmedValue) return "Last name is required.";
        if (!namePattern.test(trimmedValue)) return "Last name cannot contain numbers.";
        return "";
      case "personalEmail":
        if (!trimmedValue) return "Personal email is required.";
        if (!emailPattern.test(trimmedValue)) return "Personal email must be in email form.";
        return "";
      case "phoneNumber":
        if (!trimmedValue) return "Phone number is required.";
        if (!/^\d{10}$/.test(trimmedValue)) return "Phone number only accepts 10 digits.";
        return "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const nextErrors: RegisterFormErrors = {};

    (Object.keys(formData) as Array<keyof RegisterFormData>).forEach((fieldName) => {
      const message = validateField(fieldName, formData[fieldName]);
      if (message) {
        nextErrors[fieldName] = message;
      }
    });

    return nextErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof RegisterFormData;
    const nextValue = fieldName === "phoneNumber"
      ? value.replace(/\D/g, "").slice(0, 10)
      : value;

    setFormData((prev) => ({ ...prev, [fieldName]: nextValue }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: validateField(fieldName, nextValue),
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await registerTeacher(formData);
      setRedirectEmail(formData.personalEmail);
    } catch (error: unknown) {
      console.error(error);
      const msg = (error as ApiError).response?.data || "Sign up failed. Please try again.";
      if (typeof msg === 'string' && msg.includes("PENDING_VERIFICATION")) {
        toast("This account is waiting for verification. Redirecting to OTP verification...", {
          duration: 2500,
          icon: '⚠️',
        });
        setRedirectEmail(formData.personalEmail);
      } else {
        toast.error(typeof msg === "string" ? msg : "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">

      {/* Background visual structural layer */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Main Registration Panel Card */}
      <div className="w-full max-w-[460px] bg-white border border-gray-200/70 rounded-2xl p-6 sm:p-10 shadow-xl shadow-gray-100/40 relative z-10 transition-all duration-300">

        {/* Registration Title Block */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-[var(--color-main)] text-white shadow-md shadow-indigo-500/10">
            <UserPlus size={22} className="stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Create Account</h2>
          <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">
            Join Education Management Center
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>

          {/* First Name & Last Name Split Row */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full sm:w-1/2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
                <span>First Name</span>
                <span className="text-red-500 text-sm">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User size={16} />
                </div>
                <input
                  name="firstName"
                  required
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full rounded-xl border p-3 pl-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium ${errors.firstName
                      ? "border-red-400 bg-red-50/10 focus:border-red-500"
                      : "border-gray-200 bg-gray-50/30 focus:border-indigo-500"
                    }`}
                />
              </div>
              {errors.firstName && <p className="text-xs font-semibold text-red-500 pl-1">{errors.firstName}</p>}
            </div>

            <div className="w-full sm:w-1/2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
                <span>Last Name</span>
                <span className="text-red-500 text-sm">*</span>
              </label>
              <input
                name="lastName"
                required
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className={`block w-full rounded-xl border p-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium ${errors.lastName
                    ? "border-red-400 bg-red-50/10 focus:border-red-500"
                    : "border-gray-200 bg-gray-50/30 focus:border-indigo-500"
                  }`}
              />
              {errors.lastName && <p className="text-xs font-semibold text-red-500 pl-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Input Block: Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <span>Personal Email</span>
              <span className="text-red-500 text-sm">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Mail size={16} />
              </div>
              <input
                name="personalEmail"
                type="email"
                required
                placeholder="name@example.com"
                value={formData.personalEmail}
                onChange={handleChange}
                className={`block w-full rounded-xl border p-3 pl-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium ${errors.personalEmail
                    ? "border-red-400 bg-red-50/10 focus:border-red-500"
                    : "border-gray-200 bg-gray-50/30 focus:border-indigo-500"
                  }`}
              />
            </div>
            {errors.personalEmail && <p className="text-xs font-semibold text-red-500 pl-1">{errors.personalEmail}</p>}
          </div>

          {/* Input Block: Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <span>Phone Number</span>
              <span className="text-red-500 text-sm">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Phone size={16} />
              </div>
              <input
                name="phoneNumber"
                required
                inputMode="numeric"
                maxLength={10}
                placeholder="0912345678"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`block w-full rounded-xl border p-3 pl-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium ${errors.phoneNumber
                    ? "border-red-400 bg-red-50/10 focus:border-red-500"
                    : "border-gray-200 bg-gray-50/30 focus:border-indigo-500"
                  }`}
              />
            </div>
            {errors.phoneNumber && <p className="text-xs font-semibold text-red-500 pl-1">{errors.phoneNumber}</p>}
          </div>

          {/* Submit Action Container */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 relative inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-[var(--color-main)] text-white text-sm font-bold p-3.5 shadow-md shadow-indigo-500/10 hover:opacity-95 active:scale-98 transition transform duration-150 ${loading ? "cursor-not-allowed opacity-75" : ""
              }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>

          {/* Alternative Entry Navigation Route */}
          <p className="mt-6 text-center text-sm text-gray-500 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-600 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}