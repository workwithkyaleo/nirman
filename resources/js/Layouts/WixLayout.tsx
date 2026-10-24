import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useState } from "react";

type Site = {
    id: number;
    name: string;
    slug: string;
    type: string;
    status: string;
    can_manage?: boolean;
    can_manage_store?: boolean;
};

type WixLayoutProps = PropsWithChildren<{
    site: Site;
    activeSection:
        | "home"
        | "studio"
        | "getting-paid"
        | "sales"
        | "catalog"
        | "marketing"
        | "analytics"
        | "settings"
        | "orders"
        | "products"
        | "commerce";
    title?: string;
    headerActions?: ReactNode;
}>;

const NAV_ICON_CLS = "h-[18px] w-[18px] shrink-0 flex-none";

function NavIcon({ type }: { type: string }) {
    const icons: Record<string, ReactNode> = {
        home: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        studio: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="m4 20 4.2-1 10.6-10.6a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m13.8 7.4 3 3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        payments: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        sales: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        catalog: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="m4 7 8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 11v10" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        marketing: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M3 11v2a9 9 0 0 0 9 9 9 9 0 0 0 9-9v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 2a5 5 0 0 1 5 5v4a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
        ),
        analytics: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="m7 16 4-5 4 3 4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        settings: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="m19.4 15 .1.1-1 1.8-2.1-.4a8 8 0 0 1-1.5.9l-.7 2h-2.1l-.7-2a8 8 0 0 1-1.5-.9l-2.1.4-1-1.8 1.4-1.6a7 7 0 0 1 0-1.8L4.9 9.9l1-1.8 2.1.4a8 8 0 0 1 1.5-.9l.7-2h2.1l.7 2a8 8 0 0 1 1.5.9l2.1-.4 1 1.8-1.4 1.6a7 7 0 0 1 0 1.8l1.4 1.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        orders: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        commerce: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M4 8h16l-1 12H5L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        inbox: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        ),
        customers: (
            <svg className={NAV_ICON_CLS} viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    };
    return <>{icons[type] ?? icons.home}</>;
}

export default function WixLayout({
    site,
    activeSection,
    title,
    headerActions,
    children,
}: WixLayoutProps) {
    const { auth, flash, brand } = usePage().props as any;
    const user = auth?.user;
    const siteDomain = brand?.siteDomain || "nirmaan.site";
    const isStore = site.type === "store";
    const canManage = site.can_manage ?? true;
    const canManageStore = site.can_manage_store ?? isStore;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    type NavItem = {
        key: string;
        label: string;
        href: string;
        icon: string;
        badge?: string;
        badgeColor?: string;
        show?: boolean;
        section?: string;
    };

    const siteNavItems: NavItem[] = [
        { key: "home",       label: "Home",          href: route("sites.admin", site.id),                                  icon: "home",      show: true },
        { key: "studio",     label: "Design Site",   href: route("sites.edit", site.id),                                   icon: "studio",    show: true },
        { key: "payments",   label: "Getting Paid",  href: route("commerce.hub", site.id),                                 icon: "payments",  show: isStore && canManageStore, section: "store" },
        { key: "sales",      label: "Sales",         href: route("orders.index", site.id),                                  icon: "sales",     show: isStore && canManageStore, section: "store" },
        { key: "catalog",    label: "Catalog",       href: route("products.index", site.id),                               icon: "catalog",   show: isStore && canManageStore, section: "store" },
        { key: "marketing",  label: "Marketing",     href: route("sites.edit", { site: site.id, panel: "ai" }),             icon: "marketing", show: true },
        { key: "analytics",  label: "Analytics",     href: route("sites.admin", site.id),                                  icon: "analytics", show: true },
        { key: "settings",   label: "Settings",      href: route("sites.settings", site.id),                                               icon: "settings",  show: canManage },
    ];

    // Compute setup completion %
    const setupSteps = [
        !!site.name,
        site.status === "published",
        isStore && canManageStore,
        true, // always count "design site"
        true, // always count "contact info"
    ];
    const completedSteps = setupSteps.filter(Boolean).length;
    const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

    const activeSectionMap: Record<string, string> = {
        home: "home", studio: "studio", "getting-paid": "payments",
        sales: "sales", catalog: "catalog", marketing: "marketing",
        analytics: "analytics", settings: "settings",
        orders: "sales", products: "catalog", commerce: "payments",
    };
    const activeKey = activeSectionMap[activeSection] ?? "home";

    return (
        <div className="flex min-h-screen bg-[#f4f5f2] font-sans">
            {/* ── Mobile Sidebar Backdrop ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ════════════════════════════
                LEFT SIDEBAR (Wix-style dark)
                ════════════════════════════ */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[230px] flex-col bg-[#162620] transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
                    <Link href={route("dashboard")} className="flex items-center gap-2.5 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d59624] text-[#162620] font-extrabold text-sm shrink-0">
                            N
                        </div>
                        <span className="text-base font-bold text-white tracking-tight">
                            nirmaan<span className="text-[#d59624]">.</span>
                        </span>
                    </Link>
                </div>

                {/* Site Selector */}
                <div className="px-3 py-3 border-b border-white/8">
                    <Link
                        href={route("dashboard")}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-white/8 transition group"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white text-xs font-bold">
                            {site.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-white truncate">{site.name}</p>
                            <p className="text-[11px] text-white/45 truncate">{site.slug}.{siteDomain}</p>
                        </div>
                        <svg className="h-4 w-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </Link>
                </div>

                {/* Setup Progress */}
                <div className="px-4 py-3 border-b border-white/8">
                    <button
                        type="button"
                        className="w-full text-left group"
                        onClick={() => {/* could expand */}}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Set up your site</p>
                            <span className="text-[10px] text-white/40">{completedSteps}/{setupSteps.length}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#0f766e] to-[#34d399] transition-all duration-500"
                                style={{ width: `${setupProgress}%` }}
                            />
                        </div>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2 px-2">
                    {/* Quick Actions button */}
                    <Link
                        href={route("sites.edit", site.id)}
                        className="mb-2 flex w-full items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-[13px] font-semibold text-white/80 hover:bg-white/8 transition"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </Link>

                    <ul className="space-y-0.5">
                        {siteNavItems.filter(n => n.show !== false).map(item => {
                            const isActive = activeKey === item.key;
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                                            isActive
                                                ? "bg-white/12 text-white font-semibold"
                                                : "text-white/60 hover:bg-white/8 hover:text-white"
                                        }`}
                                    >
                                        <NavIcon type={item.icon} />
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${item.badgeColor ?? "bg-amber-500 text-white"}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t border-white/8 px-3 py-3 space-y-1">
                    {/* Status chip */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                        <span className={`h-2 w-2 rounded-full ${site.status === "published" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        <span className="text-[11px] font-semibold text-white/40 capitalize">{site.status}</span>
                        {site.status === "published" && (
                            <a
                                href={`/s/${site.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                            >
                                View ↗
                            </a>
                        )}
                    </div>
                    <Link
                        href={route("dashboard")}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-white/50 hover:bg-white/8 hover:text-white transition"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        All Sites
                    </Link>
                </div>
            </aside>

            {/* ════════════════════════════
                MAIN CONTENT AREA
                ════════════════════════════ */}
            <div className="flex flex-1 flex-col lg:pl-[230px] min-h-screen">

                {/* ── TOP BAR (Wix-style) ── */}
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#e3e7e4] bg-white/95 backdrop-blur-sm px-4 sm:px-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                    {/* Mobile burger */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Breadcrumb title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Link href={route("dashboard")} className="hidden sm:block text-sm text-slate-400 hover:text-slate-600 transition font-medium">
                            Sites
                        </Link>
                        <span className="hidden sm:block text-slate-300">/</span>
                        <Link href={route("sites.admin", site.id)} className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition truncate">
                            {site.name}
                        </Link>
                        {title && (
                            <>
                                <span className="text-slate-300">/</span>
                                <span className="text-sm font-semibold text-slate-900 truncate">{title}</span>
                            </>
                        )}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {headerActions}

                        {/* Upgrade / plan button */}
                        <Link
                            href={route("sites.edit", site.id)}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#173f37] bg-[#173f37] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#225d50]"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Studio
                        </Link>

                        {/* User avatar */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(o => !o)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#173f37] text-xs font-bold text-white hover:bg-[#225d50] transition"
                            >
                                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link href={route("profile.edit")} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        My Profile
                                    </Link>
                                    <Link href={route("dashboard")} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        All Sites
                                    </Link>
                                    <div className="border-t border-slate-100 mt-1 pt-1">
                                        <Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Log Out
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {userMenuOpen && (
                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                            )}
                        </div>
                    </div>
                </header>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
                        <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-800">
                        <svg className="h-4 w-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {flash.error}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 pb-16">
                    {children}
                </main>
            </div>
        </div>
    );
}
