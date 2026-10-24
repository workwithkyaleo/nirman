import WixLayout from "@/Layouts/WixLayout";
import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";

const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);

export default function Index({ site, products, filters }: any) {
    const [search, setSearch] = useState(filters.search || "");

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route("products.index", site.id), { search }, { preserveState: true, replace: true });
    };

    const deleteProduct = (product: any) => {
        if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
            router.delete(route("products.destroy", { site: site.id, product: product.id }), { preserveScroll: true });
        }
    };

    return (
        <WixLayout site={site} activeSection="catalog" title="Catalog"
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
            <Head title={`Products · ${site.name}`} />

            <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">Catalog</p>
                        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#17201e]">Products</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("commerce.hub", site.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Commerce Hub
                        </Link>
                        <Link
                            href={route("products.create", site.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173f37] px-4 py-2 text-sm font-bold text-white hover:bg-[#225d50] transition"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Add product
                        </Link>
                    </div>
                </div>

                {/* ── Search + Count Bar ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e0e5e2] bg-white px-4 py-3 shadow-sm">
                    <form onSubmit={submit} className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by product name or SKU…"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 transition"
                            />
                        </div>
                        <button type="submit" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                            Search
                        </button>
                    </form>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{products.total} products</span>
                    </div>
                </div>

                {/* ── Products Table ── */}
                {products.data.length ? (
                    <div className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm">
                        {/* Table header */}
                        <div className="border-b border-[#e9eeeb] bg-slate-50/70 px-5 py-3 grid grid-cols-[2fr_1fr_1fr_80px_90px_100px] gap-4 items-center">
                            {["Product", "Category", "Price", "Stock", "Status", ""].map(h => (
                                <span key={h} className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{h}</span>
                            ))}
                        </div>

                        <div className="divide-y divide-[#edf0ee]">
                            {products.data.map((product: any) => (
                                <div
                                    key={product.id}
                                    className="grid grid-cols-[2fr_1fr_1fr_80px_90px_100px] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 transition group"
                                >
                                    {/* Product identity */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {product.image_path ? (
                                            <img
                                                src={`/storage/${product.image_path}`}
                                                alt={product.name}
                                                className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-lg border border-slate-200">
                                                🛍️
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-sm text-[#17201e]">{product.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{product.sku || "No SKU"}</p>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <span className="text-sm text-slate-500 truncate">{product.category?.name || "Uncategorized"}</span>

                                    {/* Price */}
                                    <div>
                                        {product.sale_price_minor != null && product.sale_price_minor < product.price_minor ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#17201e]">{money(product.sale_price_minor, site.currency)}</span>
                                                <span className="text-xs text-slate-400 line-through">{money(product.price_minor, site.currency)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-[#17201e]">{money(product.price_minor, site.currency)}</span>
                                        )}
                                    </div>

                                    {/* Stock */}
                                    <span className={`text-sm font-bold ${product.stock_quantity <= 5 ? "text-orange-600" : "text-slate-700"}`}>
                                        {product.stock_quantity <= 5 && "⚠ "}
                                        {product.stock_quantity}
                                    </span>

                                    {/* Status */}
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${product.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-500 ring-slate-400/20"}`}>
                                        {product.is_active ? "Active" : "Hidden"}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 justify-end">
                                        <Link
                                            href={route("products.edit", { site: site.id, product: product.id })}
                                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-[#0f766e] hover:text-[#0f766e] transition"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => deleteProduct(product)}
                                            className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-50 text-3xl text-amber-600 shadow-sm">🛍️</div>
                        <div>
                            <h2 className="text-lg font-extrabold text-[#17201e]">No products yet</h2>
                            <p className="mt-1 max-w-xs text-sm text-slate-500">Add your first product with price, stock, and an image — it'll appear in your storefront immediately.</p>
                        </div>
                        <Link
                            href={route("products.create", site.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#173f37] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#225d50] transition"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Add your first product
                        </Link>
                    </div>
                )}

                {/* ── Pagination ── */}
                {products.links?.length > 3 && (
                    <div className="flex items-center justify-center gap-2">
                        {products.links.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                                    link.active
                                        ? "border-[#173f37] bg-[#173f37] text-white"
                                        : !link.url
                                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
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
