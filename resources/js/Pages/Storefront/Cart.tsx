import StorefrontLayout from "@/Components/StorefrontLayout";
import { Head, Link, router } from "@inertiajs/react";
export default function Cart({
    site,
    theme,
    items,
    subtotal_minor,
    cartCount,
}: any) {
    const money = (n: number) =>
        new Intl.NumberFormat("en-NP", {
            style: "currency",
            currency: site.currency,
            maximumFractionDigits: 0,
        }).format(n / 100);
    return (
        <StorefrontLayout site={site} theme={theme} cartCount={cartCount}>
            <Head title={`Cart · ${site.name}`} />
            <main id="main-content" tabIndex={-1} className="cart-shell">
                <div>
                    <p className="eyebrow">Your cart</p>
                    <h1>Review your order</h1>
                </div>
                {items.length ? (
                    <div className="cart-layout">
                        <section className="cart-items">
                            {items.map((item: any) => (
                                <article key={`${item.product.id}:${item.variant?.id || "default"}`}>
                                    {(item.variant?.image_path || item.product.image_path) ? (
                                        <img
                                            src={`/storage/${item.variant?.image_path || item.product.image_path}`}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <span className="cart-image" />
                                    )}
                                    <div>
                                        <b>{item.product.name}</b>
                                        {item.variant && <small>Color: {item.variant.name}</small>}
                                        <small>
                                            {money(item.unit_price_minor)} each
                                        </small>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.product.stock_quantity}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            router.patch(
                                                route(
                                                    "storefront.cart.update",
                                                    {
                                                        siteSlug: site.slug,
                                                        product:
                                                            item.product.id,
                                                    },
                                                ),
                                                {
                                                    quantity: Number(
                                                        e.target.value,
                                                    ),
                                                    variant_id: item.variant?.id,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                    <strong>{money(item.total_minor)}</strong>
                                    <button
                                        onClick={() =>
                                            router.patch(
                                                route(
                                                    "storefront.cart.update",
                                                    {
                                                        siteSlug: site.slug,
                                                        product:
                                                            item.product.id,
                                                    },
                                                ),
                                                { quantity: 0, variant_id: item.variant?.id },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </article>
                            ))}
                        </section>
                        <aside className="cart-summary">
                            <h2>Order summary</h2>
                            <div>
                                <span>Subtotal</span>
                                <b>{money(subtotal_minor)}</b>
                            </div>
                            <div>
                                <span>Delivery</span>
                                <b>Calculated at checkout</b>
                            </div>
                            <hr />
                            <div>
                                <strong>Total</strong>
                                <strong>{money(subtotal_minor)}</strong>
                            </div>
                            <Link
                                className="button button-public"
                                href={route("storefront.checkout", site.slug)}
                            >
                                Continue to checkout
                            </Link>
                            <Link href={route("storefront.shop", site.slug)}>
                                Continue shopping
                            </Link>
                        </aside>
                    </div>
                ) : (
                    <div className="store-empty">
                        <h2>Your cart is empty</h2>
                        <p>Browse the shop and add something you love.</p>
                        <Link
                            className="button button-public"
                            href={route("storefront.shop", site.slug)}
                        >
                            Browse products
                        </Link>
                    </div>
                )}
            </main>
        </StorefrontLayout>
    );
}
