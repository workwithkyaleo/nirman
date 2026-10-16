import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SiteWorkspaceNav from "@/Components/SiteWorkspaceNav";
import { Head, Link, router } from "@inertiajs/react";
import { FormEvent, useState } from "react";

const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount / 100);

export default function Index({ site, products, filters }: any) {
    const [search, setSearch] = useState(filters.search || "");
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route("products.index", site.id),
            { search },
            { preserveState: true, replace: true },
        );
    };
    return (
        <AuthenticatedLayout
            header={
                <div className="studio-head">
                    <div>
                        <p className="eyebrow">Catalogue</p>
                        <h1>Products</h1>
                    </div>
                    <div className="studio-actions">
                        <Link
                            className="button button-ghost"
                            href={route("commerce.hub", site.id)}
                        >
                            Commerce hub
                        </Link>
                        <Link
                            className="button button-dark"
                            href={route("products.create", site.id)}
                        >
                            + Add product
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Products · ${site.name}`} />
            <main className="app-shell py-10">
                <SiteWorkspaceNav
                    site={site}
                    active="products"
                    canManage={Boolean(site.can_manage)}
                    canManageStore
                />
                <div className="catalogue-toolbar mt-6">
                    <form onSubmit={submit}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by product or SKU…"
                        />
                        <button className="button button-ghost">Search</button>
                    </form>
                    <span>{products.total} products</span>
                </div>
                {products.data.length ? (
                    <div className="product-table">
                        <div className="product-table-head">
                            <span>Product</span>
                            <span>Category</span>
                            <span>Price</span>
                            <span>Stock</span>
                            <span>Status</span>
                            <span />
                        </div>
                        {products.data.map((product: any) => (
                            <div className="product-table-row" key={product.id}>
                                <div className="product-identity">
                                    {product.image_path ? (
                                        <img
                                            src={`/storage/${product.image_path}`}
                                            alt=""
                                        />
                                    ) : (
                                        <span className="product-placeholder">
                                            ◫
                                        </span>
                                    )}
                                    <div>
                                        <b>{product.name}</b>
                                        <small>{product.sku || "No SKU"}</small>
                                    </div>
                                </div>
                                <span>
                                    {product.category?.name || "Uncategorized"}
                                </span>
                                <div>
                                    {product.sale_price_minor != null && product.sale_price_minor < product.price_minor ? (
                                        <>
                                            <b>
                                                {money(
                                                    product.sale_price_minor,
                                                    site.currency,
                                                )}
                                            </b>
                                            <small className="price-old">
                                                {money(
                                                    product.price_minor,
                                                    site.currency,
                                                )}
                                            </small>
                                        </>
                                    ) : (
                                        <b>
                                            {money(
                                                product.price_minor,
                                                site.currency,
                                            )}
                                        </b>
                                    )}
                                </div>
                                <strong
                                    className={
                                        product.stock_quantity <= 5
                                            ? "stock-low"
                                            : ""
                                    }
                                >
                                    {product.stock_quantity}
                                </strong>
                                <span
                                    className={`status ${product.is_active ? "published" : ""}`}
                                >
                                    {product.is_active ? "Active" : "Hidden"}
                                </span>
                                <div className="row-actions">
                                    <Link
                                        href={route("products.edit", {
                                            site: site.id,
                                            product: product.id,
                                        })}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() =>
                                            confirm(
                                                `Delete ${product.name}?`,
                                            ) &&
                                            router.delete(
                                                route("products.destroy", {
                                                    site: site.id,
                                                    product: product.id,
                                                }),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">◫</div>
                        <h3>Add your first product</h3>
                        <p>
                            Create a product with price, stock, category and an
                            image. It will be ready for your storefront
                            catalogue.
                        </p>
                        <Link
                            className="button button-dark"
                            href={route("products.create", site.id)}
                        >
                            + Add product
                        </Link>
                    </div>
                )}
                <div className="pagination">
                    {products.links.map((link: any, i: number) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            className={link.active ? "active" : ""}
                            onClick={() =>
                                link.url &&
                                router.get(
                                    link.url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
