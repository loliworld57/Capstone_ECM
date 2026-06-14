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
    const compactSidebarQuery = "(max-width: 1919px)";
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<StoredUser | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [isCompactSidebar, setIsCompactSidebar] = useState(false);
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

    const menuItems = [
        { name: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Centers", href: "/teacher/centers", icon: Building2, notify: pendingInvites > 0 },
        { name: "Courses", href: "/teacher/courses", icon: BookOpen },
        { name: "Schedule", href: "/teacher/schedule", icon: CalendarDays },
        { name: "Students", href: "/teacher/students", icon: Users },
        { name: "Finance", href: "/teacher/finance", icon: WalletCards },
    ];

    const isFullyHidden = isCompactSidebar && collapsed;

    return (
        <div className="flex h-[calc(100vh-var(--app-header-height,0px))] w-full overflow-hidden bg-[var(--color-soft-white)] text-slate-900">
            
            {/* HIGH-CONTRAST DARK SIDEBAR */}
            <aside
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-950 bg-slate-950 shadow-2xl transition-all duration-300 xl:sticky ${
                    isFullyHidden 
                        ? "-translate-x-full xl:translate-x-0 xl:w-16" 
                        : collapsed 
                        ? "w-20" 
                        : "w-64"
                }`}
            >
                {/* Header Profile Plate */}
                <div className={`flex items-center p-4 border-b border-slate-900 min-h-[73px] bg-black/40 ${
                    collapsed ? "justify-center" : "justify-between"
                }`}>
                    {!collapsed && (
                        <div className="truncate pr-2">
                            <h2 className="text-sm font-black text-white tracking-wider uppercase">Workspace</h2>
                            <p className="text-xs font-bold text-indigo-400 truncate mt-0.5">
                                {user?.firstName ? `Faculty: ${user.firstName}` : "Academic Faculty"}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-200 bg-slate-900 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-95 shadow-lg"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
                    </button>
                </div>

                {/* High-Contrast Navigation Links array */}
                <nav className="flex-1 space-y-2 p-3 overflow-y-auto bg-slate-950">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative flex items-center rounded-xl p-3 text-sm font-bold transition-all duration-150 outline-none ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-xl border border-indigo-500"
                                        : "text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent"
                                } ${collapsed ? "justify-center" : "gap-3.5"}`}
                            >
                                {/* Active Left Contrast Anchor Tab */}
                                {isActive && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-md bg-white animate-fade-in" />
                                )}

                                <item.icon 
                                    size={18} 
                                    className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                                        isActive ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-white stroke-[2]"
                                    }`} 
                                />

                                <span className={`tracking-wide transition-opacity duration-200 ${collapsed ? "hidden" : "block"}`}>
                                    {item.name}
                                </span>

                                {/* Notification Alert Badge */}
                                {item.notify && (
                                    <span className={`absolute rounded-full bg-rose-500 ring-4 ${
                                        collapsed 
                                            ? "top-2 right-4 h-3 w-3 ring-slate-950" 
                                            : "right-3 h-2.5 w-2.5 ring-slate-950 group-hover:ring-slate-900"
                                    } ${isActive ? "ring-indigo-600 group-hover:ring-indigo-600" : ""}`} />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Navigation Backdrop Mesh */}
            {!isFullyHidden && (
                <div 
                    className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm xl:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* MAIN CONTENT VIEWPORT */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 sm:px-8 bg-[var(--color-soft-white)] sm:py-8 max-w-7xl">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}