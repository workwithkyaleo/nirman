import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import type { CSSProperties } from "react";
import "../../../css/marketing.css";

type Template = {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    theme: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string };
};

export default function Index({ auth, brand, templates }: PageProps<{ templates: Template[] }>) {
    const productName = brand?.name || "SiteSajilo";
    const href = (template: Template) => auth.user
        ? route("sites.create", { template: template.id })
        : route("register");
    const previewTitle = (template: Template) =>
        template.slug.includes("commerce") || template.slug.includes("doko")
            ? "Thoughtful things, made to last."
            : "A new point of view.";

    return (
        <div className="ss-marketing ss-template-page">
            <Head title={"Website templates · " + productName} />
            <header className="ss-header">
                <Link href="/" className="ss-logo"><span className="ss-logo-mark">S</span>{productName}</Link>
                <nav className="ss-nav"><Link href="/">Home</Link><span className="text-[#1554e8]">Templates</span></nav>
                <div className="ss-header-actions">
                    {!auth.user && <Link className="ss-login" href={route("login")}>Log in</Link>}
                    <Link className="ss-button ss-button-small" href={auth.user ? route("sites.create") : route("register")}>Get Started</Link>
                </div>
            </header>
            <main>
                <section className="ss-template-hero">
                    <p className="ss-kicker">START WITH A SOLID FOUNDATION</p>
                    <h1>Templates made<br />to become yours.</h1>
                    <p>Choose a studio-built layout, then customize every word, color, product and page in your own workspace.</p>
                </section>
                <section className="ss-template-gallery" aria-label="Website templates">
                    {templates.map((template) => (
                        <article key={template.id} className="ss-template-item">
                            <div className={"ss-template-art ss-template-art--" + template.slug} style={{
                                "--tp": template.theme.primary,
                                "--ts": template.theme.secondary,
                                "--ta": template.theme.accent,
                                "--tb": template.theme.background,
                                "--tt": template.theme.text,
                            } as CSSProperties}>
                                <div className="ss-template-browser"><span /><span /><span /></div>
                                <div className="ss-template-nav"><b>{template.name}</b><i>About&nbsp;&nbsp; Work&nbsp;&nbsp; Contact</i></div>
                                <div className="ss-template-copy"><small>{template.category}</small><strong>{previewTitle(template)}</strong><em>Discover more →</em></div>
                                <div className="ss-template-shape" />
                            </div>
                            <div className="ss-template-meta">
                                <div><p>{template.category}</p><h2>{template.name}</h2><span>{template.description}</span></div>
                                <Link href={href(template)} className="ss-template-use">Use template →</Link>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
}
