"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    CalendarDays,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
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
        const mediaQuery = window.matchMedia(compactSidebarQuery);

        const updateCompactSidebar = (event: MediaQueryList | MediaQueryListEvent) => {
            const matches = event.matches;
            setIsCompactSidebar(matches);

            if (matches) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        };

        updateCompactSidebar(mediaQuery);
        mediaQuery.addEventListener("change", updateCompactSidebar);

        return () => {
            mediaQuery.removeEventListener("change", updateCompactSidebar);
        };
    }, []);

    const menuItems = [
        { name: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
        { name: "Courses", href: "/student/courses", icon: BookOpen },
    ];

    const hideAllSidebarContent = isCompactSidebar && collapsed;
    const hideSidebarLabels = collapsed;
    const sidebarWidthClass = hideAllSidebarContent ? "w-6" : collapsed ? "w-20" : "w-64";
    const showDesktopCollapsedRail = collapsed && !isCompactSidebar;
    const sidebarBackgroundWidthClass = hideAllSidebarContent ? "w-0" : collapsed ? "w-20" : "w-64";
    const sidebarClassName = hideAllSidebarContent
        ? `teacher-sidebar-fixed ${sidebarWidthClass} flex flex-col items-center bg-transparent shadow-none transition-all duration-300`
        : `teacher-sidebar-fixed ${sidebarWidthClass} flex flex-col bg-[var(--color-main)] transition-all duration-300`;

    return (
        <div className="relative min-h-0 flex-1 bg-gray-100">
            <div className={`teacher-sidebar-column ${sidebarBackgroundWidthClass} bg-[var(--color-main)] shadow-lg transition-all duration-300`} />

            {/* SIDEBAR */}
            <aside className={sidebarClassName}>
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className={`flex items-center ${hideAllSidebarContent ? "justify-center pt-3" : `border-b p-3 ${collapsed ? "justify-center" : "justify-between"}`}`}>
                        {!collapsed && (
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-soft-white)]">
                                    Dashboard
                                </h1>
                                <p className="mt-1 text-sm text-[var(--color-soft-white)]">
                                    Student: {user?.firstName}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`${hideAllSidebarContent ? "rounded-r-md bg-[var(--color-main)] px-1 py-2 text-[var(--color-soft-white)] shadow-md" : "text-white"} transition hover:text-gray-300`}
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                        </button>
                    </div>

                    {/* Navigation */}
                    {!hideAllSidebarContent && (
                        <nav className="mt-4 flex-1 space-y-2 pb-4">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative flex items-center ${showDesktopCollapsedRail ? "justify-center gap-0" : "gap-3"
                                            } px-4 py-3 font-bold transition-all ${isActive
                                                ? "bg-blue-50 text-[var(--color-main)]"
                                                : "text-[var(--color-soft-white)] hover:bg-gray-50 hover:text-blue-500"
                                            }`}
                                    >
                                        <item.icon size={22} />
                                        <span className={hideSidebarLabels ? "hidden" : ""}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="min-h-0 min-w-0 flex-1 transition-all duration-300">
                <div className="container py-6 sm:py-8">
                    <div className="min-h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}