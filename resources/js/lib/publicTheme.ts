import { readableSurfaceColor, readableTextColor } from "@/lib/themeContrast";
import type { CSSProperties } from "react";

type ThemeSettings = Record<string, any>;

const FONT_STACKS: Record<string, string> = {
    Manrope:
        '"Manrope", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    Inter: '"Inter", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    Poppins:
        '"Poppins", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    "DM Sans":
        '"DM Sans", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    Figtree:
        '"Figtree", "Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    "Playfair Display":
        '"Playfair Display", "Noto Serif Devanagari", Georgia, serif',
    Lora: '"Lora", "Noto Serif Devanagari", Georgia, serif',
    "Noto Sans Devanagari":
        '"Noto Sans Devanagari", ui-sans-serif, system-ui, sans-serif',
    "Noto Serif Devanagari": '"Noto Serif Devanagari", Georgia, serif',
    Montserrat: '"Montserrat", "Noto Sans Devanagari", sans-serif',
    Nunito: '"Nunito", "Noto Sans Devanagari", sans-serif',
    Merriweather: '"Merriweather", "Noto Serif Devanagari", Georgia, serif',
    "Bebas Neue": '"Bebas Neue", "Noto Sans Devanagari", sans-serif',
    "Dancing Script": '"Dancing Script", "Noto Sans Devanagari", cursive',
    Caveat: '"Caveat", "Noto Sans Devanagari", cursive',
    Arial: 'Arial, "Noto Sans Devanagari", sans-serif',
    Verdana: 'Verdana, "Noto Sans Devanagari", sans-serif',
    Tahoma: 'Tahoma, "Noto Sans Devanagari", sans-serif',
    "Trebuchet MS": '"Trebuchet MS", "Noto Sans Devanagari", sans-serif',
    Georgia: 'Georgia, "Noto Serif Devanagari", serif',
    "Times New Roman": '"Times New Roman", "Noto Serif Devanagari", serif',
    "Courier New": '"Courier New", "Noto Sans Devanagari", monospace',
    "System Sans": 'system-ui, "Noto Sans Devanagari", sans-serif',
    "System Serif": 'ui-serif, Georgia, "Noto Serif Devanagari", serif',
    "System Mono":
        'ui-monospace, "Courier New", "Noto Sans Devanagari", monospace',
};

export const TEXT_FONTS = Object.keys(FONT_STACKS);

export function textFontStack(font?: string | null): string | undefined {
    return font ? FONT_STACKS[font] : undefined;
}

export type TextStyle = Partial<
    Record<
        "bold" | "italic" | "underline" | "strikethrough" | "uppercase",
        boolean | 0 | 1 | "0" | "1"
    >
> & {
    size?: number;
    line_height?: number;
    letter_spacing?: number;
    align?: "left" | "center" | "right" | "justify";
    weight?: 300 | 400 | 500 | 600 | 700 | 800 | 900;
    animation?: "none" | "fade" | "rise" | "slide" | "zoom" | "blur";
    animation_duration?: number;
    animation_delay?: number;
};

export function textStyleProperties(style?: TextStyle | null): CSSProperties {
    const enabled = (value: unknown) =>
        value === true || value === 1 || value === "1";
    const numeric = (value: unknown, min: number, max: number) => {
        if (
            value == null ||
            value === "" ||
            (typeof value !== "number" && typeof value !== "string")
        )
            return undefined;
        const number = Number(value);
        return Number.isFinite(number) && number >= min && number <= max
            ? number
            : undefined;
    };
    const size = numeric(style?.size, 10, 120);
    const spacing = numeric(style?.letter_spacing, -2, 12);
    const weight = numeric(style?.weight, 300, 900);
    const decorations = [
        enabled(style?.underline) && "underline",
        enabled(style?.strikethrough) && "line-through",
    ]
        .filter(Boolean)
        .join(" ");
    return {
        fontWeight:
            weight != null && weight % 100 === 0
                ? weight
                : style?.bold == null
                  ? undefined
                  : enabled(style.bold)
                    ? 700
                    : 400,
        fontStyle:
            style?.italic == null
                ? undefined
                : enabled(style.italic)
                  ? "italic"
                  : "normal",
        textDecoration:
            style?.underline == null && style?.strikethrough == null
                ? undefined
                : decorations || "none",
        textTransform:
            style?.uppercase == null
                ? undefined
                : enabled(style.uppercase)
                  ? "uppercase"
                  : "none",
        fontSize: size != null ? `${size}px` : undefined,
        lineHeight: numeric(style?.line_height, 0.8, 2.5),
        letterSpacing: spacing != null ? `${spacing}px` : undefined,
        textAlign:
            style?.align &&
            ["left", "center", "right", "justify"].includes(style.align)
                ? style.align
                : undefined,
    };
}

export function compositionDefaultsFor(templateSlug: string) {
    const variants: Record<string, Record<string, string>> = {
        "patra-editorial": {
            content_width: "narrow",
            hero_alignment: "left",
            card_style: "bordered",
            heading_scale: "display",
            motion: "none",
            image_shape: "square",
            divider_style: "strong",
        },
        "drishti-photography": {
            content_width: "wide",
            hero_alignment: "left",
            card_style: "flat",
            heading_scale: "display",
            hero_height: "screen",
            motion: "none",
            image_shape: "square",
            divider_style: "none",
        },
        "prakriti-wellness": {
            content_width: "narrow",
            card_style: "flat",
            image_shape: "rounded",
            divider_style: "none",
        },
        "chiya-cafe": {
            hero_alignment: "left",
            card_style: "bordered",
            heading_scale: "display",
            header_style: "contrast",
        },
        "orbit-digital": {
            content_width: "wide",
            heading_scale: "display",
            hero_height: "screen",
            header_style: "glass",
        },
        "doko-essentials": {
            content_width: "wide",
            hero_alignment: "left",
            card_style: "flat",
            hero_height: "compact",
            motion: "none",
            image_shape: "square",
        },
    };
    return {
        content_width: "standard",
        hero_alignment: [
            "summit-studio",
            "aangan-kitchen",
            "sajha-impact",
        ].includes(templateSlug)
            ? "left"
            : "center",
        card_style: ["summit-studio", "nyaya-professional"].includes(
            templateSlug,
        )
            ? "bordered"
            : "elevated",
        heading_scale: [
            "thamel-bold",
            "summit-studio",
            "kanti-beauty",
        ].includes(templateSlug)
            ? "display"
            : "balanced",
        hero_height: ["everest-commerce", "naya-tech", "sajha-impact"].includes(
            templateSlug,
        )
            ? "screen"
            : "standard",
        header_style:
            templateSlug === "naya-tech"
                ? "glass"
                : templateSlug === "sajha-impact"
                  ? "contrast"
                  : "solid",
        motion: ["thamel-bold", "naya-tech"].includes(templateSlug)
            ? "expressive"
            : "subtle",
        image_shape: ["summit-studio", "nyaya-professional"].includes(
            templateSlug,
        )
            ? "square"
            : ["kanti-beauty", "himalayan-calm"].includes(templateSlug)
              ? "rounded"
              : "soft",
        divider_style: ["summit-studio", "nyaya-professional"].includes(
            templateSlug,
        )
            ? "strong"
            : "subtle",
        ...variants[templateSlug],
    };
}

export function normalizedTheme(
    theme: ThemeSettings = {},
    template?: string,
): ThemeSettings {
    const templateSlug = template || theme.template_slug || "sajilo-launch";

    return {
        ...compositionDefaultsFor(templateSlug),
        ...theme,
        template_slug: templateSlug,
    };
}

export function themeClassName(
    theme: ThemeSettings = {},
    template?: string,
    base = "public-site",
    extra = "",
): string {
    const settings = normalizedTheme(theme, template);

    return [
        base,
        `template-${settings.template_slug}`,
        `spacing-${settings.section_spacing || "generous"}`,
        `buttons-${settings.button_style || "solid"}`,
        `width-${settings.content_width}`,
        `hero-${settings.hero_alignment}`,
        `cards-${settings.card_style}`,
        `headings-${settings.heading_scale}`,
        `hero-height-${settings.hero_height}`,
        `header-surface-${settings.header_style}`,
        `header-layout-${settings.header_layout || "split"}`,
        `motion-${settings.motion}`,
        `images-${settings.image_shape}`,
        `dividers-${settings.divider_style}`,
        extra,
    ]
        .filter(Boolean)
        .join(" ");
}

export function publicThemeClassName(
    theme: ThemeSettings = {},
    template?: string,
    extra = "",
): string {
    return themeClassName(theme, template, "public-site", extra);
}

export function publicThemeStyle(theme: ThemeSettings = {}): CSSProperties {
    const primary = theme.primary || "#0f766e";
    const secondary = theme.secondary || "#134e4a";
    const accent = theme.accent || "#f59e0b";
    const background = theme.background || "#fffdf7";
    const text = theme.text || "#17201e";

    return {
        "--primary": primary,
        "--secondary": secondary,
        "--accent": accent,
        "--bg": background,
        "--text": text,
        "--on-primary": readableTextColor(primary),
        "--on-secondary": readableTextColor(secondary),
        "--on-accent": readableTextColor(accent),
        "--surface": readableSurfaceColor(background, text, 0.04),
        "--surface-muted": readableSurfaceColor(background, text, 0.09),
        "--store-surface": readableSurfaceColor(background, text, 0.04),
        "--store-surface-muted": readableSurfaceColor(background, text, 0.09),
        "--radius": theme.radius || "16px",
        "--heading-font":
            FONT_STACKS[theme.heading_font] || FONT_STACKS.Manrope,
        "--body-font": FONT_STACKS[theme.body_font] || FONT_STACKS.Inter,
    } as CSSProperties;
}

export function canvasThemeStyle(theme: ThemeSettings): CSSProperties {
    const publicStyle = publicThemeStyle(theme) as Record<string, string>;

    return {
        "--site-primary": publicStyle["--primary"],
        "--site-secondary": publicStyle["--secondary"],
        "--site-accent": publicStyle["--accent"],
        "--site-bg": publicStyle["--bg"],
        "--site-text": publicStyle["--text"],
        "--site-on-primary": publicStyle["--on-primary"],
        "--site-on-secondary": publicStyle["--on-secondary"],
        "--site-on-accent": publicStyle["--on-accent"],
        "--site-surface": publicStyle["--surface"],
        "--site-surface-muted": publicStyle["--surface-muted"],
        "--site-radius": publicStyle["--radius"],
        "--site-heading-font": publicStyle["--heading-font"],
        "--site-body-font": publicStyle["--body-font"],
    } as CSSProperties;
}
