import { Head, Link } from "@inertiajs/react";
import PublicMobileNavigation from "@/Components/PublicMobileNavigation";
import DraftPreviewControls from "@/Components/DraftPreviewControls";
import WebsiteText, { type WebsiteEditor } from "@/Components/WebsiteText";
import DesignElements, { ElementImage } from "@/Components/DesignElements";
import ElementLink from "@/Components/ElementLink";
import {
    ElementDesignContext,
    designKey,
    elementLayoutStyle,
    safeHref,
    sectionElementStyle,
    type ElementDesignContent,
} from "@/lib/elementDesign";
import {
    textFontStack,
    textStyleProperties,
    type TextStyle,
    publicThemeClassName,
    publicThemeStyle,
} from "@/lib/publicTheme";
import { useEffect, type KeyboardEvent, type MouseEvent } from "react";
import {
    hasImageAppearance,
    heroImageStyle,
    imageAppearanceStyle,
    sectionAppearanceClassName,
    sectionAppearanceStyle,
    sectionDecoration,
    type ImageAppearance,
    type SectionAppearance,
} from "@/lib/sectionAppearance";

export default function PublicSite({
    site,
    theme,
    page,
    navigation,
    products,
    template,
    isPreview = false,
    editor,
}: {
    site: any;
    theme: any;
    page: any;
    navigation: any[];
    products: any[];
    template?: string;
    isPreview?: boolean;
    editor?: WebsiteEditor;
}) {
    const style = publicThemeStyle(theme);
    const money = (amount: number) =>
        new Intl.NumberFormat("en-NP", {
            style: "currency",
            currency: site.currency,
            maximumFractionDigits: 0,
        }).format(amount / 100);
    const whatsappUrl = site.whatsapp
        ? `https://wa.me/${String(site.whatsapp).replace(/\D/g, "")}`
        : null;
    const firstHero = page.sections.find(
        (section: any) => section.type === "hero",
    );
    const fallbackHeroImage = products[0]?.image_path
        ? `/storage/${products[0].image_path}`
        : null;
    const heroImageFor = (section: any) =>
        section?.content?.background_image ||
        (section?.id === firstHero?.id ? fallbackHeroImage : null);
    const headerHeroImage = heroImageFor(firstHero);
    const pageUrl = (pageSlug: string) =>
        isPreview
            ? route("sites.preview", {
                  site: site.id,
                  pageSlug,
              })
            : route("public.site", {
                  siteSlug: site.slug,
                  pageSlug,
              });
    const shopUrl = () =>
        isPreview
            ? route("sites.preview.shop", site.id)
            : route("storefront.shop", site.slug);
    const productUrl = (productSlug: string) =>
        isPreview
            ? route("sites.preview.product", {
                  site: site.id,
                  productSlug,
              })
            : route("storefront.product", {
                  siteSlug: site.slug,
                  productSlug,
              });
    const seenNavigationLabels = new Set<string>();
    const uniqueNavigation = navigation.filter((item) => {
        const label = String(item.title).trim().toLocaleLowerCase();
        if (!label || seenNavigationLabels.has(label)) return false;
        seenNavigationLabels.add(label);
        return true;
    });
    const navigationItems = [
        ...(site.type === "store"
            ? [
                  {
                      label: "Shop",
                      href: shopUrl(),
                      current: false,
                  },
              ]
            : []),
        ...uniqueNavigation
            .filter(
                (item) =>
                    site.type !== "store" ||
                    (String(item.slug).toLowerCase() !== "shop" &&
                        String(item.title).trim().toLowerCase() !== "shop"),
            )
            .map((item) => ({
                label: item.title,
                href: pageUrl(item.slug),
                current: item.slug === page.slug,
            })),
    ];

    useEffect(() => {
        if (!editor && site.locale) document.documentElement.lang = site.locale;
    }, [site.locale, editor]);
    const sectionEditorClass = (sectionId?: number) =>
        editor && sectionId != null
            ? `canva-website-section canva-editable-section ${editor.selectedSectionId === sectionId ? "is-selected" : ""}`
            : "";
    const sectionEditorProps = (sectionId?: number) =>
        editor && sectionId != null
            ? {
                  "data-site-section": sectionId,
                  onClick: () => {
                      if (editor.enabled) editor.onSelectSection(sectionId);
                  },
              }
            : {};
    const imageEditorProps = (
        sectionId?: number,
        itemIndex?: number,
        className?: string,
    ) => {
        const imageKey = designKey("image", itemIndex);
        if (!editor || sectionId == null)
            return { className, designKey: imageKey };
        const selected =
            editor.selectedSectionId === sectionId &&
            editor.selectedField === "image" &&
            (editor.selectedItemIndex ?? undefined) === itemIndex;
        const select = (event: MouseEvent<HTMLElement>) => {
            if (!editor.enabled) return;
            event.stopPropagation();
            editor.onSelectImage(sectionId, itemIndex);
        };
        return {
            className: `${className || ""} canva-editable-image ${selected ? "is-selected" : ""}`,
            designKey: imageKey,
            "data-site-image": sectionId,
            "data-site-item": itemIndex,
            role: editor.enabled ? "button" : undefined,
            tabIndex: editor.enabled ? 0 : undefined,
            onClick: select,
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                if (
                    editor.enabled &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    editor.onSelectImage(sectionId, itemIndex);
                }
            },
        };
    };
    const decorationFor = (
        appearance?: SectionAppearance | null,
        sectionId?: number,
        content?: ElementDesignContent,
    ) => {
        const decoration = sectionDecoration(appearance);
        const layout = content?.element_layouts?.decoration;
        const selected =
            editor?.selectedSectionId === sectionId &&
            editor?.selectedField === "decoration";
        return decoration ? (
            <ElementLink
                href={content?.links?.decoration}
                editor={!!editor}
                className="design-linked-image"
            >
                <span
                    className={`section-decoration section-decoration-${decoration} ${selected ? "is-selected" : ""}`}
                    data-design-key="decoration"
                    data-design-kind="shape"
                    data-site-section={sectionId}
                    style={
                        layout
                            ? {
                                  ...elementLayoutStyle(layout),
                                  position: "absolute",
                                  right: "auto",
                                  bottom: "auto",
                              }
                            : undefined
                    }
                    aria-hidden={
                        !editor && !content?.links?.decoration
                            ? true
                            : undefined
                    }
                    aria-label={editor ? `${decoration} shape` : undefined}
                    role={editor?.enabled ? "button" : undefined}
                    tabIndex={editor?.enabled ? 0 : undefined}
                    onClick={(event) => {
                        if (!editor?.enabled || sectionId == null) return;
                        event.stopPropagation();
                        if (editor.onSelectDecoration)
                            editor.onSelectDecoration(sectionId);
                        else editor.onSelectSection(sectionId);
                    }}
                />
            </ElementLink>
        ) : null;
    };
    const productsForSection = (featuredOnly = false) => {
        if (!featuredOnly) return products;
        const featured = products.filter((product: any) => product.is_featured);
        return featured.length ? featured : products;
    };
    const productGrid = (
        heading = "Featured products",
        description = "",
        sectionImage = "",
        imageAlt = "",
        colors: {
            eyebrow?: string;
            eyebrow_color?: string;
            eyebrow_font?: string;
            eyebrow_style?: TextStyle | null;
            heading_color?: string;
            body_color?: string;
            heading_font?: string;
            body_font?: string;
            heading_style?: TextStyle | null;
            body_style?: TextStyle | null;
            appearance?: SectionAppearance | null;
            image_style?: ImageAppearance | null;
            featured_only?: boolean;
        } & ElementDesignContent = {},
        sectionId?: number,
    ) => (
        <section
            className={`public-section public-products ${sectionAppearanceClassName(colors.appearance)} ${sectionEditorClass(sectionId)}`}
            {...sectionEditorProps(sectionId)}
            style={{
                ...sectionAppearanceStyle(colors.appearance),
                ...sectionElementStyle(colors),
            }}
        >
            {decorationFor(colors.appearance, sectionId, colors)}
            <DesignElements
                content={colors}
                sectionId={sectionId}
                editor={editor}
            />
            <WebsiteText
                editor={editor}
                sectionId={sectionId}
                field="eyebrow"
                as="p"
                className="eyebrow"
                animationStyle={colors.eyebrow_style}
                style={{
                    color: colors.eyebrow_color || undefined,
                    fontFamily: textFontStack(colors.eyebrow_font),
                    ...textStyleProperties(colors.eyebrow_style),
                }}
            >
                {colors.eyebrow || "Our store"}
            </WebsiteText>
            <WebsiteText
                editor={editor}
                sectionId={sectionId}
                field="heading"
                as="h1"
                animationStyle={colors.heading_style}
                style={{
                    color: colors.heading_color || undefined,
                    fontFamily: textFontStack(colors.heading_font),
                    ...textStyleProperties(colors.heading_style),
                }}
            >
                {heading}
            </WebsiteText>
            {(description || (editor && sectionId != null)) && (
                <WebsiteText
                    editor={editor}
                    sectionId={sectionId}
                    field="body"
                    as="p"
                    animationStyle={colors.body_style}
                    className="lead"
                    style={{
                        color: colors.body_color || undefined,
                        fontFamily: textFontStack(colors.body_font),
                        ...textStyleProperties(colors.body_style),
                    }}
                >
                    {description}
                </WebsiteText>
            )}
            {sectionImage && (
                <ElementImage
                    {...imageEditorProps(
                        sectionId,
                        undefined,
                        "public-section-image",
                    )}
                    style={imageAppearanceStyle(colors.image_style)}
                    src={sectionImage}
                    alt={imageAlt || heading}
                    loading="lazy"
                    decoding="async"
                />
            )}
            {productsForSection(Boolean(colors.featured_only)).length ? (
                <div className="store-product-grid">
                    {productsForSection(Boolean(colors.featured_only)).map((product: any) => (
                        <article key={product.id}>
                            <Link
                                className="store-product-image"
                                href={productUrl(product.slug)}
                            >
                                {product.image_path ? (
                                    <img
                                        src={`/storage/${product.image_path}`}
                                        alt={product.name}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <span>Product photo</span>
                                )}
                                {product.is_featured && <small>Featured</small>}
                            </Link>
                            <div className="store-product-body">
                                <h2>{product.name}</h2>
                                {product.description && (
                                    <p>{product.description}</p>
                                )}
                                <div className="store-product-price">
                                    {product.sale_price_minor != null && product.sale_price_minor < product.price_minor ? (
                                        <>
                                            <strong>
                                                {money(
                                                    product.sale_price_minor,
                                                )}
                                            </strong>
                                            <del>
                                                {money(product.price_minor)}
                                            </del>
                                        </>
                                    ) : (
                                        <strong>
                                            {money(product.price_minor)}
                                        </strong>
                                    )}
                                </div>
                                {product.stock_quantity > 0 ? (
                                    <Link
                                        className="button button-public"
                                        href={productUrl(product.slug)}
                                    >
                                        View & buy
                                    </Link>
                                ) : (
                                    <span className="sold-out">
                                        Out of stock
                                    </span>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="store-empty">
                    <h2>Products are coming soon</h2>
                    <p>Check back shortly for the latest collection.</p>
                </div>
            )}
        </section>
    );
    return (
        <div
            className={publicThemeClassName(
                theme,
                template,
                headerHeroImage ? "has-visual-hero" : "",
            )}
            style={style}
            data-website-editor={editor ? "true" : undefined}
            onClickCapture={(event) => {
                if (editor && (event.target as Element).closest("a, button"))
                    event.preventDefault();
            }}
            onSubmitCapture={(event) => {
                if (editor) event.preventDefault();
            }}
        >
            {!editor && (
                <Head title={page.seo_title || page.title}>
                    <meta
                        name="description"
                        content={page.seo_description || ""}
                    />
                </Head>
            )}
            {isPreview && !editor && (
                <DraftPreviewControls siteId={site.id} />
            )}
            {!editor && (
                <a className="public-skip-link" href="#main-content">
                    Skip to content
                </a>
            )}
            <header
                className={`public-header header-${theme?.header_layout || "split"}`}
            >
                <Link href={pageUrl("home")}>
                    {site.logo_path && (
                        <img src={`/storage/${site.logo_path}`} alt="" />
                    )}
                    {site.name}
                </Link>
                <nav aria-label="Primary navigation">
                    <ul>
                        {navigationItems.map((item) => (
                            <li key={`${item.label}:${item.href}`}>
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
                <div className="public-header-actions">
                    {site.type === "store" && (
                        <Link
                            className="public-shop-link"
                            href={shopUrl()}
                        >
                            Shop now
                        </Link>
                    )}
                    <a
                        className="button button-public"
                        href={
                            site.phone
                                ? `tel:${site.phone}`
                                : pageUrl("contact")
                        }
                    >
                        Contact us
                    </a>
                </div>
                <PublicMobileNavigation
                    items={navigationItems}
                    action={{
                        label: "Contact us",
                        href: site.phone
                            ? `tel:${site.phone}`
                            : pageUrl("contact"),
                    }}
                />
            </header>
            <main id={editor ? undefined : "main-content"} tabIndex={-1}>
                {page.sections.map((s: any, i: number) => (
                    <ElementDesignContext.Provider
                        key={s.key || s.id || i}
                        value={{ content: s.content, sectionId: s.id, editor }}
                    >
                        {s.type === "products" ? (
                            productGrid(
                                s.content.heading,
                                s.content.body,
                                s.content.image,
                                s.content.image_alt,
                                s.content,
                                s.id,
                            )
                        ) : s.type === "contact" ? (
                            <section
                                className={`public-section public-contact ${sectionAppearanceClassName(s.content.appearance)} ${sectionEditorClass(s.id)}`}
                                {...sectionEditorProps(s.id)}
                                key={s.key || i}
                                style={{
                                    ...sectionAppearanceStyle(
                                        s.content.appearance,
                                    ),
                                    ...sectionElementStyle(s.content),
                                }}
                            >
                                {decorationFor(
                                    s.content.appearance,
                                    s.id,
                                    s.content,
                                )}
                                <DesignElements
                                    content={s.content}
                                    sectionId={s.id}
                                    editor={editor}
                                />
                                <div className="public-contact-copy">
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="eyebrow"
                                        as="p"
                                        className="eyebrow"
                                        animationStyle={s.content.eyebrow_style}
                                        style={{
                                            color:
                                                s.content.eyebrow_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.eyebrow_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.eyebrow_style,
                                            ),
                                        }}
                                    >
                                        {s.content.eyebrow || "Contact"}
                                    </WebsiteText>
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="heading"
                                        as="h1"
                                        animationStyle={s.content.heading_style}
                                        style={{
                                            color:
                                                s.content.heading_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.heading_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.heading_style,
                                            ),
                                        }}
                                    >
                                        {s.content.heading}
                                    </WebsiteText>
                                    {(s.content.body ||
                                        (editor && "body" in s.content)) && (
                                        <WebsiteText
                                            editor={editor}
                                            sectionId={s.id}
                                            field="body"
                                            as="p"
                                            animationStyle={
                                                s.content.body_style
                                            }
                                            className="lead"
                                            style={{
                                                color:
                                                    s.content.body_color ||
                                                    undefined,
                                                fontFamily: textFontStack(
                                                    s.content.body_font,
                                                ),
                                                ...textStyleProperties(
                                                    s.content.body_style,
                                                ),
                                            }}
                                        >
                                            {s.content.body}
                                        </WebsiteText>
                                    )}
                                    {s.content.image && (
                                        <ElementImage
                                            {...imageEditorProps(
                                                s.id,
                                                undefined,
                                                "public-section-image",
                                            )}
                                            style={imageAppearanceStyle(
                                                s.content.image_style,
                                            )}
                                            src={s.content.image}
                                            alt={
                                                s.content.image_alt ||
                                                s.content.heading
                                            }
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    )}
                                </div>
                                <div className="public-contact-actions">
                                    {site.phone && (
                                        <a href={`tel:${site.phone}`}>
                                            <span>Call us</span>
                                            <strong>{site.phone}</strong>
                                        </a>
                                    )}
                                    {site.email && (
                                        <a href={`mailto:${site.email}`}>
                                            <span>Email us</span>
                                            <strong>{site.email}</strong>
                                        </a>
                                    )}
                                    {whatsappUrl && (
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <span>WhatsApp</span>
                                            <strong>Start a chat →</strong>
                                        </a>
                                    )}
                                    {site.business_hours?.display && (
                                        <div>
                                            <span>Business hours</span>
                                            <strong>
                                                {site.business_hours.display}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : s.type === "map" ? (
                            <section
                                className={`public-section public-map ${sectionAppearanceClassName(s.content.appearance)} ${sectionEditorClass(s.id)}`}
                                {...sectionEditorProps(s.id)}
                                key={s.key || i}
                                style={{
                                    ...sectionAppearanceStyle(
                                        s.content.appearance,
                                    ),
                                    ...sectionElementStyle(s.content),
                                }}
                            >
                                {decorationFor(
                                    s.content.appearance,
                                    s.id,
                                    s.content,
                                )}
                                <DesignElements
                                    content={s.content}
                                    sectionId={s.id}
                                    editor={editor}
                                />
                                <div>
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="eyebrow"
                                        as="p"
                                        className="eyebrow"
                                        animationStyle={s.content.eyebrow_style}
                                        style={{
                                            color:
                                                s.content.eyebrow_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.eyebrow_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.eyebrow_style,
                                            ),
                                        }}
                                    >
                                        {s.content.eyebrow || "Location"}
                                    </WebsiteText>
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="heading"
                                        as="h1"
                                        animationStyle={s.content.heading_style}
                                        style={{
                                            color:
                                                s.content.heading_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.heading_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.heading_style,
                                            ),
                                        }}
                                    >
                                        {s.content.heading}
                                    </WebsiteText>
                                    {(s.content.body ||
                                        (editor && "body" in s.content)) && (
                                        <WebsiteText
                                            editor={editor}
                                            sectionId={s.id}
                                            field="body"
                                            as="p"
                                            animationStyle={
                                                s.content.body_style
                                            }
                                            className="lead"
                                            style={{
                                                color:
                                                    s.content.body_color ||
                                                    undefined,
                                                fontFamily: textFontStack(
                                                    s.content.body_font,
                                                ),
                                                ...textStyleProperties(
                                                    s.content.body_style,
                                                ),
                                            }}
                                        >
                                            {s.content.body}
                                        </WebsiteText>
                                    )}
                                    {site.address &&
                                        site.address !== s.content.body && (
                                            <p className="public-map-address">
                                                {site.address}
                                            </p>
                                        )}
                                    {site.map_url && (
                                        <a
                                            className="button button-public"
                                            href={site.map_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Get directions →
                                        </a>
                                    )}
                                </div>
                                <div
                                    className={`public-map-card ${s.content.image ? "has-image" : ""} ${hasImageAppearance(s.content.image_style) ? "has-custom-image" : ""}`}
                                >
                                    {s.content.image ? (
                                        <ElementImage
                                            {...imageEditorProps(s.id)}
                                            src={s.content.image}
                                            style={imageAppearanceStyle(
                                                s.content.image_style,
                                            )}
                                            alt={
                                                s.content.image_alt ||
                                                `${site.name} location`
                                            }
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <>
                                            <span aria-hidden="true">⌖</span>
                                            <b>{site.name}</b>
                                            <small>
                                                {site.address ||
                                                    "Location available soon"}
                                            </small>
                                        </>
                                    )}
                                </div>
                            </section>
                        ) : (
                            <section
                                className={`public-section public-${s.type} ${s.type === "hero" && heroImageFor(s) ? "visual-hero has-design-hero-photo" : ""} ${sectionAppearanceClassName(s.content.appearance)} ${sectionEditorClass(s.id)}`}
                                {...sectionEditorProps(s.id)}
                                key={s.key || i}
                                style={{
                                    ...sectionAppearanceStyle(
                                        s.content.appearance,
                                    ),
                                    ...sectionElementStyle(s.content),
                                    ...(s.type === "hero" && heroImageFor(s)
                                        ? {
                                              // Keep the cover photo's theme overlay above a custom background.
                                              backgroundImage: undefined,
                                              ...heroImageStyle(
                                                  heroImageFor(s),
                                                  s.content.image_style,
                                              ),
                                              "--hero-image": "none",
                                          }
                                        : {}),
                                }}
                            >
                                {decorationFor(
                                    s.content.appearance,
                                    s.id,
                                    s.content,
                                )}
                                <DesignElements
                                    content={s.content}
                                    sectionId={s.id}
                                    editor={editor}
                                />
                                {s.type === "hero" && heroImageFor(s) && (
                                    <ElementImage
                                        {...imageEditorProps(
                                            s.id,
                                            undefined,
                                            "design-hero-photo",
                                        )}
                                        src={heroImageFor(s)}
                                        alt={s.content.image_alt || ""}
                                        style={{
                                            objectFit:
                                                s.content.image_style?.fit ||
                                                "cover",
                                            objectPosition:
                                                s.content.image_style
                                                    ?.position || "center",
                                            ...imageAppearanceStyle(
                                                s.content.image_style,
                                            ),
                                            position: "absolute",
                                            height: "100%",
                                            zIndex: 0,
                                        }}
                                        draggable={false}
                                    />
                                )}
                                {s.type === "hero" && heroImageFor(s) && (
                                    <span
                                        className="design-hero-overlay"
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            zIndex: 1,
                                            pointerEvents: "none",
                                            backgroundImage: "inherit",
                                        }}
                                    />
                                )}
                                {(s.content.eyebrow ||
                                    (editor && "eyebrow" in s.content)) && (
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="eyebrow"
                                        as="p"
                                        animationStyle={s.content.eyebrow_style}
                                        className="eyebrow"
                                        style={{
                                            color:
                                                s.content.eyebrow_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.eyebrow_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.eyebrow_style,
                                            ),
                                        }}
                                    >
                                        {s.content.eyebrow}
                                    </WebsiteText>
                                )}
                                <WebsiteText
                                    editor={editor}
                                    sectionId={s.id}
                                    field="heading"
                                    as="h1"
                                    animationStyle={s.content.heading_style}
                                    style={{
                                        color:
                                            s.content.heading_color ||
                                            undefined,
                                        fontFamily: textFontStack(
                                            s.content.heading_font,
                                        ),
                                        ...textStyleProperties(
                                            s.content.heading_style,
                                        ),
                                    }}
                                >
                                    {s.content.heading}
                                </WebsiteText>
                                {(s.content.body ||
                                    (editor && "body" in s.content)) && (
                                    <WebsiteText
                                        editor={editor}
                                        sectionId={s.id}
                                        field="body"
                                        as="p"
                                        animationStyle={s.content.body_style}
                                        className="lead"
                                        style={{
                                            color:
                                                s.content.body_color ||
                                                undefined,
                                            fontFamily: textFontStack(
                                                s.content.body_font,
                                            ),
                                            ...textStyleProperties(
                                                s.content.body_style,
                                            ),
                                        }}
                                    >
                                        {s.content.body}
                                    </WebsiteText>
                                )}
                                {s.type !== "hero" && s.content.image && (
                                    <ElementImage
                                        {...imageEditorProps(
                                            s.id,
                                            undefined,
                                            "public-section-image",
                                        )}
                                        style={imageAppearanceStyle(
                                            s.content.image_style,
                                        )}
                                        src={s.content.image}
                                        alt={
                                            s.content.image_alt ||
                                            s.content.heading
                                        }
                                        loading="lazy"
                                        decoding="async"
                                    />
                                )}
                                {s.content.items && (
                                    <div className="public-feature-grid">
                                        {s.content.items.map(
                                            (x: any, j: number) => (
                                                <article key={j}>
                                                    {x.image && (
                                                        <ElementImage
                                                            {...imageEditorProps(
                                                                s.id,
                                                                j,
                                                                hasImageAppearance(
                                                                    x.image_style,
                                                                )
                                                                    ? "public-item-photo"
                                                                    : "public-item-image design-item-photo",
                                                            )}
                                                            src={x.image}
                                                            alt={
                                                                x.image_alt ||
                                                                x.title
                                                            }
                                                            style={{
                                                                ...imageAppearanceStyle(
                                                                    x.image_style,
                                                                ),
                                                                ...(!hasImageAppearance(
                                                                    x.image_style,
                                                                )
                                                                    ? {
                                                                          height: "100%",
                                                                      }
                                                                    : {}),
                                                            }}
                                                            loading="lazy"
                                                            decoding="async"
                                                            draggable={false}
                                                        />
                                                    )}
                                                    {x.image &&
                                                        !hasImageAppearance(
                                                            x.image_style,
                                                        ) && (
                                                            <span
                                                                className="design-item-overlay"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    <span>0{j + 1}</span>
                                                    <WebsiteText
                                                        editor={editor}
                                                        sectionId={s.id}
                                                        field="title"
                                                        itemIndex={j}
                                                        as="h2"
                                                        animationStyle={
                                                            x.title_style
                                                        }
                                                        style={{
                                                            color:
                                                                x.title_color ||
                                                                undefined,
                                                            fontFamily:
                                                                textFontStack(
                                                                    x.title_font,
                                                                ),
                                                            ...textStyleProperties(
                                                                x.title_style,
                                                            ),
                                                        }}
                                                    >
                                                        {x.title}
                                                    </WebsiteText>
                                                    <WebsiteText
                                                        editor={editor}
                                                        sectionId={s.id}
                                                        field="description"
                                                        itemIndex={j}
                                                        as="p"
                                                        animationStyle={
                                                            x.description_style
                                                        }
                                                        style={{
                                                            color:
                                                                x.description_color ||
                                                                undefined,
                                                            fontFamily:
                                                                textFontStack(
                                                                    x.description_font,
                                                                ),
                                                            ...textStyleProperties(
                                                                x.description_style,
                                                            ),
                                                        }}
                                                    >
                                                        {x.body}
                                                    </WebsiteText>
                                                </article>
                                            ),
                                        )}
                                    </div>
                                )}
                                {(s.content.primary_action ||
                                    (editor &&
                                        "primary_action" in s.content)) && (
                                    <div className="public-hero-actions">
                                        <a
                                            className="button button-public design-existing-element"
                                            data-design-key="primary_action"
                                            data-design-kind="button"
                                            data-design-layout={
                                                s.content.element_layouts
                                                    ?.primary_action
                                                    ? "true"
                                                    : undefined
                                            }
                                            style={elementLayoutStyle(
                                                s.content.element_layouts
                                                    ?.primary_action,
                                            )}
                                            href={
                                                safeHref(
                                                    s.content.links
                                                        ?.primary_action,
                                                ) ||
                                                (site.type === "store"
                                                    ? shopUrl()
                                                    : pageUrl("contact"))
                                            }
                                        >
                                            <WebsiteText
                                                as="span"
                                                editor={editor}
                                                sectionId={s.id}
                                                field="primary_action"
                                                animationStyle={
                                                    s.content
                                                        .primary_action_style
                                                }
                                                style={{
                                                    color:
                                                        s.content
                                                            .primary_action_color ||
                                                        undefined,
                                                    fontFamily: textFontStack(
                                                        s.content
                                                            .primary_action_font,
                                                    ),
                                                    ...textStyleProperties(
                                                        s.content
                                                            .primary_action_style,
                                                    ),
                                                }}
                                            >
                                                {s.content.primary_action || ""}
                                            </WebsiteText>{" "}
                                            →
                                        </a>
                                        {(s.content.secondary_action ||
                                            (editor &&
                                                "secondary_action" in
                                                    s.content)) && (
                                            <a
                                                className="button public-secondary-button design-existing-element"
                                                data-design-key="secondary_action"
                                                data-design-kind="button"
                                                data-design-layout={
                                                    s.content.element_layouts
                                                        ?.secondary_action
                                                        ? "true"
                                                        : undefined
                                                }
                                                style={elementLayoutStyle(
                                                    s.content.element_layouts
                                                        ?.secondary_action,
                                                )}
                                                href={
                                                    safeHref(
                                                        s.content.links
                                                            ?.secondary_action,
                                                    ) || pageUrl("contact")
                                                }
                                            >
                                                <WebsiteText
                                                    as="span"
                                                    editor={editor}
                                                    sectionId={s.id}
                                                    field="secondary_action"
                                                    animationStyle={
                                                        s.content
                                                            .secondary_action_style
                                                    }
                                                    style={{
                                                        color:
                                                            s.content
                                                                .secondary_action_color ||
                                                            undefined,
                                                        fontFamily:
                                                            textFontStack(
                                                                s.content
                                                                    .secondary_action_font,
                                                            ),
                                                        ...textStyleProperties(
                                                            s.content
                                                                .secondary_action_style,
                                                        ),
                                                    }}
                                                >
                                                    {s.content
                                                        .secondary_action || ""}
                                                </WebsiteText>
                                            </a>
                                        )}
                                    </div>
                                )}
                                {s.type === "cta" &&
                                    (s.content.action ||
                                        (editor && "action" in s.content)) && (
                                        <div className="public-hero-actions">
                                            <a
                                                className="button button-public design-existing-element"
                                                data-design-key="action"
                                                data-design-kind="button"
                                                data-design-layout={
                                                    s.content.element_layouts
                                                        ?.action
                                                        ? "true"
                                                        : undefined
                                                }
                                                style={elementLayoutStyle(
                                                    s.content.element_layouts
                                                        ?.action,
                                                )}
                                                href={
                                                    safeHref(
                                                        s.content.links?.action,
                                                    ) ||
                                                    (site.type === "store"
                                                        ? shopUrl()
                                                        : pageUrl("contact"))
                                                }
                                            >
                                                <WebsiteText
                                                    as="span"
                                                    editor={editor}
                                                    sectionId={s.id}
                                                    field="action"
                                                    animationStyle={
                                                        s.content.action_style
                                                    }
                                                    style={{
                                                        color:
                                                            s.content
                                                                .action_color ||
                                                            undefined,
                                                        fontFamily:
                                                            textFontStack(
                                                                s.content
                                                                    .action_font,
                                                            ),
                                                        ...textStyleProperties(
                                                            s.content
                                                                .action_style,
                                                        ),
                                                    }}
                                                >
                                                    {s.content.action || ""}
                                                </WebsiteText>{" "}
                                                →
                                            </a>
                                        </div>
                                    )}
                            </section>
                        )}
                    </ElementDesignContext.Provider>
                ))}
                {site.type === "store" &&
                    page.slug === "home" &&
                    !page.sections.some((s: any) => s.type === "products") &&
                    productGrid()}
            </main>
            <footer className={`footer-${theme?.footer_layout || "columns"}`}>
                <b>{site.name}</b>
                <p>
                    {site.address || "Proudly serving our community in Nepal."}
                </p>
                <p>
                    {[site.phone, site.email, site.business_hours?.display]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                <small>
                    © {new Date().getFullYear()} {site.name}
                </small>
            </footer>
        </div>
    );
}
