import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SiteWorkspaceNav from "@/Components/SiteWorkspaceNav";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEvent, useMemo } from "react";

export default function Form({ site, product, categories }: any) {
    const form = useForm<any>({
        name: product?.name || "",
        category: product?.category?.name || "",
        sku: product?.sku || "",
        description: product?.description || "",
        price: product ? product.price_minor / 100 : "",
        sale_price: product?.sale_price_minor
            ? product.sale_price_minor / 100
            : "",
        stock_quantity: product?.stock_quantity ?? 0,
        is_featured: Boolean(product?.is_featured),
        is_active: product ? Boolean(product.is_active) : true,
        image: null,
        colors: (product?.variants || []).map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            color_hex: variant.color_hex || "#000000",
            image_path: variant.image_path,
            image: null,
        })),
    });
    const preview = useMemo(
        () =>
            form.data.image
                ? URL.createObjectURL(form.data.image)
                : product?.image_path
                  ? `/storage/${product.image_path}`
                  : null,
        [form.data.image, product?.image_path],
    );
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options: any = { forceFormData: true };
        if (product) {
            form.transform((data: any) => ({ ...data, _method: "patch" }));
            form.post(
                route("products.update", {
                    site: site.id,
                    product: product.id,
                }),
                options,
            );
        } else form.post(route("products.store", site.id), options);
    };
    const field = (
        key: string,
        label: string,
        type = "text",
        placeholder = "",
    ) => (
        <label>
            {label}
            <input
                type={type}
                value={form.data[key]}
                onChange={(e) => form.setData(key, e.target.value)}
                placeholder={placeholder}
            />
            {form.errors[key] && (
                <small className="field-error">{form.errors[key]}</small>
            )}
        </label>
    );
    return (
        <AuthenticatedLayout
            header={
                <div className="studio-head">
                    <div>
                        <p className="eyebrow">
                            {product ? "Edit product" : "New product"}
                        </p>
                        <h1>{product?.name || "Add a product"}</h1>
                    </div>
                    <Link
                        className="button button-ghost"
                        href={route("products.index", site.id)}
                    >
                        ← Products
                    </Link>
                </div>
            }
        >
            <Head title={product ? `Edit ${product.name}` : "Add product"} />
            <main className="app-shell py-10">
                <SiteWorkspaceNav
                    site={site}
                    active="products"
                    canManage={Boolean(site.can_manage)}
                    canManageStore
                />
                <form
                    onSubmit={submit}
                    className="product-form mx-auto mt-6 max-w-[850px]"
                >
                    <section className="form-card">
                        <h2>Product details</h2>
                        {field(
                            "name",
                            "Product name",
                            "text",
                            "e.g. Handwoven Dhaka Scarf",
                        )}
                        <label>
                            Description
                            <textarea
                                rows={6}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData("description", e.target.value)
                                }
                                placeholder="Materials, key features, sizing and what makes this product special."
                            />
                            {form.errors.description && (
                                <small className="field-error">
                                    {form.errors.description}
                                </small>
                            )}
                        </label>
                        <div className="form-grid">
                            <label>
                                Category
                                <input
                                    list="category-options"
                                    value={form.data.category}
                                    onChange={(e) =>
                                        form.setData("category", e.target.value)
                                    }
                                    placeholder="e.g. Accessories"
                                />
                                <datalist id="category-options">
                                    {categories.map((c: any) => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                            </label>
                            {field("sku", "SKU", "text", "e.g. DHS-001")}
                        </div>
                    </section>
                    <section className="form-card">
                        <h2>Pricing and inventory</h2>
                        <div className="form-grid">
                            {field(
                                "price",
                                `Regular price (${site.currency})`,
                                "number",
                                "0.00",
                            )}
                            {field(
                                "sale_price",
                                `Sale price (${site.currency})`,
                                "number",
                                "Optional",
                            )}
                        </div>
                        {field(
                            "stock_quantity",
                            "Stock quantity",
                            "number",
                            "0",
                        )}
                        <div className="product-switches">
                            <label className="toggle-row">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            "is_active",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <b>Active product</b>
                                    <small>
                                        Visible and available in the catalogue
                                    </small>
                                </span>
                            </label>
                            <label className="toggle-row">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_featured}
                                    onChange={(e) =>
                                        form.setData(
                                            "is_featured",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <b>Featured product</b>
                                    <small>
                                        Highlight this product on the homepage
                                    </small>
                                </span>
                            </label>
                        </div>
                    </section>
                    <section className="form-card">
                        <h2>Product image</h2>
                        <div className="image-uploader">
                            {preview ? (
                                <img src={preview} alt="Product preview" />
                            ) : (
                                <div>Drop in a clear product photo</div>
                            )}
                            <label className="button button-ghost">
                                Choose image
                                <input
                                    className="sr-only"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) =>
                                        form.setData(
                                            "image",
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                />
                            </label>
                            <small>JPG, PNG or WebP · maximum 4 MB</small>
                        </div>
                    </section>
                    <section className="form-card">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2>Color options</h2>
                                <p>Add each available color and its matching product photo.</p>
                            </div>
                            <button type="button" className="button button-ghost" onClick={() => form.setData("colors", [...form.data.colors, { name: "", color_hex: "#000000", image: null }])}>
                                Add color
                            </button>
                        </div>
                        {form.data.colors.map((color: any, index: number) => (
                            <div className="mt-5 rounded-xl border border-slate-200 p-4" key={color.id || index}>
                                <div className="form-grid">
                                    <label>Color name<input value={color.name} placeholder="e.g. Burgundy" onChange={(e) => form.setData("colors", form.data.colors.map((item: any, i: number) => i === index ? {...item, name: e.target.value} : item))} /></label>
                                    <label>Swatch color<input type="color" value={color.color_hex} onChange={(e) => form.setData("colors", form.data.colors.map((item: any, i: number) => i === index ? {...item, color_hex: e.target.value} : item))} /></label>
                                </div>
                                {(color.image || color.image_path) && <img className="mt-3 h-32 w-32 rounded-lg object-cover" src={color.image ? URL.createObjectURL(color.image) : `/storage/${color.image_path}`} alt={`${color.name || "Color"} preview`} />}
                                <div className="mt-3 flex items-center gap-3">
                                    <label className="button button-ghost">Choose color image<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => form.setData("colors", form.data.colors.map((item: any, i: number) => i === index ? {...item, image: e.target.files?.[0] || null} : item))} /></label>
                                    <button type="button" className="button button-ghost" onClick={() => form.setData("colors", form.data.colors.filter((_: any, i: number) => i !== index))}>Remove</button>
                                </div>
                                {form.errors[`colors.${index}.name`] && <small className="field-error">{form.errors[`colors.${index}.name`]}</small>}
                            </div>
                        ))}
                    </section>
                    <div className="product-form-actions">
                        <Link
                            className="button button-ghost"
                            href={route("products.index", site.id)}
                        >
                            Cancel
                        </Link>
                        <button
                            className="button button-dark"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? "Saving…"
                                : product
                                  ? "Save product"
                                  : "Add product"}
                        </button>
                    </div>
                </form>
            </main>
        </AuthenticatedLayout>
    );
}
