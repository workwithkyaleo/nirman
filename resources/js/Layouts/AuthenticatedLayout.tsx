import Brand from "@/Components/Brand";
import Dropdown from "@/Components/Dropdown";
import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, ReactNode, useState } from "react";

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const pageProps = usePage().props as any;
    const user = pageProps.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f4f5f2]">
            {/* Flash Messages */}
            {pageProps.flash?.success && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2" role="status">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    {pageProps.flash.success}
                </div>
            )}
            {pageProps.flash?.error && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2" role="alert">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {pageProps.flash.error}
                </div>
            )}

            {/* ── TOP NAV (Wix-inspired) ── */}
            <nav className="sticky top-0 z-30 border-b border-[#e3e7e4] bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-sm">
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">
                        {/* Left: Brand + Nav Links */}
                        <div className="flex items-center gap-6">
                            <Brand compact />

                            {/* Divider */}
                            <div className="hidden h-5 w-px bg-slate-200 sm:block" />

                            {/* Nav links */}
                            <div className="hidden items-center gap-1 sm:flex">
                                <Link
                                    href={route("dashboard")}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                        route().current("dashboard")
                                            ? "bg-[#173f37]/8 text-[#173f37]"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    My Sites
                                </Link>
                            </div>
                        </div>

                        {/* Right: Tools */}
                        <div className="flex items-center gap-2">
                            {/* Help */}
                            <button
                                type="button"
                                title="Help"
                                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            {/* Notification bell */}
                            <div className="relative">
                                <button
                                    type="button"
                                    title="Notifications"
                                    onClick={() => setNotifOpen(o => !o)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </button>
                                {notifOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                        <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-200 bg-white py-3 shadow-xl">
                                            <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Notifications</p>
                                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                                <span className="text-2xl">🔔</span>
                                                <p className="text-sm text-slate-500">You're all caught up!</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* User Dropdown */}
                            <div className="relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173f37] text-sm font-bold text-white transition hover:bg-[#225d50] focus:outline-none focus:ring-2 focus:ring-[#173f37] focus:ring-offset-2"
                                        >
                                            {user.name.charAt(0).toUpperCase()}
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="right" width="48">
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Dropdown.Link href={route("profile.edit")}>
                                            My Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route("dashboard")}>
                                            My Sites
                                        </Dropdown.Link>
                                        <div className="border-t border-slate-100">
                                            <Dropdown.Link
                                                href={route("logout")}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setShowingNavigationDropdown(s => !s)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 sm:hidden"
                            >
                                <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path className={!showingNavigationDropdown ? "inline-flex" : "hidden"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    <path className={showingNavigationDropdown ? "inline-flex" : "hidden"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {showingNavigationDropdown && (
                    <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 sm:hidden">
                        <Link href={route("dashboard")} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My Sites</Link>
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <p className="px-3 text-xs font-semibold text-slate-400">{user.name}</p>
                            <Link href={route("profile.edit")} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Profile</Link>
                            <Link href={route("logout")} method="post" as="button" className="block w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Log Out</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Optional subheader */}
            {header && (
                <header className="border-b border-[#e3e7e4] bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
