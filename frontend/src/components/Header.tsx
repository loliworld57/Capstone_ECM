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
        // run on mount and route changes so header reflects login state
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
        <header ref={headerRef} className="sticky top-0 z-40 text-white shadow-md">
            <div className="bg-[var(--color-soft-white)]">
                <div className="container flex flex-col gap-1 py-2 text-[var(--color-text)] sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/" className="text-xl leading-tight font-bold sm:text-2xl lg:text-3xl">
                    Tutoring Center Management Application
                    </Link>

                    <p className="text-xs font-normal opacity-70 sm:text-sm">
                        A project by EIU Students
                    </p>
                </div>
            </div>
            <div className="bg-linear-to-r from-indigo-500 from-5% via-[var(--color-main)] via-50% to-indigo-500 to-95%">
                <div className="container flex flex-wrap items-center justify-between gap-3 py-2">
                    <Link href="/" className="flex items-center">
                        <Logo className="text-white" />
                    </Link>
                    <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        {user ? (
                            <>
                                <span className="max-w-full break-all text-sm opacity-80 sm:text-base">
                                    {user.email}
                                </span>
                                <Link
                                    href={dashboardHref}
                                    className="inline-flex items-center"
                                    title="Dashboard"
                                    aria-label="Go to dashboard"
                                >
                                    <LayoutDashboard size={28} className="transition hover:scale-110 hover:text-[var(--color-secondary)]" />
                                </Link>
                                <Link
                                    href={profileHref}
                                    className="inline-flex items-center">
                                    <Settings size={32} className="transition hover:scale-110 hover:text-[var(--color-secondary)]" />
                                </Link>

                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="inline-flex items-center"
                                    title="Logout"
                                >
                                    <LogOut size={32} className="transition hover:scale-110 hover:text-[var(--color-alert)]" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="loginBtn">
                                    Login
                                </Link>
                                <Link href="/register" className="regBtn">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-[var(--color-main)]/20 flex items-center justify-center z-50"
                    onClick={() => setShowLogoutConfirm(false)}>

                    <div className="bg-white rounded-xl p-6 w-80 shadow-xl text-center"
                        onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">
                            Confirm Logout
                        </h3>

                        <p className="mb-6 text-[var(--color-text)]">
                            Are you sure you want to log out?
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-1 font-bold rounded-lg border-2 border-[var(--color-main)] text-[var(--color-soft-white)] bg-[var(--color-main)]  hover:bg-[var(--color-soft-white)] hover:text-[var(--color-main)] transition"
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
                                className="px-4 py-1 font-bold rounded-lg border-2 border-[var(--color-alert)] text-[var(--color-alert)] bg-[var(--color-soft-white)]  hover:bg-[var(--color-alert)] hover:text-[var(--color-soft-white)] transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}