import StorefrontLayout from "@/Components/StorefrontLayout";
import { Head, useForm } from "@inertiajs/react";
export default function Checkout({
    site,
    theme,
    items,
    subtotal_minor,
    delivery_minor,
    cartCount,
}: any) {
    const form = useForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        notes: "",
        payment_method: "cod",
    });
    const money = (n: number) =>
        new Intl.NumberFormat("en-NP", {
            style: "currency",
            currency: site.currency,
            maximumFractionDigits: 0,
        }).format(n / 100);
    const field = (
        key: string,
        label: string,
        placeholder: string,
        type = "text",
    ) => (
        <label>
            {label}
            <input
                type={type}
                value={(form.data as any)[key]}
                onChange={(e) => form.setData(key as any, e.target.value)}
                placeholder={placeholder}
            />
            {(form.errors as any)[key] && (
                <small className="field-error">
                    {(form.errors as any)[key]}
                </small>
            )}
        </label>
    );
    return (
        <StorefrontLayout site={site} theme={theme} cartCount={cartCount}>
            <Head title={`Checkout · ${site.name}`} />
            <main id="main-content" tabIndex={-1} className="checkout-shell">
                <div>
                    <p className="eyebrow">Secure checkout</p>
                    <h1>Delivery details</h1>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route("storefront.order", site.slug));
                    }}
                >
                    <section className="checkout-form">
                        {field("name", "Full name", "Your name")}
                        {field("phone", "Phone number", "98XXXXXXXX", "tel")}
                        {field(
                            "email",
                            "Email (optional)",
                            "you@example.com",
                            "email",
                        )}
                        {field("city", "City / district", "Kathmandu")}
                        <label>
                            Delivery address
                            <textarea
                                rows={3}
                                value={form.data.address}
                                onChange={(e) =>
                                    form.setData("address", e.target.value)
                                }
                                placeholder="Area, street, landmark and house number"
                            />
                            {form.errors.address && (
                                <small className="field-error">
                                    {form.errors.address}
                                </small>
                            )}
                        </label>
                        <label>
                            Order note (optional)
                            <textarea
                                rows={2}
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData("notes", e.target.value)
                                }
                                placeholder="Delivery instructions or product preferences"
                            />
                        </label>
                        <div className="payment-choice">
                            <input type="radio" checked readOnly />
                            <span>
                                <b>Cash on Delivery</b>
                                <small>Pay when your order arrives</small>
                            </span>
                        </div>
                    </section>
                    <aside className="cart-summary">
                        <h2>Your order</h2>
                        {items.map((item: any) => (
                            <div key={item.product.id}>
                                <span>
                                    {item.product.name} × {item.quantity}
                                </span>
                                <b>{money(item.total_minor)}</b>
                            </div>
                        ))}
                        <hr />
                        <div>
                            <span>Subtotal</span>
                            <b>{money(subtotal_minor)}</b>
                        </div>
                        <div>
                            <span>Delivery</span>
                            <b>
                                {delivery_minor
                                    ? money(delivery_minor)
                                    : "Free"}
                            </b>
                        </div>
                        <div className="checkout-total">
                            <strong>Total</strong>
                            <strong>
                                {money(subtotal_minor + delivery_minor)}
                            </strong>
                        </div>
                        <button
                            className="button button-public"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? "Placing order…"
                                : "Place COD order"}
                        </button>
                        <small>
                            By ordering, you confirm that your phone and
                            delivery details are correct.
                        </small>
                    </aside>
                </form>
            </main>
        </StorefrontLayout>
    );
}
