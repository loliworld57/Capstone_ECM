"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createStudentAuto } from "@/services/userService";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

type ApiError = {
	response?: {
		data?: string;
	};
};

type StudentFormData = {
	firstName: string;
	lastName: string;
	phoneNumber: string;
	dateOfBirth: string;
};

type StudentFormErrors = Partial<Record<keyof StudentFormData, string>>;

const namePattern = /^[\p{L}\s'-]+$/u;
const getTodayDate = () => new Date().toISOString().split("T")[0];

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	centerId: number;
}

export default function StudentModal({ isOpen, onClose, onSuccess, centerId }: Props) {
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState<StudentFormData>({
		firstName: "",
		lastName: "",
		phoneNumber: "",
		dateOfBirth: "",
	});
	const [errors, setErrors] = useState<StudentFormErrors>({});

	const validateField = (name: keyof StudentFormData, value: string) => {
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
			case "phoneNumber":
				if (!trimmedValue) return "Phone number is required.";
				if (!/^\d{10}$/.test(trimmedValue)) return "Phone number must be exactly 10 digits.";
				return "";
			case "dateOfBirth":
				if (!trimmedValue) return "Date of birth is required.";
				if (trimmedValue > getTodayDate()) return "Date of birth cannot be in the future.";
				return "";
			default:
				return "";
		}
	};

	const validateForm = () => {
		const nextErrors: StudentFormErrors = {};

		(Object.keys(form) as Array<keyof StudentFormData>).forEach((fieldName) => {
			const message = validateField(fieldName, form[fieldName]);
			if (message) {
				nextErrors[fieldName] = message;
			}
		});

		return nextErrors;
	};

	const handleFieldChange = (name: keyof StudentFormData, value: string) => {
		const nextValue = name === "phoneNumber"
			? value.replace(/\D/g, "").slice(0, 10)
			: value;

		setForm((prev) => ({ ...prev, [name]: nextValue }));
		setErrors((prev) => ({
			...prev,
			[name]: validateField(name, nextValue),
		}));
	};

	useEffect(() => {
		if (!isOpen) return;
		setForm({
			firstName: "",
			lastName: "",
			phoneNumber: "",
			dateOfBirth: "",
		});
		setErrors({});
	}, [isOpen]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const nextErrors = validateForm();
		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			return;
		}

		try {
			setLoading(true);
			const user = JSON.parse(localStorage.getItem("user") || "{}");
			await createStudentAuto({
				...form,
				centerId,
				createdByTeacherId: user.id,
			});
			toast.success("Student created successfully.");
			onSuccess();
			onClose();
		} catch (error: unknown) {
			toast.error((error as ApiError).response?.data || "Failed to create student.");
		} finally {
			setLoading(false);
		}
	};


	return (
		<div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl space-y-5 sm:p-6">
				<div className="flex justify-between items-center border-b pb-3">
					<h3 className="text-lg font-bold text-[var(--color-text)]">Create New Student</h3>
					<button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Last Name <span className="text-[var(--color-negative)]">*</span></label>
							<input
								required
								value={form.lastName}
								onChange={(e) => handleFieldChange("lastName", e.target.value)}
								className={`w-full rounded-lg border-2 p-3 outline-none ${errors.lastName ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
							/>
							{errors.lastName && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.lastName}</p>}
						</div>

						<div>
							<label className="block text-sm font-medium text-[var(--color-text)] mb-1">First Name <span className="text-[var(--color-negative)]">*</span></label>
							<input
								required
								value={form.firstName}
								onChange={(e) => handleFieldChange("firstName", e.target.value)}
								className={`w-full rounded-lg border-2 p-3 outline-none ${errors.firstName ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
							/>
							{errors.firstName && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.firstName}</p>}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Phone Number <span className="text-[var(--color-negative)]">*</span></label>
						<input
							required
							inputMode="numeric"
							maxLength={10}
							value={form.phoneNumber}
							onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
							className={`w-full rounded-lg border-2 p-3 outline-none ${errors.phoneNumber ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
						/>
						{errors.phoneNumber && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.phoneNumber}</p>}
					</div>

					<div>
						<label className="block text-sm font-medium text-[var(--color-text)] mb-1">Date of Birth <span className="text-[var(--color-negative)]">*</span></label>
						<input
							type="date"
							required
							max={getTodayDate()}
							value={form.dateOfBirth}
							onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
							className={`w-full rounded-lg border-2 p-3 outline-none ${errors.dateOfBirth ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
						/>
						{errors.dateOfBirth && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.dateOfBirth}</p>}
					</div>

					<div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50 sm:w-auto"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] px-4 py-2 font-bold text-white transition hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] disabled:opacity-50 sm:w-auto"
						>
							{loading ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
