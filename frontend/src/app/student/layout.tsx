"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRoleName, getStoredUser } from "@/utils/auth";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const compactSidebarQuery = "(max-width: 1919px)";
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [isCompactSidebar, setIsCompactSidebar] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const storedUser = getStoredUser();

        if (!storedUser) {
            router.push("/login");
            return;
        }

        const roleName = getRoleName(storedUser.role);
        if (roleName !== "STUDENT") {
            router.replace("/AccessDenied");
            return;
        }

        setUser(storedUser);
    }, [router]);

    // Handle responsive breakpoint compact constraints
    useEffect(() => {
        const mediaQuery = window.matchMedia(compactSidebarQuery);

        const updateCompactSidebar = (event: MediaQueryList | MediaQueryListEvent) => {
            const matches = event.matches;
            setIsCompactSidebar(matches);
            setCollapsed(matches);
        };

        updateCompactSidebar(mediaQuery);
        mediaQuery.addEventListener("change", updateCompactSidebar);

        return () => {
            mediaQuery.removeEventListener("change", updateCompactSidebar);
        };
    }, []);

    // Dismiss expanded mobile sidebar on outside interaction
    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (collapsed) return;

            const target = event.target as Node | null;
            if (!target) return;

            if (sidebarRef.current?.contains(target)) return;

            setCollapsed(true);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [collapsed]);

    // Automatically close the mobile sidebar drawer after selecting a navigation route
    useEffect(() => {
        if (isCompactSidebar) {
            setCollapsed(true);
        }
    }, [pathname, isCompactSidebar]);

    const menuItems = [
        { name: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
        { name: "Courses", href: "/student/courses", icon: BookOpen },
    ];

    const isFullyHidden = isCompactSidebar && collapsed;

    return (
        <div className="flex min-h-screen w-full bg-[var(--color-soft-white)] text-slate-900 selection:bg-indigo-500 selection:text-white flex-col xl:flex-row">
            
            {/* FLOATING ACTION ARROW BUTTON FOR COMPACT/MOBILE VIEWPORTS */}
            {isFullyHidden && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="fixed top-[14vh] left-0 z-40 flex items-center justify-center p-2.5 rounded-r-xl border-y border-r border-slate-800 text-slate-400 bg-slate-950/80 backdrop-blur-sm opacity-30 hover:opacity-100 transition-all active:scale-95 shadow-xl xl:hidden animate-fade-in"
                    aria-label="Reveal workspace links panel"
                >
                    <ChevronRight size={18} className="stroke-[3]" />
                </button>
            )}

            {/* HIGH-CONTRAST DARK SIDEBAR */}
            <aside
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-900 bg-slate-950 shadow-2xl transition-all duration-300 ease-in-out xl:sticky xl:top-0 xl:h-[100vh] ${
                    isCompactSidebar
                        ? collapsed
                            ? "-translate-x-full"
                            : "translate-x-0 w-64 h-full"
                        : collapsed
                            ? "w-20"
                            : "w-64"
                }`}
            >
                {/* Header Profile Plate */}
                <div className={`flex items-center p-4 border-b border-slate-900 min-h-[73px] transition-all ${
                    collapsed && !isCompactSidebar ? "justify-center" : "justify-between"
                }`}>
                    <div className={`truncate pr-2 transition-all duration-300 ${
                        collapsed && !isCompactSidebar ? "w-0 opacity-0 pointer-events-none hidden" : "w-auto opacity-100 block"
                    }`}>
                        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">Workspace</h2>
                        <p className="text-sm font-bold text-white truncate mt-0.5">
                            {user?.firstName ? `Student: ${user.firstName}` : "Academic Portal"}
                        </p>
                    </div>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-xl border border-slate-800 text-slate-400 bg-slate-900/50 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all active:scale-95 shadow-md"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
                    </button>
                </div>

                {/* High-Contrast Navigation Links */}
                <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-200 outline-none ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/50"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
                                } ${(!isCompactSidebar && collapsed) ? "justify-center" : "gap-3.5"}`}
                            >
                                <item.icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                        isActive ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200 stroke-[2]"
                                    }`}
                                />

                                {/* Smooth Width/Opacity text transition */}
                                <span className={`tracking-wide whitespace-nowrap transition-all duration-200 origin-left ${
                                    (!isCompactSidebar && collapsed) 
                                        ? "w-0 opacity-0 pointer-events-none hidden" 
                                        : "w-auto opacity-100 block"
                                }`}>
                                    {item.name}
                                </span>

                                {/* Pure CSS Tooltip when sidebar is collapsed (Desktop Only) */}
                                {!isCompactSidebar && collapsed && (
                                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg opacity-0 invisible translate-x-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl z-50">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Navigation Backdrop Mesh */}
            {!isFullyHidden && (
                <div
                    className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-md xl:hidden transition-all duration-300"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* MAIN CONTENT VIEWPORT */}
            <main className="flex-1 min-w-0 w-full">
                <div className="container mx-auto px-4 py-6 sm:px-8 bg-[var(--color-soft-white)] sm:py-8 max-w-7xl animate-fade-in">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}