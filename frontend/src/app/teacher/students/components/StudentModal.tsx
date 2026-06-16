"use client";

import { useState, useEffect, useRef } from "react";
import { X, Building2, Plus, Trash2 } from "lucide-react";
import {
    createStudentAuto,
    updateStudent,
    assignStudentToCenter,
    removeStudentFromCenter
} from "../../../../services/userService";
import { getMyCenters, Center } from "@/services/centerService";
import toast from "react-hot-toast";

type StudentCenter = {
    id: number;
    name: string;
};

type EditableStudent = {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    connectedCenters?: StudentCenter[];
};

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
    centerId: number | "";
};

type StudentFormErrors = Partial<Record<keyof StudentFormData, string>>;

const namePattern = /^[\p{L}\s'-]+$/u;

const getTodayDate = () => new Date().toISOString().split("T")[0];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentToEdit?: EditableStudent;
    preSelectedCenterId?: number;
}

export default function StudentModal({
    isOpen,
    onClose,
    onSuccess,
    studentToEdit,
    preSelectedCenterId
}: Props) {

    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(false);
    const [connectedCenters, setConnectedCenters] = useState<StudentCenter[]>([]);
    const originalConnectedCentersRef = useRef<StudentCenter[]>([]);
    const [pendingAddCenterIds, setPendingAddCenterIds] = useState<number[]>([]);
    const [pendingRemoveCenterIds, setPendingRemoveCenterIds] = useState<number[]>([]);
    const [newCenterId, setNewCenterId] = useState<number | "">("");
    const [errors, setErrors] = useState<StudentFormErrors>({});

    const [form, setForm] = useState<StudentFormData>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
        centerId: ""
    });

    const validateField = (name: keyof StudentFormData, value: string | number | "") => {
        switch (name) {
            case "firstName": {
                const text = String(value).trim();
                if (!text) return "First name is required.";
                if (!namePattern.test(text)) return "First name cannot contain numbers.";
                return "";
            }
            case "lastName": {
                const text = String(value).trim();
                if (!text) return "Last name is required.";
                if (!namePattern.test(text)) return "Last name cannot contain numbers.";
                return "";
            }
            case "phoneNumber": {
                const text = String(value).trim();
                if (!text) return "Phone number is required.";
                if (!/^\d{10}$/.test(text)) return "Phone number must be exactly 10 digits.";
                return "";
            }
            case "dateOfBirth": {
                const text = String(value).trim();
                if (!text) return "Date of birth is required.";
                if (text > getTodayDate()) return "Date of birth cannot be in the future.";
                return "";
            }
            case "centerId": {
                if (!studentToEdit && !value) return "Please select a center.";
                return "";
            }
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

    useEffect(() => {
        if (isOpen) {
            const fetchCenters = async () => {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const res = await getMyCenters(user.id);
                setCenters(res);
            };
            fetchCenters();
        }
    }, [isOpen]);

    useEffect(() => {

        if (!isOpen) return;

        if (studentToEdit) {
            setForm({
                firstName: studentToEdit.firstName,
                lastName: studentToEdit.lastName,
                phoneNumber: studentToEdit.phoneNumber || "",
                dateOfBirth: studentToEdit.dateOfBirth || "",
                centerId: ""
            });

            const centers = studentToEdit.connectedCenters ?? [];
            setConnectedCenters(centers);
            originalConnectedCentersRef.current = centers;
            setPendingAddCenterIds([]);
            setPendingRemoveCenterIds([]);
            setNewCenterId("");
            setErrors({});
        } else {
            setForm({
                firstName: "",
                lastName: "",
                phoneNumber: "",
                dateOfBirth: "",
                centerId: preSelectedCenterId || ""
            });

            setConnectedCenters([]);
            originalConnectedCentersRef.current = [];
            setPendingAddCenterIds([]);
            setPendingRemoveCenterIds([]);
            setNewCenterId("");
            setErrors({});
        }

    }, [isOpen, studentToEdit, preSelectedCenterId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        const nextErrors = validateForm();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setLoading(true);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const studentPayload = {
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phoneNumber,
            dateOfBirth: form.dateOfBirth,
        };

        try {

            if (studentToEdit) {

                await updateStudent(studentToEdit.id, {
                    ...studentPayload,
                    teacherId: user.id,
                });
                toast.success("Student updated successfully.");

                // Apply pending center changes only when the user clicks Save
                if (pendingRemoveCenterIds.length) {
                    await Promise.all(
                        pendingRemoveCenterIds.map(id => removeStudentFromCenter(id, studentToEdit.id))
                    );
                }

                if (pendingAddCenterIds.length) {
                    await Promise.all(
                        pendingAddCenterIds.map(id => assignStudentToCenter(id, studentToEdit.id))
                    );
                }

            } else {

                await createStudentAuto({
                    ...studentPayload,
                    centerId: form.centerId as number,
                    createdByTeacherId: user.id,
                });
                toast.success("Student created successfully.");
            }

            onSuccess();
            onClose();

        } catch (error: unknown) {
            toast.error((error as ApiError).response?.data || "Operation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (name: keyof StudentFormData, value: string | number | "") => {
        const normalizedValue = name === "phoneNumber"
            ? String(value).replace(/\D/g, "").slice(0, 10)
            : value;

        setForm((prev) => ({ ...prev, [name]: normalizedValue }));
        setErrors((prev) => ({
            ...prev,
            [name]: validateField(name, normalizedValue),
        }));
    };

    const handleAddCenter = (centerIdToAdd: number) => {
        const center = centers.find(c => c.id === centerIdToAdd);
        if (!center) return;

        const wasOriginallyConnected = originalConnectedCentersRef.current.some(
            (center) => center.id === centerIdToAdd
        );

        setConnectedCenters(prev => [...prev, center]);

        if (wasOriginallyConnected) {
            // Re-adding an originally connected center cancels a pending removal.
            setPendingRemoveCenterIds(prev => prev.filter(id => id !== centerIdToAdd));
        } else {
            // Newly added center should be assigned only when user clicks Save.
            setPendingAddCenterIds(prev => Array.from(new Set([...prev, centerIdToAdd])));
        }

        setNewCenterId("");
    };

    const handleRemoveCenter = (centerIdToRemove: number) => {
        const wasOriginallyConnected = originalConnectedCentersRef.current.some(
            (center) => center.id === centerIdToRemove
        );
        setConnectedCenters(prev => prev.filter(c => c.id !== centerIdToRemove));

        if (wasOriginallyConnected) {
            // Original center removal is staged and applied only on Save.
            setPendingRemoveCenterIds(prev => Array.from(new Set([...prev, centerIdToRemove])));
        } else {
            // Removing a just-added center cancels that pending add.
            setPendingAddCenterIds(prev => prev.filter(id => id !== centerIdToRemove));
        }
    };

    const availableCenters = centers.filter(c =>
        !connectedCenters.some((connectedCenter) => connectedCenter.id === c.id)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl space-y-6 sm:p-6">

                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3">

                    <h2 className="text-lg font-bold text-[var(--color-text)]">
                        {studentToEdit ? "Edit Student" : "Create Student"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X size={20} />
                    </button>

                </div>

                <form
                    id="student-form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    {!studentToEdit && (

                        <div>

                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                Affiliated Center <span className="text-[var(--color-negative)]">*</span>
                            </label>

                            {preSelectedCenterId ? (

                                <div className="p-3 border-2 border-[var(--color-main)] rounded-lg bg-[var(--color-soft-white)] text-sm">
                                    {centers.find((c) => c.id === preSelectedCenterId)?.name ?? "(loading...)"}
                                </div>

                            ) : (

                                <>
                                    <select
                                        required
                                        value={form.centerId}
                                        onChange={(e) => handleFieldChange("centerId", e.target.value ? Number(e.target.value) : "")}
                                        className={`w-full rounded-lg border-2 p-3 outline-none bg-white ${errors.centerId ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
                                    >

                                        <option value="">
                                            Select center
                                        </option>

                                        {centers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}

                                    </select>
                                    {errors.centerId && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.centerId}</p>}
                                </>
                            )}

                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <div>

                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                Last Name <span className="text-[var(--color-negative)]">*</span>
                            </label>

                            <input
                                required
                                value={form.lastName}
                                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                                className={`w-full rounded-lg border-2 p-3 outline-none ${errors.lastName ? "border-[var(--color-negative)]" : "border-[var(--color-main)]"}`}
                            />
                            {errors.lastName && <p className="mt-1 text-sm text-[var(--color-negative)]">{errors.lastName}</p>}

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                First Name <span className="text-[var(--color-negative)]">*</span>
                            </label>

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

                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Phone Number <span className="text-[var(--color-negative)]">*</span>
                        </label>

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

                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Date of Birth <span className="text-[var(--color-negative)]">*</span>
                        </label>

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

                    {studentToEdit && (

                        <div className="pt-4 border-t space-y-4">

                            <h4 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                                <Building2 size={18} />
                                Affiliated Centers
                            </h4>

                            <div className="space-y-2">

                                {connectedCenters.map((c) => (

                                    <div
                                        key={c.id}
                                        className="flex justify-between items-center p-3 rounded-lg border-2 border-[var(--color-main)]/30 bg-[var(--color-soft-white)]"
                                    >

                                        <span className="text-sm font-medium text-[var(--color-text)]">
                                            {c.name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCenter(c.id)}
                                            className="text-[var(--color-alert)] hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                    </div>

                                ))}

                            </div>

                            {availableCenters.length > 0 && (

                                <div className="flex flex-col gap-2 sm:flex-row">

                                    <select
                                        id="add-center-select"
                                        value={newCenterId}
                                        onChange={(e) =>
                                            setNewCenterId(e.target.value ? Number(e.target.value) : "")
                                        }
                                        className="w-full max-w-full min-w-0 p-3 border-2 border-[var(--color-main)] rounded-lg outline-none bg-white truncate"
                                    >

                                        <option value="">Select center</option>

                                        {availableCenters.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}

                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!newCenterId) return;
                                            handleAddCenter(Number(newCenterId));
                                        }}
                                        className="flex items-center justify-center gap-1 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] sm:self-start"
                                    >
                                        <Plus size={16} />
                                        Add
                                    </button>

                                </div>

                            )}
                        </div>
                    )}

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