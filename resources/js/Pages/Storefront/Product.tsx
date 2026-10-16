import StorefrontLayout from "@/Components/StorefrontLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { useState } from "react";
export default function Product({ site, theme, product, cartCount, isPreview = false }: any) {
    const defaultVariant = product.variants?.[0] ?? null;
    const form = useForm({ quantity: 1, variant_id: (defaultVariant?.id ?? null) as number | null });
    const [selectedColor, setSelectedColor] = useState<any>(defaultVariant);
    const displayedImage = selectedColor?.image_path || product.image_path;
    const isOnSale = product.sale_price_minor != null && product.sale_price_minor < product.price_minor;
    const price = isOnSale ? product.sale_price_minor : product.price_minor;
    const money = (n: number) =>
        new Intl.NumberFormat("en-NP", {
            style: "currency",
            currency: site.currency,
            maximumFractionDigits: 0,
        }).format(n / 100);
    return (
        <StorefrontLayout site={site} theme={theme} cartCount={cartCount} isPreview={isPreview}>
            <Head title={`${product.name} · ${site.name}`} />
            <main id="main-content" tabIndex={-1} className="product-detail">
                <div className="product-detail-gallery">
                    <div className="product-detail-image">
                        {displayedImage ? (
                            <img src={`/storage/${displayedImage}`} alt={selectedColor ? `${product.name} in ${selectedColor.name}` : product.name} decoding="async" fetchPriority="high" />
                        ) : (
                            <span>Product photo</span>
                        )}
                    </div>
                    {product.variants?.length > 0 && (
                        <fieldset className="product-color-options mt-4">
                            <legend><b>{selectedColor ? `Color: ${selectedColor.name}` : "Choose a color"}</b></legend>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {product.variants.map((color: any) => (
                                    <button key={color.id} type="button" aria-label={`Show ${color.name}`} aria-pressed={selectedColor?.id === color.id} onClick={() => { setSelectedColor(color); form.setData("variant_id", color.id); }} className={`flex min-w-24 items-center gap-2 rounded-xl border-2 p-2 text-left ${selectedColor?.id === color.id ? "border-slate-950 ring-2 ring-slate-300" : "border-slate-200"}`}>
                                        {color.image_path ? <img className="h-12 w-12 rounded-lg object-cover" src={`/storage/${color.image_path}`} alt="" /> : <span className="h-9 w-9 rounded-full border" style={{ backgroundColor: color.color_hex || "#d1d5db" }} />}
                                        <span>{color.name}</span>
                                    </button>
                                ))}
                            </div>
                            {form.errors.variant_id && <small className="field-error">{form.errors.variant_id}</small>}
                        </fieldset>
                    )}
                </div>
                <div className="product-detail-copy">
                    <Link href={isPreview ? route("sites.preview.shop", site.id) : route("storefront.shop", site.slug)}>
                        ← Back to shop
                    </Link>
                    <p className="eyebrow">
                        {product.category?.name || "Product"}
                    </p>
                    <h1>{product.name}</h1>
                    <div className="detail-price">
                        <strong>{money(price)}</strong>
                        {isOnSale && (
                            <del>{money(product.price_minor)}</del>
                        )}
                    </div>
                    <p>
                        {product.description ||
                            "A quality product from our collection."}
                    </p>
                    <p
                        className={
                            product.stock_quantity > 0
                                ? "in-stock"
                                : "out-stock"
                        }
                    >
                        {product.stock_quantity > 0
                            ? `${product.stock_quantity} available`
                            : "Out of stock"}
                    </p>
                    {product.stock_quantity > 0 && !isPreview && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post(
                                    route("storefront.cart.add", {
                                        siteSlug: site.slug,
                                        product: product.id,
                                    }),
                                );
                            }}
                        >
                            <label>
                                Quantity
                                <input
                                    type="number"
                                    min="1"
                                    max={product.stock_quantity}
                                    value={form.data.quantity}
                                    onChange={(e) =>
                                        form.setData(
                                            "quantity",
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </label>
                            <button
                                className="button button-public"
                                disabled={form.processing}
                            >
                                {form.processing ? "Adding…" : "Add to cart"}
                            </button>
                        </form>
                    )}
                    {product.stock_quantity > 0 && isPreview && (
                        <p>Publish the site to enable cart and checkout.</p>
                    )}
                </div>
            </main>
        </StorefrontLayout>
    );
}
