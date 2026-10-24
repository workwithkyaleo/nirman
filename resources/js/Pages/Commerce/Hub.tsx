import WixLayout from "@/Layouts/WixLayout";
import { Head, Link, router } from "@inertiajs/react";

const money = (value: number, currency: string) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);

const orderBadge = (status: string) => {
    const cls =
        status === "delivered" || status === "completed"
            ? "bg-emerald-100 text-emerald-700 ring-emerald-600/15"
            : status === "cancelled" || status === "refunded"
            ? "bg-rose-100 text-rose-700 ring-rose-600/15"
            : "bg-amber-100 text-amber-700 ring-amber-600/15";
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset ${cls}`}>
            {status}
        </span>
    );
};

export default function Hub({ site, metrics, stock, movements, orders }: any) {
    return (
        <WixLayout site={site} activeSection="commerce" title="Commerce Hub"
            headerActions={
                <Link
                    href={route("products.create", site.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#173f37] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#225d50] transition"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    Add product
                </Link>
            }
        >
            <Head title={`Commerce Hub · ${site.name}`} />

            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 space-y-7">

                {/* ── HERO BANNER ── */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1554e8] to-[#0f3fba] px-7 py-8 text-white shadow-[0_20px_50px_rgba(21,84,232,0.25)] sm:px-10 sm:py-10">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[56px] border-white/10" />
                    <div aria-hidden="true" className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full border-[32px] border-white/5" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200">Commerce Hub</p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{site.name}</h1>
                            <p className="mt-1 text-blue-200 text-sm">
                                {(metrics.pending ?? 0) + (metrics.low_stock ?? 0)} items need your attention.
                            </p>
                        </div>
                        <Link
                            href={route("orders.index", site.id)}
                            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#1554e8] shadow-md hover:bg-blue-50 transition"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Order Desk →
                        </Link>
                    </div>
                    {/* KPI row */}
                    <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Revenue",      value: money(metrics.revenue_minor ?? 0, site.currency) },
                            { label: "Orders",       value: metrics.orders ?? 0 },
                            { label: "Pending",      value: metrics.pending ?? 0 },
                            { label: "Low Stock",    value: metrics.low_stock ?? 0 },
                        ].map(k => (
                            <div key={k.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm border border-white/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">{k.label}</p>
                                <p className="mt-1 text-xl font-extrabold">{k.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── QUICK ACTIONS ── */}
                <section>
                    <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[#1554e8]">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { icon: "📋", label: "All Orders",    href: route("orders.index", site.id),           cls: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100" },
                            { icon: "🛍️", label: "Products",      href: route("products.index", site.id),         cls: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" },
                            { icon: "➕", label: "Add Product",   href: route("products.create", site.id),        cls: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" },
                            { icon: "✏️", label: "Edit Website",  href: route("sites.edit", site.id),             cls: "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100" },
                        ].map(a => (
                            <Link key={a.label} href={a.href} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md ${a.cls}`}>
                                <span className="text-xl">{a.icon}</span>
                                {a.label}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── MAIN CONTENT: ORDERS + SIDEBAR ── */}
                <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                    {/* Recent Orders Table */}
                    <section className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm">
                        <header className="flex items-center justify-between border-b border-[#e9eeeb] px-5 py-4">
                            <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1554e8]">Order Management</p>
                                <h2 className="mt-0.5 text-lg font-bold text-[#17201e]">Recent orders</h2>
                            </div>
                            <Link href={route("orders.index", site.id)} className="text-sm font-bold text-[#1554e8] hover:text-[#0f3fba]">View all →</Link>
                        </header>
                        {orders.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-left text-sm">
                                    <thead className="border-b border-[#e9eeeb] bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3.5">Order</th>
                                            <th className="px-4 py-3.5">Channel</th>
                                            <th className="px-4 py-3.5">Status</th>
                                            <th className="px-4 py-3.5">Payment</th>
                                            <th className="px-5 py-3.5 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#edf0ee]">
                                        {orders.map((order: any) => (
                                            <tr key={order.id} className="transition hover:bg-slate-50">
                                                <td className="px-5 py-4 font-bold text-[#1554e8]">#{order.number}</td>
                                                <td className="px-4 py-4 capitalize text-slate-500">{order.channel}</td>
                                                <td className="px-4 py-4">{orderBadge(order.status)}</td>
                                                <td className="px-4 py-4 capitalize text-slate-500">{order.payment_status}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-900">{money(order.total_minor, site.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-600">📦</div>
                                <p className="text-sm text-slate-500">New online orders will appear here.</p>
                                <Link href={route("products.create", site.id)} className="rounded-xl bg-[#1554e8] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f3fba] transition">
                                    Add first product →
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Sidebar: Next actions + inventory */}
                    <div className="space-y-5">
                        {/* Next Actions */}
                        <aside className="rounded-2xl border border-[#e0e5e2] bg-white p-5 shadow-sm">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1554e8]">Keep Moving</p>
                            <h3 className="mt-0.5 font-bold text-[#17201e]">Next actions</h3>
                            <div className="mt-4 space-y-3">
                                <Link href={route("orders.index", site.id)} className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5 transition hover:border-blue-200">
                                    <span className="text-lg">📋</span>
                                    <div>
                                        <p className="text-sm font-bold text-[#1554e8]">Review pending orders</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{metrics.pending ?? 0} waiting to be confirmed</p>
                                    </div>
                                </Link>
                                <Link href={route("products.index", site.id)} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50">
                                    <span className="text-lg">📊</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Check inventory</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{metrics.low_stock ?? 0} products need restocking</p>
                                    </div>
                                </Link>
                                <Link href={route("products.create", site.id)} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50">
                                    <span className="text-lg">🛍️</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Add a product</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Grow your online catalogue</p>
                                    </div>
                                </Link>
                            </div>
                        </aside>

                        {/* Stock Watch */}
                        <aside className="rounded-2xl border border-[#e0e5e2] bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1554e8]">Inventory</p>
                                    <h3 className="mt-0.5 font-bold text-[#17201e]">Stock watch</h3>
                                </div>
                                <Link href={route("products.index", site.id)} className="text-xs font-bold text-[#1554e8]">Manage →</Link>
                            </div>
                            <div className="mt-4 divide-y divide-[#edf0ee]">
                                {stock?.length ? stock.slice(0, 5).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{item.product?.name}</p>
                                            <p className="text-xs text-slate-400">{item.location?.name}</p>
                                        </div>
                                        <span className={`text-sm font-bold ${item.quantity <= (item.reorder_level ?? 5) ? "text-orange-600" : "text-slate-700"}`}>
                                            {item.quantity} left
                                        </span>
                                    </div>
                                )) : (
                                    <p className="py-4 text-sm text-slate-400">No stock levels found.</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>

                {/* ── INVENTORY MOVEMENTS ── */}
                <section className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm">
                    <header className="flex items-center justify-between border-b border-[#e9eeeb] px-5 py-4">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1554e8]">Store Activity</p>
                            <h2 className="mt-0.5 text-lg font-bold text-[#17201e]">Recent inventory activity</h2>
                        </div>
                    </header>
                    {movements?.length ? (
                        <div className="divide-y divide-[#edf0ee]">
                            {movements.slice(0, 6).map((m: any) => (
                                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{m.product?.name || "Product update"}</p>
                                        <p className="text-xs capitalize text-slate-400 mt-0.5">{m.type}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${m.quantity_delta < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                        {m.quantity_delta > 0 ? "+" : ""}{m.quantity_delta}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-slate-400">Stock movement will appear here.</p>
                    )}
                </section>

            </div>
        </WixLayout>
    );
}
