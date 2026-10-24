import WixLayout from "@/Layouts/WixLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useState } from "react";

type Site = {
    id: number;
    name: string;
    slug: string;
    type: string;
    status: string;
    currency: string;
    published_at: string | null;
    can_manage: boolean;
    can_manage_store: boolean;
};

type Stats = {
    pages: number;
    published_pages: number;
    sections: number;
    products: number;
    orders: number;
    revenue_minor: number;
    ai_proposals: {
        total: number;
        proposed: number;
        applied: number;
        stale: number;
        cancelled: number;
    };
};

type RecentOrder = {
    id: number;
    number: string;
    channel: string;
    status: string;
    payment_status: string;
    currency: string;
    total_minor: number;
    created_at: string;
};

type RecentAi = {
    id: number;
    status: string;
    scope: string;
    prompt: string | null;
    summary: string | null;
    applied_at: string | null;
    created_at: string;
};

type Props = {
    site: Site;
    stats: Stats;
    recentOrders: RecentOrder[];
    recentAi: RecentAi[];
};

const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount / 100);

const date = (value: string | null) =>
    value
        ? new Intl.DateTimeFormat("en-NP", {
              month: "short",
              day: "numeric",
              year: "numeric",
          }).format(new Date(value))
        : "Not yet";

const statusPill = (status: string) => {
    const map: Record<string, string> = {
        published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        applied:   "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        paid:      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        proposed:  "bg-amber-50 text-amber-700 ring-amber-600/20",
        pending:   "bg-amber-50 text-amber-700 ring-amber-600/20",
        processing:"bg-amber-50 text-amber-700 ring-amber-600/20",
        stale:     "bg-rose-50 text-rose-700 ring-rose-600/20",
        cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
        refunded:  "bg-rose-50 text-rose-700 ring-rose-600/20",
        failed:    "bg-rose-50 text-rose-700 ring-rose-600/20",
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${map[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/15"}`}>
            {status}
        </span>
    );
};

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, detail, icon, color }: {
    label: string; value: string | number; detail: string; icon: string; color: string;
}) {
    return (
        <article className={`rounded-2xl border p-5 ${color} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
                    <p className="mt-1.5 text-3xl font-extrabold tracking-tight">{value}</p>
                    <p className="mt-1 text-xs opacity-60">{detail}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </article>
    );
}

// ─── Checklist Item ──────────────────────────────────────────────────────────
function ChecklistItem({ title, detail, complete, href }: {
    title: string; detail: string; complete: boolean; href: string;
}) {
    return (
        <li>
            <Link href={href} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                    complete ? "bg-emerald-50 text-emerald-600" : "bg-[#eef5f1] text-[#0f766e] group-hover:bg-teal-100"
                }`}>
                    {complete ? "✓" : "→"}
                </span>
                <span className="min-w-0 flex-1">
                    <strong className={`block text-sm font-semibold ${complete ? "text-slate-400 line-through" : "text-[#263c36] group-hover:text-[#0f766e]"}`}>
                        {title}
                    </strong>
                    <span className="mt-0.5 block text-xs text-[#84918d]">{detail}</span>
                </span>
                {!complete && (
                    <svg className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </Link>
        </li>
    );
}

export default function Admin({ site, stats, recentOrders, recentAi }: Props) {
    const { brand } = usePage().props as any;
    const siteDomain = brand?.siteDomain || "nirmaan.site";
    const isStore = site.type === "store";

    // ── Quick Action Button ──────────────────────────────────────────────────
    type QA = { icon: string; label: string; href: string; color: string };
    const quickActions: QA[] = isStore
        ? [
            { icon: "🛍️", label: "Add Products",  href: route("products.create", site.id),              color: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" },
            { icon: "📦", label: "View Orders",    href: route("orders.index", site.id),                 color: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" },
            { icon: "🛒", label: "Commerce Hub",   href: route("commerce.hub", site.id),                 color: "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100" },
            { icon: "✏️", label: "Design Site",    href: route("sites.edit", site.id),                   color: "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100" },
            { icon: "✨", label: "AI Refine",      href: route("sites.edit", { site: site.id, panel: "ai" }), color: "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" },
            { icon: "⚙️", label: "Settings",       href: route("sites.edit", { site: site.id, panel: "settings" }), color: "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100" },
          ]
        : [
            { icon: "✏️", label: "Design Site",    href: route("sites.edit", site.id),                   color: "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100" },
            { icon: "📄", label: "Manage Pages",   href: route("sites.edit", { site: site.id, panel: "content" }), color: "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100" },
            { icon: "🎨", label: "Design & Theme", href: route("sites.edit", { site: site.id, panel: "design" }),  color: "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100" },
            { icon: "✨", label: "AI Refine",      href: route("sites.edit", { site: site.id, panel: "ai" }),      color: "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100" },
            { icon: "🌐", label: "SEO Settings",   href: route("sites.edit", { site: site.id, panel: "settings" }), color: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100" },
            { icon: "⚙️", label: "Business Info",  href: route("sites.edit", { site: site.id, panel: "settings" }), color: "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100" },
          ];

    // ── Stats ────────────────────────────────────────────────────────────────
    const storeStats = [
        { label: "Revenue",    value: money(stats.revenue_minor, site.currency), detail: "Excl. cancelled",          icon: "💰", color: "bg-white border-emerald-200 text-emerald-900" },
        { label: "Orders",     value: stats.orders,                               detail: "All channels",            icon: "📦", color: "bg-white border-amber-200 text-amber-900" },
        { label: "Products",   value: stats.products,                             detail: "In catalogue",            icon: "🛍️", color: "bg-white border-indigo-200 text-indigo-900" },
        { label: "Pages",      value: `${stats.published_pages}/${stats.pages}`,  detail: "Published pages",        icon: "📄", color: "bg-white border-slate-200 text-slate-900" },
        { label: "AI Proposals", value: stats.ai_proposals.total,                 detail: `${stats.ai_proposals.proposed} need review`, icon: "✦", color: "bg-white border-yellow-200 text-yellow-900" },
        { label: "Site Status", value: site.status === "published" ? "Live" : "Draft", detail: site.status === "published" ? `Since ${date(site.published_at)}` : "Not yet published", icon: site.status === "published" ? "🟢" : "🟡", color: "bg-white border-slate-200 text-slate-900" },
    ];
    const businessStats = [
        { label: "Pages",        value: stats.pages,            detail: `${stats.published_pages} published`,        icon: "📄", color: "bg-white border-indigo-200 text-indigo-900" },
        { label: "Sections",     value: stats.sections,         detail: "Editable blocks",                           icon: "▦",  color: "bg-white border-teal-200 text-teal-900" },
        { label: "Published",    value: stats.published_pages,  detail: `${Math.max(stats.pages - stats.published_pages, 0)} in draft`, icon: "✓", color: "bg-white border-emerald-200 text-emerald-900" },
        { label: "AI Proposals", value: stats.ai_proposals.total, detail: `${stats.ai_proposals.proposed} need review`, icon: "✦", color: "bg-white border-yellow-200 text-yellow-900" },
        { label: "Draft coverage", value: stats.pages ? `${Math.round((stats.published_pages / stats.pages) * 100)}%` : "0%", detail: "Pages visible to visitors", icon: "◔", color: "bg-white border-purple-200 text-purple-900" },
        { label: "Site Status", value: site.status === "published" ? "Live" : "Draft", detail: site.status === "published" ? `Since ${date(site.published_at)}` : "Not yet published", icon: site.status === "published" ? "🟢" : "🟡", color: "bg-white border-slate-200 text-slate-900" },
    ];
    const activeStats = isStore ? storeStats : businessStats;

    // ── Checklists ───────────────────────────────────────────────────────────
    const storeChecklist = [
        { title: "Add your first products",       detail: `${stats.products} in catalogue`,              complete: stats.products > 0,          href: route("products.create", site.id) },
        { title: "Customise your store design",   detail: "Colors, fonts, logo",                          complete: false,                       href: route("sites.edit", { site: site.id, panel: "design" }) },
        { title: "Set up payment & delivery",     detail: "Commerce configuration",                       complete: isStore,                     href: route("commerce.hub", site.id) },
        { title: "Publish your store",            detail: site.status === "published" ? "Store is live ✓" : "Publish when ready", complete: site.status === "published", href: route("sites.edit", site.id) },
        { title: "Review incoming orders",        detail: `${stats.orders} received so far`,              complete: stats.orders > 0,            href: route("orders.index", site.id) },
    ];
    const businessChecklist = [
        { title: "Add your business pages",       detail: `${stats.pages} page${stats.pages === 1 ? "" : "s"} in studio`,    complete: stats.pages > 0,             href: route("sites.edit", { site: site.id, panel: "content" }) },
        { title: "Fill in content sections",      detail: `${stats.sections} editable block${stats.sections === 1 ? "" : "s"}`, complete: stats.sections >= 3,       href: route("sites.edit", { site: site.id, panel: "content" }) },
        { title: "Set brand design",              detail: "Colors, fonts, and logo",                      complete: false,                       href: route("sites.edit", { site: site.id, panel: "design" }) },
        { title: "Refine content with AI",        detail: `${stats.ai_proposals.total} proposal${stats.ai_proposals.total === 1 ? "" : "s"} created`, complete: stats.ai_proposals.total > 0, href: route("sites.edit", { site: site.id, panel: "ai" }) },
        { title: "Publish your website",          detail: `${stats.published_pages} of ${stats.pages} pages live`, complete: stats.pages > 0 && stats.published_pages === stats.pages, href: route("sites.edit", site.id) },
    ];
    const checklist = isStore ? storeChecklist : businessChecklist;
    const doneCount = checklist.filter(i => i.complete).length;

    // ── Feature Highlights (type-specific) ───────────────────────────────────
    type Feature = { icon: string; title: string; desc: string; href: string; cta: string; badge?: string; badgeColor?: string };
    const storeFeatures: Feature[] = [
        { icon: "🛍️", title: "Product Catalogue",  desc: "Add products with photos, prices, stock tracking, and variants.",  href: route("products.index", site.id),  cta: "Manage products",   badge: `${stats.products} products`,  badgeColor: "bg-amber-100 text-amber-800" },
        { icon: "📬", title: "Order Management",   desc: "View, fulfil, and track every customer order in real time.",         href: route("orders.index", site.id),    cta: "View orders",       badge: `${stats.orders} orders`,      badgeColor: "bg-emerald-100 text-emerald-800" },
        { icon: "💰", title: "Getting Paid",       desc: "Payment configuration, COD settings, and store policies.",            href: route("commerce.hub", site.id),   cta: "Commerce hub",      badge: undefined,                     badgeColor: "" },
        { icon: "📊", title: "Sales Analytics",    desc: "Revenue reports, best-selling products, and conversion insights.",    href: route("sites.admin", site.id),    cta: "View overview",     badge: undefined,                     badgeColor: "" },
    ];
    const businessFeatures: Feature[] = [
        { icon: "🌐", title: "SEO & Visibility",   desc: "Meta titles, descriptions, and structured content to rank on search.",  href: route("sites.edit", { site: site.id, panel: "settings" }), cta: "Configure SEO",       badge: site.status === "published" ? "Live" : "Draft", badgeColor: site.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800" },
        { icon: "📬", title: "Contact & Leads",    desc: "Enquiry forms, WhatsApp, email, and phone to capture business leads.",   href: route("sites.edit", { site: site.id, panel: "settings" }), cta: "Update contact info", badge: undefined, badgeColor: "" },
        { icon: "✨", title: "AI Content Refine",  desc: "Ask the AI assistant to refine copy, headlines, and page sections.",    href: route("sites.edit", { site: site.id, panel: "ai" }),        cta: "Open AI assistant",   badge: stats.ai_proposals.total > 0 ? `${stats.ai_proposals.total} proposals` : undefined, badgeColor: "bg-yellow-100 text-yellow-800" },
        { icon: "🎨", title: "Design & Branding",  desc: "Customise your color palette, typography, and overall site look.",       href: route("sites.edit", { site: site.id, panel: "design" }),    cta: "Open designer",       badge: undefined, badgeColor: "" },
    ];
    const features = isStore ? storeFeatures : businessFeatures;

    return (
        <WixLayout
            site={site}
            activeSection="home"
            title="Home"
            headerActions={
                <>
                    {site.status === "published" && (
                        <a
                            href={`/s/${site.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-slate-900 transition"
                        >
                            View live ↗
                        </a>
                    )}
                </>
            }
        >
            <Head title={`${site.name} — Home`} />

            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 space-y-8">

                {/* ── HERO BANNER ─────────────────────────────────────────── */}
                <section className="relative overflow-hidden rounded-3xl bg-[#162620] px-7 py-8 text-white shadow-[0_24px_60px_rgba(22,38,32,0.22)] sm:px-10 sm:py-10">
                    {/* decorative rings */}
                    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[60px] border-white/5" />
                    <div aria-hidden="true" className="pointer-events-none absolute -left-10 -bottom-20 h-56 w-56 rounded-full border-[40px] border-white/4" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/70">
                                    {isStore ? "Online Store" : "Business Website"}
                                </span>
                                {statusPill(site.status)}
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{site.name}</h1>
                            <p className="mt-2 text-[#a0c4b8] text-base">{site.slug}.{siteDomain}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {site.status === "published" && (
                                <a
                                    href={`/s/${site.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition"
                                >
                                    View Live Site ↗
                                </a>
                            )}
                            <Link
                                href={route("sites.edit", site.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#d59624] px-4 py-2.5 text-sm font-bold text-[#162620] shadow-md hover:bg-[#e8a728] transition"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m4 20 4.2-1 10.6-10.6a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z" />
                                </svg>
                                Open Studio
                            </Link>
                        </div>
                    </div>

                    {/* quick KPIs */}
                    {(() => {
                        const kpis = isStore ? [
                            { label: "Revenue",  value: money(stats.revenue_minor, site.currency) },
                            { label: "Orders",   value: stats.orders },
                            { label: "Products", value: stats.products },
                            { label: "Pages",    value: `${stats.published_pages}/${stats.pages}` },
                        ] : [
                            { label: "Pages",        value: stats.pages },
                            { label: "Published",    value: stats.published_pages },
                            { label: "Sections",     value: stats.sections },
                            { label: "AI Proposals", value: stats.ai_proposals.total },
                        ];
                        return (
                            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {kpis.map(kpi => (
                                    <div key={kpi.label} className="rounded-2xl bg-white/8 px-4 py-3 backdrop-blur-sm border border-white/8">
                                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">{kpi.label}</p>
                                        <p className="mt-1 text-xl font-extrabold text-white">{kpi.value}</p>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </section>

                {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
                <section aria-labelledby="quick-actions-heading">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">Quick Actions</p>
                            <h2 id="quick-actions-heading" className="mt-0.5 text-xl font-bold text-[#17201e]">What would you like to do?</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {quickActions.map(action => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center font-semibold text-sm transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${action.color}`}
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="text-xs">{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── AT A GLANCE: STAT CARDS ─────────────────────────────── */}
                <section aria-labelledby="stats-heading">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">At a Glance</p>
                            <h2 id="stats-heading" className="mt-0.5 text-xl font-bold text-[#17201e]">Your site today</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {activeStats.map(s => (
                            <StatCard key={s.label} {...s} />
                        ))}
                    </div>
                </section>

                {/* ── TWO-COLUMN: CHECKLIST + RECENT ACTIVITY ─────────────── */}
                <div className="grid gap-6 xl:grid-cols-2">
                    {/* Checklist */}
                    <section
                        aria-labelledby="checklist-heading"
                        className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm"
                    >
                        <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">
                                    {isStore ? "Store Setup" : "Website Setup"}
                                </p>
                                <h2 id="checklist-heading" className="mt-0.5 text-lg font-bold text-[#17201e]">
                                    {isStore ? "Get your store ready" : "Launch your website"}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#0f766e] to-[#34d399] transition-all"
                                        style={{ width: `${Math.round((doneCount / checklist.length) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-500">{doneCount}/{checklist.length}</span>
                            </div>
                        </header>
                        <ul className="divide-y divide-[#edf0ee]">
                            {checklist.map(item => (
                                <ChecklistItem key={item.title} {...item} />
                            ))}
                        </ul>
                    </section>

                    {/* Recent Activity: Orders (store) or AI Proposals (business) */}
                    {isStore ? (
                        <section
                            aria-labelledby="orders-heading"
                            className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm"
                        >
                            <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4">
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">Activity</p>
                                    <h2 id="orders-heading" className="mt-0.5 text-lg font-bold text-[#17201e]">Recent orders</h2>
                                </div>
                                {site.can_manage_store && (
                                    <Link href={route("orders.index", site.id)} className="text-sm font-bold text-[#0f766e] hover:text-[#173f37]">
                                        All orders →
                                    </Link>
                                )}
                            </header>
                            {recentOrders.length ? (
                                <ul className="divide-y divide-[#edf0ee]">
                                    {recentOrders.map(order => (
                                        <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate font-bold text-[#263c36]">#{order.number}</p>
                                                    {statusPill(order.status)}
                                                </div>
                                                <p className="mt-1 text-xs capitalize text-[#84918d]">
                                                    {order.channel} · {date(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-bold text-[#17201e]">{money(order.total_minor, order.currency)}</p>
                                                <p className="mt-1 text-xs capitalize text-[#84918d]">{order.payment_status}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef5f1] text-xl text-[#0f766e]">📦</div>
                                    <div>
                                        <h3 className="font-bold text-[#263c36]">No orders yet</h3>
                                        <p className="mt-1 max-w-xs text-sm text-[#7b8984]">New orders from your published store will appear here.</p>
                                    </div>
                                    <Link href={route("products.create", site.id)} className="rounded-xl bg-[#173f37] px-4 py-2 text-sm font-bold text-white hover:bg-[#225d50] transition">
                                        Add your first product →
                                    </Link>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section
                            aria-labelledby="ai-heading"
                            className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm"
                        >
                            <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4">
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">AI Assistant</p>
                                    <h2 id="ai-heading" className="mt-0.5 text-lg font-bold text-[#17201e]">Recent proposals</h2>
                                </div>
                                <Link href={route("sites.edit", { site: site.id, panel: "ai" })} className="text-sm font-bold text-[#0f766e] hover:text-[#173f37]">
                                    Open assistant →
                                </Link>
                            </header>
                            {recentAi.length ? (
                                <ul className="divide-y divide-[#edf0ee]">
                                    {recentAi.map(gen => (
                                        <li key={gen.id} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#697974]">{gen.scope}</span>
                                                        {statusPill(gen.status)}
                                                    </div>
                                                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#314b45]">
                                                        {gen.prompt || gen.summary || "Website refinement"}
                                                    </p>
                                                </div>
                                                <time className="shrink-0 text-xs text-[#8a9692]">{date(gen.created_at)}</time>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff6df] text-xl text-[#a66d08]">✦</div>
                                    <div>
                                        <h3 className="font-bold text-[#263c36]">Ready for your first prompt</h3>
                                        <p className="mt-1 max-w-xs text-sm text-[#7b8984]">Ask the AI assistant to refine your content.</p>
                                    </div>
                                    <Link href={route("sites.edit", { site: site.id, panel: "ai" })} className="rounded-xl bg-[#173f37] px-4 py-2 text-sm font-bold text-white hover:bg-[#225d50] transition">
                                        Open AI assistant →
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                {/* ── TYPE-SPECIFIC FEATURE HIGHLIGHTS ───────────────────── */}
                <section aria-labelledby="features-heading">
                    <div className="mb-5">
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">
                            {isStore ? "Store Features" : "Business Features"}
                        </p>
                        <h2 id="features-heading" className="mt-0.5 text-xl font-bold text-[#17201e]">
                            {isStore ? "Everything your online store needs" : "Grow your business online"}
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {features.map(feat => (
                            <div
                                key={feat.title}
                                className="group flex flex-col gap-3 rounded-2xl border border-[#e0e5e2] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-3xl">{feat.icon}</span>
                                    {feat.badge && (
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${feat.badgeColor}`}>{feat.badge}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-[#17201e] text-sm">{feat.title}</p>
                                    <p className="text-xs text-[#84918d] mt-1 leading-relaxed">{feat.desc}</p>
                                </div>
                                <Link
                                    href={feat.href}
                                    className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-[#0f766e] group-hover:text-[#173f37] transition"
                                >
                                    {feat.cta}
                                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </WixLayout>
    );
}
