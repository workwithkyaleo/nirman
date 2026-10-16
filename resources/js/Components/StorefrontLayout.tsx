import PublicMobileNavigation from "@/Components/PublicMobileNavigation";
import DraftPreviewControls from "@/Components/DraftPreviewControls";
import { publicThemeClassName, publicThemeStyle } from "@/lib/publicTheme";
import { Link, usePage } from "@inertiajs/react";
import { PropsWithChildren, useEffect } from "react";

export default function StorefrontLayout({
    site,
    theme,
    cartCount = 0,
    isPreview = false,
    children,
}: PropsWithChildren<{ site: any; theme: any; cartCount?: number; isPreview?: boolean }>) {
    const page = usePage();
    const flash = (page.props as any).flash;
    const navigation = ((page.props as any).navigation || []) as any[];
    const style = publicThemeStyle(theme);
    const seenLabels = new Set(["home", "shop"]);
    const websitePages = navigation.filter((item) => {
        const label = String(item.title).trim().toLocaleLowerCase();
        const slug = String(item.slug).trim().toLocaleLowerCase();
        if (!label || seenLabels.has(label) || slug === "home" || slug === "shop")
            return false;
        seenLabels.add(label);
        return true;
    });
    const homeHref = isPreview
        ? route("sites.preview", site.id)
        : route("public.site", { siteSlug: site.slug });
    const navigationItems = [
        {
            label: "Shop",
            href: isPreview
                ? route("sites.preview.shop", site.id)
                : route("storefront.shop", site.slug),
            current:
                page.url.includes("/shop") &&
                !page.url.includes("/cart") &&
                !page.url.includes("/checkout"),
        },
        {
            label: "Home",
            href: homeHref,
            current: false,
        },
        ...websitePages.map((item) => ({
            label: item.title,
            href: isPreview
                ? route("sites.preview", { site: site.id, pageSlug: item.slug })
                : route("public.site", { siteSlug: site.slug, pageSlug: item.slug }),
            current: false,
        })),
    ];

    useEffect(() => {
        if (site.locale) document.documentElement.lang = site.locale;
    }, [site.locale]);

    return (
        <div
            className={publicThemeClassName(theme, undefined, "storefront")}
            style={style}
        >
            {isPreview && (
                <DraftPreviewControls siteId={site.id} />
            )}
            {flash?.success && (
                <div className="flash-message success" role="status">
                    ✓ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="flash-message error" role="alert">
                    {flash.error}
                </div>
            )}
            <a className="public-skip-link" href="#main-content">
                Skip to content
            </a>
            <header
                className={`public-header header-${theme?.header_layout || "split"}`}
            >
                <Link href={homeHref}>
                    {site.logo_path && (
                        <img src={`/storage/${site.logo_path}`} alt="" />
                    )}
                    {site.name}
                </Link>
                <nav aria-label="Primary navigation">
                    <ul>
                        {navigationItems.map((item) => (
                            <li key={item.label}>
                                <Link
                                    href={item.href}
                                    aria-current={
                                        item.current ? "page" : undefined
                                    }
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                {!isPreview && <Link
                    className="cart-link"
                    href={route("storefront.cart", site.slug)}
                >
                    Cart <b>{cartCount}</b>
                </Link>}
                <PublicMobileNavigation
                    items={navigationItems}
                    action={isPreview ? undefined : {
                        label: `Cart (${cartCount})`,
                        href: route("storefront.cart", site.slug),
                    }}
                />
            </header>
            {children}
            <footer className={`footer-${theme?.footer_layout || "columns"}`}>
                <b>{site.name}</b>
                <p>Questions? Call {site.phone || "our team"}.</p>
                <small>Secure ordering · Cash on delivery</small>
            </footer>
        </div>
    );
}
