"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/utils/axiosConfig";
import { getStoredUser, persistStoredUser } from "@/utils/auth";
import {
	Calendar,
	Lock,
	Mail,
	Phone,
	ShieldCheck,
	User,
	X,
} from "lucide-react";
import { useLockBodyScroll } from "@/hook/useLockBodyScroll";

interface StudentUser {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	dateOfBirth?: string;
	role?: string | { id?: number; name?: string };
}

export default function StudentProfilePage() {
	const router = useRouter();
	const [user, setUser] = useState<StudentUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);
	const [passData, setPassData] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		const storedUser = getStoredUser();

		if (!storedUser?.id) {
			router.push("/login");
			return;
		}

		let isMounted = true;

		const loadProfile = async () => {
			try {
				const response = await api.get<StudentUser>(`/users/${storedUser.id}`);

				if (!isMounted) {
					return;
				}

				setUser(response.data);
				persistStoredUser(response.data);
			} catch (error) {
				if (!axios.isAxiosError(error)) {
					toast.error("Unable to load profile.");
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

	const roleLabel = typeof user?.role === "string" ? user.role : user?.role?.name;

	const handleChangePassword = async () => {
		if (!user) {
			return;
		}

		if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
			toast.error("Please fill in all password fields.");
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
			setChangingPassword(true);
			await api.put(`/users/${user.id}/change-password`, {
				oldPassword: passData.oldPassword,
				newPassword: passData.newPassword,
			});

			toast.success("Password changed successfully.");
			setShowPasswordModal(false);
			setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				toast.error(String(error.response?.data || "Unable to change password."));
			} else {
				toast.error("Unable to change password.");
			}
		} finally {
			setChangingPassword(false);
		}
	};

	useLockBodyScroll(showPasswordModal);

	if (loading) {
		return <div className="p-10 text-center text-[var(--color-text)]">Loading profile...</div>;
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">


			<div className="flex flex-col gap-4 rounded-2xl border-2 border-[var(--color-main)] bg-[var(--color-soft-white)] p-6 shadow-sm md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-text)]">
						<User className="text-[var(--color-main)]" />
						Profile Settings
					</h1>
					<p className="mt-2 text-sm text-[var(--color-text)]/70">
						Students can view account information here and change their password only.
					</p>
				</div>

				<button
					type="button"
					onClick={() => setShowPasswordModal(true)}
					className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)]"
				>
					<Lock size={18} />
					Change Password
				</button>
			</div>

			<div className="rounded-2xl border-2 border-[var(--color-main)]/20 bg-white shadow-sm overflow-hidden">
				<div className="flex items-center justify-between border-b border-[var(--color-main)]/15 bg-[var(--color-soft-white)] px-6 py-4">
					<h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
						<ShieldCheck size={20} className="text-[var(--color-main)]" />
						Account Information
					</h2>

					<span className="rounded-full bg-[var(--color-secondary)]/15 px-3 py-1 text-sm font-semibold text-[var(--color-main)]">
						{roleLabel || "STUDENT"}
					</span>
				</div>

				<div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
					<div className="space-y-2 rounded-xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4">
						<span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/60">
							Last Name
						</span>
						<div className="flex items-center gap-3 text-[var(--color-text)]">
							<User size={18} className="text-[var(--color-main)]" />
							<span className="font-semibold">{user?.lastName || "-"}</span>
						</div>
					</div>

					<div className="space-y-2 rounded-xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4">
						<span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/60">
							First Name
						</span>
						<div className="flex items-center gap-3 text-[var(--color-text)]">
							<User size={18} className="text-[var(--color-main)]" />
							<span className="font-semibold">{user?.firstName || "-"}</span>
						</div>
					</div>

					<div className="space-y-2 rounded-xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4 md:col-span-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/60">
							Login Email
						</span>
						<div className="flex items-center gap-3 text-[var(--color-text)]">
							<Mail size={18} className="text-[var(--color-main)]" />
							<span className="font-semibold break-all">{user?.email || "-"}</span>
						</div>
					</div>

					<div className="space-y-2 rounded-xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4">
						<span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/60">
							Phone Number
						</span>
						<div className="flex items-center gap-3 text-[var(--color-text)]">
							<Phone size={18} className="text-[var(--color-main)]" />
							<span className="font-semibold">{user?.phoneNumber || "Not available"}</span>
						</div>
					</div>

					<div className="space-y-2 rounded-xl border border-[var(--color-main)]/15 bg-[var(--color-soft-white)] p-4">
						<span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text)]/60">
							Date Of Birth
						</span>
						<div className="flex items-center gap-3 text-[var(--color-text)]">
							<Calendar size={18} className="text-[var(--color-main)]" />
							<span className="font-semibold">{user?.dateOfBirth || "Not available"}</span>
						</div>
					</div>
				</div>
			</div>

			{showPasswordModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
						<div className="mb-4 flex items-center justify-between border-b pb-3">
							<h3 className="text-lg font-bold text-[var(--color-text)]">Change Password</h3>
							<button
								type="button"
								onClick={() => setShowPasswordModal(false)}
								className="rounded-lg p-1 text-[var(--color-text)]/70 transition hover:bg-gray-100 hover:text-[var(--color-text)]"
							>
								<X size={20} />
							</button>
						</div>

						<div className="space-y-4">
							<input
								type="password"
								placeholder="Old password *"
								value={passData.oldPassword}
								onChange={(event) => setPassData({ ...passData, oldPassword: event.target.value })}
								className="w-full rounded-lg border-2 border-[var(--color-main)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
							/>

							<input
								type="password"
								placeholder="New password *"
								value={passData.newPassword}
								onChange={(event) => setPassData({ ...passData, newPassword: event.target.value })}
								className="w-full rounded-lg border-2 border-[var(--color-main)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
							/>

							<input
								type="password"
								placeholder="Confirm password *"
								value={passData.confirmPassword}
								onChange={(event) => setPassData({ ...passData, confirmPassword: event.target.value })}
								className="w-full rounded-lg border-2 border-[var(--color-main)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
							/>

							<button
								type="button"
								onClick={handleChangePassword}
								disabled={changingPassword}
								className="w-full rounded-lg border-2 border-[var(--color-main)] bg-[var(--color-main)] py-3 font-bold text-white transition hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] disabled:cursor-not-allowed disabled:opacity-70"
							>
								{changingPassword ? "Changing..." : "Confirm Change"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
