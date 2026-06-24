"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    CalendarDays,
    Users,
    Building2,
    WalletCards,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getInvitations } from "@/services/courseService";
import { getRoleName, getStoredUser, type StoredUser } from "@/utils/auth";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<StoredUser | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    // Breakpoint state tracking
    const [isFHDAndAbove, setIsFHDAndAbove] = useState(true);

    const [pendingInvites, setPendingInvites] = useState(0);
    const sidebarRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        setUser(getStoredUser());
    }, []);

    // Fetch invitation count whenever user or route changes
    useEffect(() => {
        if (!user?.id) return;

        getInvitations(user.id)
            .then((list) => setPendingInvites(list.length))
            .catch((e) => console.error("failed to fetch invites", e));
    }, [user, pathname]);

    useEffect(() => {
        const storedUser = getStoredUser();

        if (!storedUser) {
            router.push("/login");
            return;
        }

        const roleName = getRoleName(storedUser.role);
        if (roleName !== "TEACHER") {
            router.replace("/AccessDenied");
            return;
        }
    }, [router]);

    // Handle breakpoints responsively
    useEffect(() => {
        const fhdQuery = window.matchMedia("(min-width: 1920px)");

        const handleResizeUpdate = () => {
            const matchesFHD = fhdQuery.matches;
            setIsFHDAndAbove(matchesFHD);

            // Default state behaviors: Pinned expanded on FHD+, completely hidden on smaller screens
            if (matchesFHD) {
                setCollapsed(false);
            } else {
                setCollapsed(true);
            }
        };

        handleResizeUpdate();
        fhdQuery.addEventListener("change", handleResizeUpdate);

        return () => {
            fhdQuery.removeEventListener("change", handleResizeUpdate);
        };
    }, []);

    // Dismiss overlay on outside interaction (Only applicable below FHD)
    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (isFHDAndAbove || collapsed) return;

            const target = event.target as Node | null;
            if (!target) return;
            if (sidebarRef.current?.contains(target)) return;

            setCollapsed(true);
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [collapsed, isFHDAndAbove]);

    // Auto-collapse pop-up sidebar pane after navigation on sub-FHD resolutions
    useEffect(() => {
        if (!isFHDAndAbove) {
            setCollapsed(true);
        }
    }, [pathname, isFHDAndAbove]);

    const menuItems = [
        { name: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Centers", href: "/teacher/centers", icon: Building2, notify: pendingInvites > 0 },
        { name: "Courses", href: "/teacher/courses", icon: BookOpen },
        { name: "Schedule", href: "/teacher/schedule", icon: CalendarDays },
        { name: "Students", href: "/teacher/students", icon: Users },
        { name: "Finance", href: "/teacher/finance", icon: WalletCards },
    ];

    return (
        <div className="relative min-h-screen w-full bg-[var(--color-soft-white)] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col">

            {/* FLOATING ACTION ARROW TRIGGER - Displays below FHD when menu slides away, or on FHD when mini strip isn't preferred */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="fixed z-40 flex items-center justify-center p-2.5 rounded-r-xl border-y border-r border-slate-800 text-slate-400 bg-slate-950/80 backdrop-blur-sm opacity-60 hover:opacity-100 transition-all active:scale-95 shadow-xl animate-fade-in"
                    style={{ top: "calc(var(--app-header-height, 73px) + 20px)" }}
                    aria-label="Reveal workspace menu panel"
                >
                    <ChevronRight size={18} className="stroke-[3]" />
                </button>
            )}

            {/* DECOUPLED FLOATING SIDEBAR NAVIGATION COMPONENT */}
            <aside
                ref={sidebarRef}
                className={`fixed left-0 z-50 flex flex-col border-r border-slate-900 bg-slate-950 shadow-2xl transition-all duration-300 ease-in-out ${isFHDAndAbove
                        ? collapsed
                            ? "translate-x-0 w-20" // Mini strip layout style for FHD and above screens
                            : "translate-x-0 w-64" // Fully expanded layout layout layout style
                        : collapsed
                            ? "-translate-x-full w-64 pointer-events-none opacity-0" // Completely off-screen below FHD
                            : "translate-x-0 w-64 opacity-100" // Fully open overlay drawer pane
                    }`}
                style={{
                    top: "var(--app-header-height, 73px)",
                    height: "calc(100vh - var(--app-header-height, 73px))"
                }}
            >
                {/* Header Profile Info Block */}
                <div className={`flex items-center p-4 border-b border-slate-900 min-h-[73px] transition-all ${(isFHDAndAbove && collapsed) ? "justify-center" : "justify-between"
                    }`}>
                    <div className={`truncate pr-2 transition-all duration-300 ${(isFHDAndAbove && collapsed) ? "w-0 opacity-0 pointer-events-none hidden" : "w-auto opacity-100 block"
                        }`}>
                        <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">Workspace</h2>
                        <p className="text-sm font-bold text-white truncate mt-0.5">
                            {user?.firstName ? `Faculty: ${user.firstName}` : "Academic Faculty"}
                        </p>
                    </div>

                    {/* Navigation layout controller button */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`p-2 rounded-xl border border-slate-800 text-slate-400 bg-slate-900/50 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all active:scale-95 shadow-md ${!isFHDAndAbove && collapsed ? "hidden" : "block"
                            }`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {(isFHDAndAbove && collapsed) ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
                    </button>
                </div>

                {/* Navigation Items Lists */}
                <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isMiniStrip = isFHDAndAbove && collapsed;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-200 outline-none ${isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/50"
                                        : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
                                    } ${isMiniStrip ? "justify-center" : "gap-3.5"}`}
                            >
                                <item.icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200 stroke-[2]"
                                        }`}
                                />

                                {/* Smooth label fading layout toggle */}
                                <span className={`tracking-wide whitespace-nowrap transition-all duration-200 origin-left ${isMiniStrip
                                        ? "w-0 opacity-0 pointer-events-none hidden"
                                        : "w-auto opacity-100 block"
                                    }`}>
                                    {item.name}
                                </span>

                                {/* Pure CSS Tooltips for desktop mini strip layouts */}
                                {isMiniStrip && (
                                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg opacity-0 invisible translate-x-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl z-50">
                                        {item.name}
                                    </div>
                                )}

                                {/* Notification Alert Badges */}
                                {item.notify && (
                                    <span className={`absolute rounded-full bg-rose-500 ring-[3px] ${isMiniStrip
                                            ? "top-2.5 right-4 h-2.5 w-2.5 ring-slate-950"
                                            : "right-3 h-2 w-2 ring-slate-950 group-hover:ring-slate-900"
                                        } ${isActive ? "ring-indigo-600 group-hover:ring-indigo-600" : ""} transition-all`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* BACKDROP MESH OVERLAY - Renders contextually below FHD only when the panel drawer is pulled up */}
            {!collapsed && !isFHDAndAbove && (
                <div
                    className="fixed left-0 w-screen z-30 bg-slate-950/20 backdrop-blur-[1px] transition-all duration-300"
                    onClick={() => setCollapsed(true)}
                    style={{
                        top: "var(--app-header-height, 73px)",
                        height: "calc(100vh - var(--app-header-height, 73px))"
                    }}
                />
            )}

            {/* CORE CONTENT LAYOUT ENGINE */}
            <main className="w-full min-h-[calc(100vh-var(--app-header-height,73px))] flex flex-col justify-between z-0 relative">
                <div className="container mx-auto px-4 py-6 sm:px-8 bg-[var(--color-soft-white)] sm:py-8 max-w-7xl animate-fade-in flex-1">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}