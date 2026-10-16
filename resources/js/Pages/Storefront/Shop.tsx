import StorefrontLayout from "@/Components/StorefrontLayout";
import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";
const money = (n: number, c: string) =>
    new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0,
    }).format(n / 100);
export default function Shop({
    site,
    theme,
    products,
    cartCount,
    filters,
    isPreview = false,
}: any) {
    const [search, setSearch] = useState(filters.search || "");
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            isPreview
                ? route("sites.preview.shop", site.id)
                : route("storefront.shop", site.slug),
            { search },
            { preserveState: true },
        );
    };
    return (
        <StorefrontLayout site={site} theme={theme} cartCount={cartCount} isPreview={isPreview}>
            <Head title={`Shop · ${site.name}`} />
            <main id="main-content" tabIndex={-1} className="shop-shell">
                <header className="shop-title">
                    <p className="eyebrow">Online store</p>
                    <h1>Shop {site.name}</h1>
                    <form onSubmit={submit}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products…"
                        />
                        <button className="button button-public">Search</button>
                    </form>
                </header>
                {products.data.length ? (
                    <div className="store-product-grid">
                        {products.data.map((p: any) => (
                            <article key={p.id}>
                                <Link
                                    className="store-product-image"
                                    href={isPreview ? route("sites.preview.product", {site: site.id, productSlug: p.slug}) : route("storefront.product", {siteSlug: site.slug, productSlug: p.slug})}
                                >
                                    {p.image_path ? (
                                        <img
                                            src={`/storage/${p.image_path}`}
                                            alt={p.name}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <span>Product photo</span>
                                    )}
                                    {p.is_featured && <small>Featured</small>}
                                </Link>
                                <div className="store-product-body">
                                    <Link
                                        href={isPreview ? route("sites.preview.product", {site: site.id, productSlug: p.slug}) : route("storefront.product", {siteSlug: site.slug, productSlug: p.slug})}
                                    >
                                        <h2>{p.name}</h2>
                                    </Link>
                                    <span>{p.category?.name || ""}</span>
                                    <div className="store-product-price">
                                        <strong>
                                            {money(
                                                p.sale_price_minor != null && p.sale_price_minor < p.price_minor
                                                    ? p.sale_price_minor
                                                    : p.price_minor,
                                                site.currency,
                                            )}
                                        </strong>
                                        {p.sale_price_minor != null && p.sale_price_minor < p.price_minor && (
                                            <del>
                                                {money(
                                                    p.price_minor,
                                                    site.currency,
                                                )}
                                            </del>
                                        )}
                                    </div>
                                    <Link
                                        className="button button-public"
                                        href={isPreview ? route("sites.preview.product", {site: site.id, productSlug: p.slug}) : route("storefront.product", {siteSlug: site.slug, productSlug: p.slug})}
                                    >
                                        {p.stock_quantity
                                            ? "View product"
                                            : "Out of stock"}
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="store-empty">
                        <h2>No products found</h2>
                        <p>Try another search or check back soon.</p>
                    </div>
                )}
            </main>
        </StorefrontLayout>
    );
}
