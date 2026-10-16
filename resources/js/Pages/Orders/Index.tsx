import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SiteWorkspaceNav from "@/Components/SiteWorkspaceNav";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-NP", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
const badge = (status: string) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${status === "delivered" ? "bg-emerald-100 text-emerald-700" : status === "cancelled" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{status}</span>;

export default function Orders({ site, orders, statusCounts }: any) {
    const [updating, setUpdating] = useState<number | null>(null);
    const update = (id: number, status: string) => {
        setUpdating(id);
        router.patch(route("orders.status.update", [site.id, id]), { status, notify_customer: true }, { preserveScroll: true, onFinish: () => setUpdating(null) });
    };
    return <AuthenticatedLayout header={<div><p className="eyebrow">Store operations</p><h1 className="text-3xl font-bold text-slate-900">Orders</h1></div>}>
        <Head title={`Orders · ${site.name}`} />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <SiteWorkspaceNav site={site} active="orders" canManage={site.can_manage} canManageStore />
            <section className="rounded-3xl bg-[#173f37] px-6 py-8 text-white sm:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#b7d7cc]">Order desk</p><div className="mt-4 flex flex-wrap gap-7"><div><b className="text-3xl">{orders.total}</b><span className="ml-2 text-sm text-[#c6ded6]">total orders</span></div><div><b className="text-3xl">{statusCounts.pending || 0}</b><span className="ml-2 text-sm text-[#c6ded6]">to confirm</span></div><div><b className="text-3xl">{(statusCounts.processing || 0) + (statusCounts.dispatched || 0)}</b><span className="ml-2 text-sm text-[#c6ded6]">in fulfilment</span></div></div></section>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Manage every order</h2><p className="mt-1 text-sm text-slate-500">Each status change records a timeline event and queues a WhatsApp update when configured.</p></div>
                {orders.data.length ? <div className="divide-y divide-slate-100">{orders.data.map((order: any) => <article key={order.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-[155px]"><b className="text-slate-900">#{order.number}</b><p className="mt-1 text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p></div><div className="min-w-[180px]"><b className="text-sm text-slate-800">{order.customer_name}</b><p className="text-xs text-slate-500">{order.phone} · {order.city}</p></div><div className="flex-1 text-sm text-slate-600">{order.items.map((item: any) => `${item.quantity}× ${item.name}`).join(", ")}</div><div className="flex items-center gap-3">{badge(order.status)}<b className="min-w-[95px] text-right text-sm text-slate-900">{money(order.total_minor, site.currency)}</b></div><div className="flex gap-2">{order.next_statuses.map((status: string) => <button disabled={updating === order.id} onClick={() => update(order.id, status)} className="rounded-lg border border-[#b8ccc5] px-3 py-2 text-xs font-bold capitalize text-[#173f37] hover:bg-[#eaf4f0] disabled:opacity-50" key={status}>{updating === order.id ? "Updating…" : status}</button>)}</div></article>)}</div> : <div className="p-12 text-center text-slate-500">Orders from your online store will appear here.</div>}
            </section>
        </main>
    </AuthenticatedLayout>;
}
