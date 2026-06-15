"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, type User as AuthUser } from "@/services/authService";
import { getApiErrorMessage } from "@/utils/axiosConfig";
import toast from "react-hot-toast";
import { Lock, Mail, Loader2 } from "lucide-react";
import LockedAccountModal from '@/components/LockedAccountModal';
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showLockedModal, setShowLockedModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const getRoleName = (role: AuthUser["role"]) => {
        return typeof role === "string" ? role : role?.name;
    };

    const getVerificationRecipientLabel = (value: string) => {
        const username = value.split("@")[0]?.trim();
        if (!username) return "your personal email";
        return `${username}'s personal email`;
    };

    // Redirect away if already logged in
    useEffect(() => {
        const stored = localStorage.getItem("loginResponse");
        if (stored) {
            try {
                const { user } = JSON.parse(stored);
                const roleName = getRoleName(user?.role);
                if (roleName) {
                    if (roleName === "TEACHER") router.replace("/teacher/dashboard");
                    else if (roleName === "STUDENT") router.replace("/student/dashboard");
                    else if (roleName === "ADMIN") router.replace("/admin/users");
                    else router.replace("/");
                }
            } catch { }
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setShowLockedModal(false);

        try {
            const loginResponse = await loginUser(email, password);
            localStorage.setItem("loginResponse", JSON.stringify({ ...loginResponse, loginTime: Date.now() }));

            const user = loginResponse.user;
            const roleName = getRoleName(user?.role);

            toast.success(`Hello ${user.firstName} ${user.lastName}!`);
            localStorage.setItem("user", JSON.stringify(user));

            setTimeout(() => {
                if (roleName === "TEACHER") router.push("/teacher/dashboard");
                else if (roleName === "STUDENT") router.push("/student/dashboard");
                else if (roleName === "ADMIN") router.push("/admin/users");
                else router.push("/");
            }, 1000);

        } catch (error: unknown) {
            console.error("Login Error:", error);
            const msg = getApiErrorMessage(error);

            if (typeof msg === 'string' && msg.includes("ACCOUNT_DEACTIVATED")) {
                toast(() => (
                    <div>
                        <p className="font-bold">Your account is temporarily locked / unverified.</p>
                        <p className="text-sm">A new OTP has been sent to your email address.</p>
                    </div>
                ), { duration: 5000, icon: '🔄' });

                setTimeout(() => {
                    router.push(
                        `/verify?email=${encodeURIComponent(email)}&recipient=${encodeURIComponent(getVerificationRecipientLabel(email))}`
                    );
                }, 2000);
            }
            else if (typeof msg === 'string' && msg.toLowerCase().includes("locked")) {
                setShowLockedModal(true);
            }
            else if (typeof msg === 'string' && msg.includes("PENDING_VERIFICATION")) {
                router.push(
                    `/verify?email=${encodeURIComponent(email)}&recipient=${encodeURIComponent(getVerificationRecipientLabel(email))}`
                );
            } else {
                setErrorMessage(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
            
            {/* Soft geometric background grid layer */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            <LockedAccountModal
                isOpen={showLockedModal}
                onClose={() => setShowLockedModal(false)}
            />

            {/* Core Authentic Form Container Card */}
            <div className="w-full max-w-[420px] bg-white border border-gray-200/70 rounded-2xl p-6 sm:p-10 shadow-xl shadow-gray-100/40 relative z-10 transition-all duration-300">
                
                {/* Branding Block Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-[var(--color-main)] text-white shadow-md shadow-indigo-500/10">
                        <Lock size={22} className="stroke-[2.2]" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">Sign In to ECM</h2>
                    <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Education Center Management</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    
                    {/* Input Block: Email address */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
                            <span>Email Address</span>
                            <span className="text-red-500 text-sm">*</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/30 p-3 pl-11 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium"
                                placeholder="name@ecm.edu.vn"
                            />
                        </div>
                    </div>

                    {/* Input Block: Security Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center justify-between">
                            <span>Password</span>
                            <span className="text-red-500 text-sm">*</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/30 p-3 pl-11 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition duration-200 font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Error Alerts */}
                    {errorMessage && (
                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-3.5 text-xs font-medium text-red-600 leading-relaxed">
                            {errorMessage}
                        </div>
                    )}

                    {/* Submission Core CTA */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full relative inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-[var(--color-main)] text-white text-sm font-bold p-3.5 shadow-md shadow-indigo-500/10 hover:opacity-95 active:scale-98 transition transform duration-150 ${
                            loading ? "cursor-not-allowed opacity-75" : ""
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Verifying credentials...</span>
                            </>
                        ) : (
                            <span>Continue</span>
                        )}
                    </button>
                </form>

                {/* Registration Deep Link redirection path */}
                <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                    Don&apos;t have an account?{" "}
                    <Link 
                        href="/register" 
                        className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-600 transition-colors"
                    >
                        Go to register
                    </Link>
                </p>
            </div>
        </div>
    );
}