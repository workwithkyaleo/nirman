import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
export default function Dashboard({ sites = [] }: { sites: any[] }) {
    const { brand } = usePage().props as any;
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="eyebrow">Your workspace</p>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Good to see you.
                    </h1>
                </div>
            }
        >
            <Head title="Dashboard" />
            <main className="app-shell py-10">
                <section className="hero-panel">
                    <div>
                        <span className="pill">AI website studio</span>
                        <h2>Build something people remember.</h2>
                        <p>
                            Shape your story, manage your store, and publish
                            with confidence—all from one calm workspace.
                        </p>
                    </div>
                    <Link
                        href={route("sites.create")}
                        className="button button-light"
                    >
                        Create a website →
                    </Link>
                </section>
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Websites</p>
                        <h2>Your digital storefronts</h2>
                    </div>
                </div>
                {sites.length ? (
                    <div className="site-grid">
                        {sites.map((site) => (
                            <article className="site-card" key={site.id}>
                                <div className="site-preview">
                                    <div className="preview-orb" />
                                    <span>
                                        {site.type === "store"
                                            ? "Online store"
                                            : "Business site"}
                                    </span>
                                </div>
                                <div className="site-card-body">
                                    <div>
                                        <h3>{site.name}</h3>
                                        <p>
                                            {site.slug}.{brand.siteDomain}
                                        </p>
                                    </div>
                                    <span className={`status ${site.status}`}>
                                        {site.status}
                                    </span>
                                    <div className="site-stats">
                                        <span>
                                            {site.products_count} products
                                        </span>
                                        <span>{site.orders_count} orders</span>
                                    </div>
                                    {site.type === "store" && (
                                        <Link
                                            className="button button-accent"
                                            href={route(
                                                "commerce.hub",
                                                site.id,
                                            )}
                                        >
                                            Commerce hub
                                        </Link>
                                    )}
                                    <Link
                                        className="button button-dark"
                                        href={route("sites.admin", site.id)}
                                    >
                                        Manage website
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">✦</div>
                        <h3>Your first website starts here</h3>
                        <p>
                            Answer a few questions and our local AI generator
                            will create a polished first draft.
                        </p>
                        <Link
                            href={route("sites.create")}
                            className="button button-dark"
                        >
                            Start building
                        </Link>
                    </div>
                )}
            </main>
        </AuthenticatedLayout>
    );
}
