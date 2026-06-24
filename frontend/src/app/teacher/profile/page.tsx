"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/axiosConfig";
import toast from "react-hot-toast";
import axios from "axios";
import { clearStoredAuth, getStoredUser, persistStoredUser } from "@/utils/auth";
import {
    User,
    Phone,
    Mail,
    Calendar,
    Save,
    AlertTriangle,
    Lock,
    X,
    Eye,
    EyeClosed,
} from "lucide-react";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface UserProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    personalEmail: string;
    phoneNumber: string;
    dateOfBirth: string;
    role: { name: string };
    avatarImg: string;
}

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPersonalEmail, setShowPersonalEmail] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const [passData, setPassData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
    });

    const isEmpty = (value?: string) => {
        return !value || value.trim() === "";
    };

    useEffect(() => {
        const storedUser = getStoredUser();

        if (!storedUser?.id) {
            router.push("/login");
            return;
        }

        let isMounted = true;

        const loadProfile = async () => {
            try {
                const response = await api.get<UserProfile>(`/users/${storedUser.id}`);

                if (!isMounted) {
                    return;
                }

                setUser(response.data);
                setFormData({
                    firstName: response.data.firstName || "",
                    lastName: response.data.lastName || "",
                    phoneNumber: response.data.phoneNumber || "",
                    dateOfBirth: response.data.dateOfBirth || "",
                });
                persistStoredUser(response.data);
            } catch (error) {
                if (!axios.isAxiosError(error)) {
                    toast.error("Failed to load profile.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);

        try {
            const response = await api.put(`/users/${user.id}/profile`, formData);

            const updatedUser = { ...user, ...response.data };

            persistStoredUser(updatedUser);
            setUser(updatedUser);

            toast.success("Profile updated successfully!");
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data || "Failed to update profile.");
            } else {
                toast.error("Unexpected error occurred.");
            }
        }
        finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        setShowDeactivateModal(true);
    };

    const confirmDeactivate = async () => {
        if (!user) return;

        try {
            await api.post(`/users/${user.id}/deactivate`);

            toast.success("Account deactivated.");

            clearStoredAuth();

            setTimeout(() => {
                router.replace("/login");
            }, 1500);
        } catch {
            toast.error("Unable to deactivate account.");
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        if (!passData.oldPassword || !passData.newPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (passData.newPassword !== passData.confirmPassword) {
            toast.error("Password confirmation does not match.");
            return;
        }

        if (passData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        try {
            await api.put(`/users/${user.id}/change-password`, {
                oldPassword: passData.oldPassword,
                newPassword: passData.newPassword,
            });

            toast.success("Password changed successfully!");

            setShowPasswordModal(false);
            setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(String(error.response?.data || "Password change failed."));
            } else {
                toast.error("Password change failed.");
            }
        }
    };

    useLockBodyScroll(showPasswordModal);

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 bg-[var(--color-soft-white)] p-8 rounded-xl shadow-sm">


            {/* HEADER */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        Personal Information
                    </h1>
                    <p className="text-sm text-[var(--color-text)]/70">
                        Manage your personal details and security
                    </p>
                </div>

                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] border-2 border-[var(--color-main)] transition"
                >
                    <Lock size={16} /> Change Password
                </button>
            </div>

            {/* PROFILE CARD */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-[var(--color-main)]/20 overflow-hidden">

                <div className="p-6 border-b border-[var(--color-main)]/20 bg-[var(--color-soft-white)] flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-[var(--color-text)]">
                        <User size={20} className="text-[var(--color-main)]" />
                        Basic Information
                    </h3>

                    <span className="px-3 py-1 bg-[var(--color-secondary)]/20 text-[var(--color-main)] text-xl font-bold rounded-full">
                        {user?.role.name}
                    </span>
                </div>

                <form
                    onSubmit={handleSave}
                    className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* FIRST NAME */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Last name <span className="text-[var(--color-negative)]">*</span>
                        </label>
                        <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`w-full p-3 pl-10 border-2 rounded-lg outline-none 
                                    ${isEmpty(formData.firstName)
                                    ? "border-[var(--color-negative)]"
                                    : "border-[var(--color-main)]"}
                                        focus:ring-2 focus:ring-[var(--color-secondary)]`} />
                    </div>

                    {/* LAST NAME */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            First name <span className="text-[var(--color-negative)]">*</span>
                        </label>
                        <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`w-full p-3 pl-10 border-2 rounded-lg outline-none 
                                    ${isEmpty(formData.lastName)
                                    ? "border-[var(--color-negative)]"
                                    : "border-[var(--color-main)]"}
                                        focus:ring-2 focus:ring-[var(--color-secondary)]`} />
                    </div>

                    {/* LOGIN EMAIL */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Login Email
                        </label>

                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-main)]"
                            />

                            <input
                                value={user?.email}
                                disabled
                                className="w-full p-3 pl-10 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                            />
                        </div>
                    </div>

                    {/* PERSONAL EMAIL */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Personal Email
                        </label>

                        <div className="relative">
                            <Mail
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-main)]"
                            />

                            <input
                                type={showPersonalEmail ? "text" : "password"}
                                value={user?.personalEmail || ""}
                                disabled
                                className={`w-full p-3 pl-10 pr-10 border-2 rounded-lg bg-gray-100 text-gray-500
                                        ${isEmpty(user?.personalEmail)
                                        ? "border-[var(--color-negative)]"
                                        : "border-gray-300"}`}
                            />

                            {/* SHOW / HIDE BUTTON */}
                            <button
                                type="button"
                                onClick={() => setShowPersonalEmail(!showPersonalEmail)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                            >
                                {showPersonalEmail ? <Eye size={20} /> : <EyeClosed size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* PHONE */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Phone Number <span className="text-[var(--color-negative)]">*</span>
                        </label>

                        <div className="relative">
                            <Phone
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-main)]"
                            />

                            <input
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className={`w-full p-3 pl-10 border-2 rounded-lg outline-none 
                                    ${isEmpty(formData.phoneNumber)
                                        ? "border-[var(--color-negative)]"
                                        : "border-[var(--color-main)]"}
                                        focus:ring-2 focus:ring-[var(--color-secondary)]`}
                            />
                        </div>
                    </div>

                    {/* DOB */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            Date of Birth <span className="text-[var(--color-negative)]">*</span>
                        </label>

                        <div className="relative">
                            <Calendar
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-main)]"
                            />

                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className={`w-full p-3 pl-10 border-2 rounded-lg outline-none 
                                    ${isEmpty(formData.dateOfBirth)
                                        ? "border-[var(--color-negative)]"
                                        : "border-[var(--color-main)]"}
                                        focus:ring-2 focus:ring-[var(--color-secondary)]`} />
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-[var(--color-main)] border-2 border-[var(--color-main)] text-white py-3 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-[var(--color-negative)]/10 rounded-xl border-2 border-[var(--color-negative)]/30 p-6 flex justify-between items-center">

                <div>
                    <h3 className="font-bold text-[var(--color-negative)]">
                        Danger Zone
                    </h3>

                    <p className="text-sm text-[var(--color-text)]/70">
                        Deactivate your account. You cannot login again until admin
                        reactivates it.
                    </p>
                </div>

                <button
                    onClick={handleDeactivate}
                    className="flex items-center gap-2 border-2 border-[var(--color-negative)] text-[var(--color-negative)] px-4 py-2 rounded-lg hover:bg-[var(--color-negative)] hover:text-white transition"
                >
                    <AlertTriangle size={18} />
                    Deactivate
                </button>
            </div>

            {/* PASSWORD MODAL */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl p-6 w-96 shadow-lg">

                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-lg">Change Password</h3>

                            <button onClick={() => setShowPasswordModal(false)}>
                                <X />
                            </button>
                        </div>

                        <div className="space-y-4">

                            <input
                                type="password"
                                placeholder="Old password *"
                                className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-alert)]"
                                value={passData.oldPassword}
                                onChange={(e) =>
                                    setPassData({ ...passData, oldPassword: e.target.value })
                                }
                            />

                            <input
                                type="password"
                                placeholder="New password *"
                                className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-alert)]"
                                value={passData.newPassword}
                                onChange={(e) =>
                                    setPassData({ ...passData, newPassword: e.target.value })
                                }
                            />

                            <input
                                type="password"
                                placeholder="Confirm password *"
                                className="w-full p-3 border-2 border-[var(--color-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-alert)]"
                                value={passData.confirmPassword}
                                onChange={(e) =>
                                    setPassData({
                                        ...passData,
                                        confirmPassword: e.target.value,
                                    })
                                }
                            />

                            <button
                                onClick={handleChangePassword}
                                className="w-full bg-[var(--color-main)] text-white py-3 rounded-lg font-bold hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] border-2 border-[var(--color-main)] transition"
                            >
                                Confirm Change
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {/* DEACTIVATE MODAL */}
            {showDeactivateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[400px] text-center shadow-lg">
                        <h2 className="text-xl font-bold mb-3 text-[var(--color-negative)]">Deactivate Account</h2>
                        <p className="text-gray-600 mb-6">
                            WARNING: Are you sure you want to deactivate your account?<br /><br />
                            You will not be able to log in again until an Admin reactivates it.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeactivateModal(false)}
                                className="flex-1 bg-[var(--color-soft-white)] border-2 border-[var(--color-main)] text-[var(--color-main)] px-4 py-2 rounded-lg font-semibold hover:bg-[var(--color-main)] hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeactivate}
                                className="flex-1 bg-[var(--color-negative)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[var(--color-negative-hover)] hover:text-[var(--color-alert)] border-2 border-[var(--color-negative)] transition"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}