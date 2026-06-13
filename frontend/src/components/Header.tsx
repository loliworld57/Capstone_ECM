"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Logo from "./Logo";
import type { User } from "@/services/authService";
import { Settings, LogOut, LayoutDashboard } from "lucide-react";

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const headerRef = useRef<HTMLElement | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("loginResponse");
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as { user: User };
                if (parsed.user) {
                    setUser(parsed.user);
                } else {
                    setUser(null);
                }
            } catch (e) {
                setUser(null);
            }
        } else {
            setUser(null);
        }
    }, [pathname]);

    useEffect(() => {
        const updateHeaderHeight = () => {
            const height = headerRef.current?.offsetHeight ?? 0;
            document.documentElement.style.setProperty("--app-header-height", `${height}px`);
        };

        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);

        return () => {
            window.removeEventListener("resize", updateHeaderHeight);
        };
    }, [pathname, user, showLogoutConfirm]);

    const roleName =
        typeof user?.role === "string"
            ? user.role.toString()
            : user?.role?.name;

    const dashboardHref =
        roleName === "TEACHER"
            ? "/teacher/dashboard"
            : roleName === "ADMIN"
                ? "/admin/users"
                : roleName === "STUDENT"
                    ? "/student/dashboard"
                    : "/";

    const profileHref =
        roleName === "TEACHER"
            ? "/teacher/profile"
            : roleName === "ADMIN"
                ? "/admin/profile"
                : roleName === "STUDENT"
                    ? "/student/profile"
                    : "/";

    return (
        <header 
            ref={headerRef} 
            className="sticky top-0 z-40 w-full border-b border-slate-900/40 bg-slate-950/90 backdrop-blur-md shadow-md"
        >
            {/* Top Dark Micro Banner */}
            <div className="bg-slate-900/60 border-b border-slate-800/50 py-1.5 px-4">
                <div className="container mx-auto flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="hidden sm:inline-block tracking-wide">
                        Tutoring Center Management System
                    </span>
                    <span className="mx-auto sm:mx-0 tracking-wider font-semibold uppercase text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-sm">
                        EIU Student Project
                    </span>
                </div>
            </div>

            {/* Main Interactive Command Ribbon */}
            <div className="px-4 py-3.5">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    
                    {/* Brand Anchor Logo */}
                    <Link href="/" className="flex items-center group transition-transform duration-200 active:scale-95 shrink-0">
                        <Logo className="text-white h-9 w-auto transition-colors duration-300 group-hover:text-indigo-400" />
                    </Link>

                    {/* Navigation Actions Array */}
                    <nav className="flex items-center gap-3 ml-auto">
                        {user ? (
                            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-full pl-4 pr-2 py-1 shadow-inner">
                                <span className="hidden md:inline-block text-xs font-semibold text-slate-300 tracking-tight max-w-[180px] truncate">
                                    {user.email}
                                </span>
                                
                                <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

                                <div className="flex items-center gap-1.5">
                                    <Link
                                        href={dashboardHref}
                                        className="p-1.5 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-all duration-200"
                                        title="Dashboard"
                                        aria-label="Go to dashboard"
                                    >
                                        <LayoutDashboard size={18} />
                                    </Link>
                                    
                                    <Link
                                        href={profileHref}
                                        className="p-1.5 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-all duration-200"
                                        title="Settings"
                                    >
                                        <Settings size={18} />
                                    </Link>

                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="p-1.5 text-slate-500 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link 
                                    href="/login" 
                                    className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/register" 
                                    className="bg-linear-to-r from-indigo-500 to-[var(--color-main)] hover:from-indigo-600 hover:to-[var(--color-main)] text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-950/50 transition-all transform active:scale-98"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </div>

            {/* Backdrop Modal Overlay Layer */}
            {showLogoutConfirm && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div 
                        className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-800 transform transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-4">
                            <LogOut size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 text-center">
                            Confirm Logout
                        </h3>

                        <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
                            Are you sure you want to log out? You will need to re-authenticate to access your workspace.
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2 text-sm font-bold rounded-xl border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition active:scale-98"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    localStorage.removeItem("loginResponse");
                                    localStorage.removeItem("user");
                                    setUser(null);
                                    setShowLogoutConfirm(false);
                                    router.push("/login");
                                }}
                                className="flex-1 px-4 py-2 text-sm font-bold rounded-xl text-white bg-red-500 hover:bg-red-600 transition shadow-sm active:scale-98"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}