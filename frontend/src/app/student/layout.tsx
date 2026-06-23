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
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [isBelowHD, setIsBelowHD] = useState(false);
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

    useEffect(() => {
        const fhdQuery = window.matchMedia("(min-width: 1920px)");
        const mobileQuery = window.matchMedia("(max-width: 1023px)");

        const handleResizeUpdate = () => {
            setIsBelowHD(mobileQuery.matches);
            if (fhdQuery.matches) {
                setCollapsed(false);
            } else {
                setCollapsed(true);
            }
        };

        handleResizeUpdate();
        fhdQuery.addEventListener("change", handleResizeUpdate);
        mobileQuery.addEventListener("change", handleResizeUpdate);

        return () => {
            fhdQuery.removeEventListener("change", handleResizeUpdate);
            mobileQuery.removeEventListener("change", handleResizeUpdate);
        };
    }, []);

    // Dismiss overlay on outside interaction across both Desktop and Mobile viewports
    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (collapsed) return;
            const target = event.target as Node | null;
            if (!target || sidebarRef.current?.contains(target)) return;
            setCollapsed(true);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [collapsed]);

    useEffect(() => {
        if (isBelowHD) setCollapsed(true);
    }, [pathname, isBelowHD]);

    const menuItems = [
        { name: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
        { name: "Courses", href: "/student/courses", icon: BookOpen },
    ];

    return (
        <div className="relative min-h-screen w-full bg-[var(--color-soft-white)] text-slate-900 selection:bg-indigo-500 selection:text-white">
            
            {/* PERSISTENT FLOATING TRIGGER ARROW BAR - Visible whenever collapsed below FHD */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="fixed left-0 z-40 flex items-center justify-center p-2.5 rounded-r-xl border-y border-r border-slate-800 text-slate-400 bg-slate-950/90 backdrop-blur-sm opacity-60 hover:opacity-100 transition-all active:scale-95 shadow-xl animate-fade-in"
                    style={{ top: "calc(var(--app-header-height, 73px) + 20px)" }}
                    aria-label="Reveal floating menu tree"
                >
                    <ChevronRight size={18} className="stroke-[3]" />
                </button>
            )}

            {/* COMPLETELY DECOUPLED INDEPENDENT FLOATING SIDEBAR OVERLAY LAYER */}
            <aside
                ref={sidebarRef}
                className={`fixed left-0 z-40 flex flex-col border-r border-slate-900 bg-slate-950 shadow-2xl transition-all duration-300 ease-in-out ${
                    collapsed 
                        ? "-translate-x-full w-0 pointer-events-none opacity-0" 
                        : "translate-x-0 w-64 opacity-100"
                }`}
                style={{
                    top: "var(--app-header-height, 73px)",
                    height: "calc(100vh - var(--app-header-height, 73px))"
                }}
            >
                <div className="flex items-center p-4 border-b border-slate-900 min-h-[73px] justify-between">
                    <div className="truncate pr-2 transition-all duration-300">
                        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">Workspace</h2>
                        <p className="text-sm font-bold text-white truncate mt-0.5">
                            {user?.firstName ? `Student: ${user.firstName}` : "Academic Portal"}
                        </p>
                    </div>

                    <button
                        onClick={() => setCollapsed(true)}
                        className="p-2 rounded-xl border border-slate-800 text-slate-400 bg-slate-900/50 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all active:scale-95 shadow-md"
                        aria-label="Collapse sidebar menu layout layer"
                    >
                        <ChevronLeft size={16} className="stroke-[2.5]" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1.5 p-3 custom-scrollbar overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-200 outline-none gap-3.5 ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/50"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
                                }`}
                            >
                                <item.icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                        isActive ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200 stroke-[2]"
                                    }`}
                                />
                                <span className="tracking-wide whitespace-nowrap transition-all duration-200 origin-left block">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* LIGHTWEIGHT MESH BACKDROP OVERLAY FOR FLUID LAYOUT CLOSURES */}
            {!collapsed && (
                <div
                    className="fixed left-0 w-screen z-30 bg-slate-950/20 backdrop-blur-[1px] transition-all duration-300"
                    onClick={() => setCollapsed(true)}
                    style={{
                        top: "var(--app-header-height, 73px)",
                        height: "calc(100vh - var(--app-header-height, 73px))"
                    }}
                />
            )}

            {/* UNBOUNDED FULL-WIDTH APPLICATION VIEWPORT CONTENT LAYER */}
            <main className="w-full min-h-[calc(100vh-var(--app-header-height,73px))] flex flex-col justify-between z-0 relative">
                <div className="container mx-auto px-4 py-6 sm:px-8 bg-[var(--color-soft-white)] sm:py-8 max-w-7xl animate-fade-in flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}