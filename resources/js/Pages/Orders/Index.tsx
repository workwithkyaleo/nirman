import WixLayout from "@/Layouts/WixLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";

const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);

const statusConfig: Record<string, { bg: string; text: string; ring: string; label: string }> = {
    pending:    { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-600/20",   label: "Pending" },
    processing: { bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-600/20",    label: "Processing" },
    dispatched: { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-600/20",  label: "Dispatched" },
    delivered:  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20", label: "Delivered" },
    completed:  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20", label: "Completed" },
    cancelled:  { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-600/20",    label: "Cancelled" },
    refunded:   { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-600/20",    label: "Refunded" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-400/20", label: status };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            {cfg.label}
        </span>
    );
}

export default function Orders({ site, orders, statusCounts }: any) {
    const [updating, setUpdating] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    const update = (id: number, status: string) => {
        setUpdating(id);
        router.patch(
            route("orders.status.update", [site.id, id]),
            { status, notify_customer: true },
            { preserveScroll: true, onFinish: () => setUpdating(null) }
        );
    };

    const total = orders.total;
    const pending = statusCounts.pending || 0;
    const inFulfilment = (statusCounts.processing || 0) + (statusCounts.dispatched || 0);
    const delivered = statusCounts.delivered || 0;

    const filterTabs = [
        { key: "all",        label: "All",        count: total },
        { key: "pending",    label: "Pending",    count: pending },
        { key: "processing", label: "Processing", count: statusCounts.processing || 0 },
        { key: "dispatched", label: "Dispatched", count: statusCounts.dispatched || 0 },
        { key: "delivered",  label: "Delivered",  count: delivered },
        { key: "cancelled",  label: "Cancelled",  count: statusCounts.cancelled || 0 },
    ];

    const filteredOrders = activeFilter === "all"
        ? orders.data
        : orders.data.filter((o: any) => o.status === activeFilter);

    return (
        <WixLayout site={site} activeSection="orders" title="Orders"
            headerActions={
                <Link
                    href={route("commerce.hub", site.id)}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                    Commerce Hub
                </Link>
            }
        >
            <Head title={`Orders · ${site.name}`} />

            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 space-y-7">

                {/* ── HERO BANNER ── */}
                <section className="relative overflow-hidden rounded-3xl bg-[#162620] px-7 py-8 text-white shadow-[0_20px_50px_rgba(22,38,32,0.22)] sm:px-10 sm:py-10">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[56px] border-white/8" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#a0c4b8]">Order Desk</p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Orders — {site.name}</h1>
                            <p className="mt-1 text-[#a0c4b8] text-sm">Every status change queues a customer notification.</p>
                        </div>
                        <Link
                            href={route("commerce.hub", site.id)}
                            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
                        >
                            Commerce Hub →
                        </Link>
                    </div>

                    {/* KPIs */}
                    <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Total Orders",   value: total },
                            { label: "To Confirm",     value: pending },
                            { label: "In Fulfilment",  value: inFulfilment },
                            { label: "Delivered",      value: delivered },
                        ].map(kpi => (
                            <div key={kpi.label} className="rounded-2xl bg-white/8 px-4 py-3 backdrop-blur-sm border border-white/8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a0c4b8]">{kpi.label}</p>
                                <p className="mt-1 text-xl font-extrabold">{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── FILTER TABS ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveFilter(tab.key)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                                activeFilter === tab.key
                                    ? "border-[#173f37] bg-[#173f37] text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-[#0f766e] hover:text-[#0f766e]"
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${activeFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── ORDERS LIST ── */}
                <section className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm">
                    <div className="border-b border-[#e9eeeb] px-5 py-4">
                        <h2 className="font-bold text-[#17201e]">
                            {activeFilter === "all" ? "All orders" : `${filterTabs.find(t => t.key === activeFilter)?.label} orders`}
                        </h2>
                        <p className="mt-0.5 text-sm text-[#84918d]">Each status change records a timeline event and notifies the customer.</p>
                    </div>

                    {filteredOrders.length ? (
                        <div className="divide-y divide-[#edf0ee]">
                            {filteredOrders.map((order: any) => (
                                <article key={order.id} className="flex flex-col gap-4 px-5 py-5 hover:bg-slate-50/60 transition lg:flex-row lg:items-center">
                                    {/* Order # + date */}
                                    <div className="w-[140px] shrink-0">
                                        <p className="font-extrabold text-[#17201e]">#{order.number}</p>
                                        <p className="mt-0.5 text-xs text-[#84918d]">{new Date(order.created_at).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })}</p>
                                    </div>

                                    {/* Customer */}
                                    <div className="min-w-[160px] flex-shrink-0">
                                        <p className="text-sm font-bold text-[#263c36]">{order.customer_name}</p>
                                        <p className="text-xs text-[#84918d]">{order.phone} · {order.city}</p>
                                    </div>

                                    {/* Items */}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm text-[#697974]">
                                            {order.items.map((item: any) => `${item.quantity}× ${item.name}`).join(", ")}
                                        </p>
                                    </div>

                                    {/* Status + Amount */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusBadge status={order.status} />
                                        <span className="min-w-[90px] text-right font-extrabold text-[#17201e]">
                                            {money(order.total_minor, site.currency)}
                                        </span>
                                    </div>

                                    {/* Next status actions */}
                                    {order.next_statuses?.length > 0 && (
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            {order.next_statuses.map((status: string) => {
                                                const cfg = statusConfig[status];
                                                return (
                                                    <button
                                                        key={status}
                                                        disabled={updating === order.id}
                                                        onClick={() => update(order.id, status)}
                                                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition hover:shadow-sm disabled:opacity-50 ${
                                                            cfg
                                                                ? `${cfg.bg} ${cfg.text} border-transparent`
                                                                : "border-[#b8ccc5] bg-[#eef5f1] text-[#173f37]"
                                                        }`}
                                                    >
                                                        {updating === order.id ? (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                Updating…
                                                            </span>
                                                        ) : (
                                                            `Mark ${status}`
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[#eef5f1] text-2xl text-[#0f766e]">📋</div>
                            <div>
                                <h3 className="font-extrabold text-[#263c36]">No orders {activeFilter !== "all" ? `with status "${activeFilter}"` : "yet"}</h3>
                                <p className="mt-1 max-w-xs text-sm text-[#84918d]">
                                    {activeFilter !== "all" ? "Try a different filter." : "Orders from your published store will appear here."}
                                </p>
                            </div>
                            {activeFilter !== "all" && (
                                <button onClick={() => setActiveFilter("all")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                                    Show all orders
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {orders.links?.length > 3 && (
                    <div className="flex items-center justify-center gap-2">
                        {orders.links.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                                    link.active ? "border-[#173f37] bg-[#173f37] text-white"
                                    : !link.url ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-[#0f766e] hover:text-[#0f766e]"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </WixLayout>
    );
}
