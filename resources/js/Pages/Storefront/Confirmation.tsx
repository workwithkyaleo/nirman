import StorefrontLayout from "@/Components/StorefrontLayout";
import { Head, Link } from "@inertiajs/react";
export default function Confirmation({ site, theme, order }: any) {
    const total = new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: order.currency,
        maximumFractionDigits: 0,
    }).format(order.total_minor / 100);
    return (
        <StorefrontLayout site={site} theme={theme}>
            <Head title={`Order ${order.number}`} />
            <main id="main-content" tabIndex={-1} className="confirmation">
                <span>✓</span>
                <p className="eyebrow">Order confirmed</p>
                <h1>Thank you for your order.</h1>
                <p>
                    We received order <b>#{order.number}</b>. The store will
                    contact you at your provided phone number before delivery.
                </p>
                <div>
                    <span>Cash on delivery total</span>
                    <strong>{total}</strong>
                </div>
                <Link
                    className="button button-public"
                    href={route("storefront.shop", site.slug)}
                >
                    Continue shopping
                </Link>
            </main>
        </StorefrontLayout>
    );
}
