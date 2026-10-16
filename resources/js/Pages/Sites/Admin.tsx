import SiteWorkspaceNav from "@/Components/SiteWorkspaceNav";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

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

const statusClass = (status: string) => {
    switch (status) {
        case "published":
        case "applied":
        case "completed":
        case "paid":
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
        case "proposed":
        case "pending":
        case "processing":
            return "bg-amber-50 text-amber-700 ring-amber-600/15";
        case "stale":
        case "cancelled":
        case "failed":
        case "refunded":
            return "bg-rose-50 text-rose-700 ring-rose-600/15";
        default:
            return "bg-slate-100 text-slate-600 ring-slate-500/15";
    }
};

const badge = (status: string) => (
    <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${statusClass(status)}`}
    >
        {status}
    </span>
);

export default function Admin({ site, stats, recentOrders, recentAi }: Props) {
    const { brand } = usePage().props as any;
    const websiteMetrics = [
        {
            label: "Pages",
            value: stats.pages,
            detail: `${stats.published_pages} published`,
            symbol: "▤",
        },
        {
            label: "Sections",
            value: stats.sections,
            detail: "Editable content blocks",
            symbol: "▦",
        },
        {
            label: "Published pages",
            value: stats.published_pages,
            detail: `${Math.max(stats.pages - stats.published_pages, 0)} still in draft`,
            symbol: "✓",
        },
        {
            label: "Draft coverage",
            value: stats.pages
                ? `${Math.round((stats.published_pages / stats.pages) * 100)}%`
                : "0%",
            detail: "Pages available to visitors",
            symbol: "◔",
        },
        {
            label: "Site status",
            value: site.status === "published" ? "Live" : "Draft",
            detail:
                site.status === "published"
                    ? `Published ${date(site.published_at)}`
                    : "Ready when you are",
            symbol: "◎",
        },
        {
            label: "AI proposals",
            value: stats.ai_proposals.total,
            detail: `${stats.ai_proposals.proposed} waiting for review`,
            symbol: "✦",
        },
    ];
    const storeMetrics = [
        websiteMetrics[0],
        websiteMetrics[1],
        {
            label: "Products",
            value: stats.products,
            detail: "In your catalogue",
            symbol: "◇",
        },
        {
            label: "Orders",
            value: stats.orders,
            detail: "Across every channel",
            symbol: "↗",
        },
        {
            label: "Revenue",
            value: money(stats.revenue_minor, site.currency),
            detail: "Excludes cancelled orders",
            symbol: "○",
        },
        websiteMetrics[5],
    ];
    const metrics = site.type === "store" ? storeMetrics : websiteMetrics;
    const websiteChecklist = [
        {
            title: "Build your page structure",
            detail: `${stats.pages} page${stats.pages === 1 ? "" : "s"} in the studio`,
            complete: stats.pages > 0,
            panel: "content",
        },
        {
            title: "Add useful page sections",
            detail: `${stats.sections} editable content block${stats.sections === 1 ? "" : "s"}`,
            complete: stats.sections >= 3,
            panel: "content",
        },
        {
            title: "Review colours, type and layout",
            detail: "Keep the design consistent on every page",
            complete: false,
            panel: "design",
        },
        {
            title: "Refine the site with AI",
            detail: `${stats.ai_proposals.total} proposal${stats.ai_proposals.total === 1 ? "" : "s"} created`,
            complete: stats.ai_proposals.total > 0,
            panel: "ai",
        },
        {
            title: "Publish for your visitors",
            detail: `${stats.published_pages} of ${stats.pages} pages live`,
            complete: stats.pages > 0 && stats.published_pages === stats.pages,
            panel: "content",
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-[#687772]">
                            <Link
                                href={route("dashboard")}
                                className="font-semibold hover:text-[#173f37]"
                            >
                                Websites
                            </Link>
                            <span aria-hidden="true">/</span>
                            <span>{site.name}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#17201e]">
                            Site overview
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {site.status === "published" && (
                            <a
                                href={route("public.site", {
                                    siteSlug: site.slug,
                                })}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-xl border border-[#d6ded9] bg-white px-4 py-2.5 text-sm font-bold text-[#314b45] shadow-sm hover:-translate-y-0.5 hover:border-[#9bb6ae]"
                            >
                                View live ↗
                            </a>
                        )}
                        <Link
                            href={route("sites.edit", site.id)}
                            className="inline-flex items-center rounded-xl bg-[#173f37] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#225d50]"
                        >
                            Open studio →
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Overview · ${site.name}`} />

            <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
                <SiteWorkspaceNav
                    site={site}
                    active="overview"
                    canManage={site.can_manage}
                    canManageStore={site.can_manage_store}
                />

                <section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-8 text-white shadow-[0_24px_70px_rgba(23,63,55,0.18)] sm:px-9 sm:py-10">
                    <div
                        aria-hidden="true"
                        className="absolute -right-24 -top-36 h-80 w-80 rounded-full border-[64px] border-white/5"
                    />
                    <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-5 flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d8ebe5]">
                                    {site.type === "store"
                                        ? "Online store"
                                        : "Business website"}
                                </span>
                                {badge(site.status)}
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {site.name}
                            </h2>
                            <p className="mt-3 text-base text-[#c9ded8] sm:text-lg">
                                {site.slug}.{brand.siteDomain}
                            </p>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:flex sm:gap-10">
                            <div>
                                <dt className="text-[#9fc2b8]">Published</dt>
                                <dd className="mt-1 font-bold text-white">
                                    {date(site.published_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[#9fc2b8]">
                                    Draft coverage
                                </dt>
                                <dd className="mt-1 font-bold text-white">
                                    {stats.pages
                                        ? `${stats.published_pages}/${stats.pages} pages`
                                        : "No pages yet"}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section aria-labelledby="site-health-title">
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">
                                At a glance
                            </p>
                            <h2
                                id="site-health-title"
                                className="mt-1 text-2xl font-bold tracking-tight text-[#17201e]"
                            >
                                Your website today
                            </h2>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {metrics.map((metric) => (
                            <article
                                key={metric.label}
                                className="rounded-2xl border border-[#e0e5e2] bg-white p-5 shadow-[0_10px_32px_rgba(24,42,37,0.045)]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-[#687772]">
                                            {metric.label}
                                        </p>
                                        <p className="mt-2 text-3xl font-bold tracking-tight text-[#17201e]">
                                            {metric.value}
                                        </p>
                                        <p className="mt-2 text-xs text-[#84918d]">
                                            {metric.detail}
                                        </p>
                                    </div>
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f1] text-lg font-bold text-[#0f766e]">
                                        {metric.symbol}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                    {site.type === "store" ? (
                        <section
                            aria-labelledby="recent-orders-title"
                            className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-[0_10px_32px_rgba(24,42,37,0.045)]"
                        >
                            <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4 sm:px-6">
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#0f766e]">
                                        Activity
                                    </p>
                                    <h2
                                        id="recent-orders-title"
                                        className="mt-1 text-lg font-bold text-[#17201e]"
                                    >
                                        Recent orders
                                    </h2>
                                </div>
                                {site.can_manage_store && (
                                    <Link
                                        href={route("commerce.hub", site.id)}
                                        className="text-sm font-bold text-[#0f766e] hover:text-[#173f37]"
                                    >
                                        Commerce →
                                    </Link>
                                )}
                            </header>
                            {recentOrders.length ? (
                                <ul className="divide-y divide-[#edf0ee]">
                                    {recentOrders.map((order) => (
                                        <li
                                            key={order.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate font-bold text-[#263c36]">
                                                        #{order.number}
                                                    </p>
                                                    {badge(order.status)}
                                                </div>
                                                <p className="mt-1 text-xs capitalize text-[#84918d]">
                                                    {order.channel} ·{" "}
                                                    {date(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-bold text-[#17201e]">
                                                    {money(
                                                        order.total_minor,
                                                        order.currency,
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs capitalize text-[#84918d]">
                                                    {order.payment_status}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#eef5f1] text-[#0f766e]">
                                        ↗
                                    </div>
                                    <h3 className="mt-4 font-bold text-[#263c36]">
                                        No orders yet
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-xs text-sm text-[#7b8984]">
                                        New orders from your published store
                                        will appear here.
                                    </p>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section
                            aria-labelledby="website-checklist-title"
                            className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-[0_10px_32px_rgba(24,42,37,0.045)]"
                        >
                            <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4 sm:px-6">
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#0f766e]">
                                        Next steps
                                    </p>
                                    <h2
                                        id="website-checklist-title"
                                        className="mt-1 text-lg font-bold text-[#17201e]"
                                    >
                                        Website checklist
                                    </h2>
                                </div>
                                <Link
                                    href={route("sites.edit", site.id)}
                                    className="text-sm font-bold text-[#0f766e] hover:text-[#173f37]"
                                >
                                    Open studio →
                                </Link>
                            </header>
                            <ul className="divide-y divide-[#edf0ee]">
                                {websiteChecklist.map((item) => (
                                    <li
                                        key={item.title}
                                        className="px-5 py-3.5 sm:px-6"
                                    >
                                        <Link
                                            href={route("sites.edit", {
                                                site: site.id,
                                                panel: item.panel,
                                            })}
                                            className="group flex items-center gap-3"
                                        >
                                            <span
                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                                                    item.complete
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-[#eef5f1] text-[#0f766e]"
                                                }`}
                                            >
                                                {item.complete ? "✓" : "→"}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <strong className="block text-sm text-[#263c36] group-hover:text-[#0f766e]">
                                                    {item.title}
                                                </strong>
                                                <span className="mt-0.5 block text-xs text-[#84918d]">
                                                    {item.detail}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section
                        aria-labelledby="recent-ai-title"
                        className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-[0_10px_32px_rgba(24,42,37,0.045)]"
                    >
                        <header className="flex items-center justify-between gap-4 border-b border-[#e9eeeb] px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#0f766e]">
                                    AI assistant
                                </p>
                                <h2
                                    id="recent-ai-title"
                                    className="mt-1 text-lg font-bold text-[#17201e]"
                                >
                                    Recent proposals
                                </h2>
                            </div>
                            <Link
                                href={route("sites.edit", {
                                    site: site.id,
                                    panel: "ai",
                                })}
                                className="text-sm font-bold text-[#0f766e] hover:text-[#173f37]"
                            >
                                Open assistant →
                            </Link>
                        </header>
                        {recentAi.length ? (
                            <ul className="divide-y divide-[#edf0ee]">
                                {recentAi.map((generation) => (
                                    <li
                                        key={generation.id}
                                        className="px-5 py-4 sm:px-6"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#697974]">
                                                        {generation.scope}
                                                    </span>
                                                    {badge(generation.status)}
                                                </div>
                                                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#314b45]">
                                                    {generation.prompt ||
                                                        generation.summary ||
                                                        "Website refinement"}
                                                </p>
                                            </div>
                                            <time className="shrink-0 text-xs text-[#8a9692]">
                                                {date(generation.created_at)}
                                            </time>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#fff6df] text-[#a66d08]">
                                    ✦
                                </div>
                                <h3 className="mt-4 font-bold text-[#263c36]">
                                    Ready for your first prompt
                                </h3>
                                <p className="mx-auto mt-1 max-w-xs text-sm text-[#7b8984]">
                                    Ask the studio assistant to refine copy,
                                    sections or the overall design.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
