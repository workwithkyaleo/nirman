import type { CSSProperties } from "react";
import "../../css/section-appearance.css";

export type SectionAppearance = {
    min_height?: number | null;
    background_color?: string | null;
    border_color?: string | null;
    border_width?: number | null;
    radius?: number | null;
    spacing?: "compact" | "comfortable" | "spacious" | null;
    alignment?: "left" | "center" | "right" | null;
    decoration?: "none" | "circle" | "arch" | "diagonal" | null;
    decoration_color?: string | null;
};

export type ImageAppearance = {
    shape?: "rectangle" | "rounded" | "circle" | "arch" | "diamond" | null;
    aspect_ratio?: "auto" | "landscape" | "square" | "portrait" | "wide" | null;
    fit?: "cover" | "contain" | null;
    position?: "center" | "top" | "bottom" | "left" | "right" | null;
    border_color?: string | null;
    border_width?: number | null;
    shadow?: "none" | "soft" | "strong" | null;
    opacity?: number | null;
};

const color = (value?: string | null) =>
    value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
const bounded = (value: unknown, maximum: number, minimum = 0) => {
    if (value == null || value === "") return undefined;
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= minimum && numeric <= maximum
        ? numeric
        : undefined;
};

export function sectionAppearanceStyle(
    appearance?: SectionAppearance | null,
): CSSProperties {
    const spacing = { compact: 40, comfortable: 72, spacious: 112 };
    const padding = appearance?.spacing && spacing[appearance.spacing];
    const border = bounded(appearance?.border_width, 8);
    const radius = bounded(appearance?.radius, 64);
    return {
        minHeight: bounded(appearance?.min_height, 1600, 240),
        backgroundColor: color(appearance?.background_color),
        // Replace a template gradient only when a custom background is chosen.
        backgroundImage: color(appearance?.background_color)
            ? "none"
            : undefined,
        borderColor: color(appearance?.border_color),
        borderWidth: border,
        borderStyle: border ? "solid" : undefined,
        borderRadius: radius,
        paddingBlock: padding ? `clamp(32px, 7vw, ${padding}px)` : undefined,
        textAlign: ["left", "center", "right"].includes(
            appearance?.alignment || "",
        )
            ? appearance?.alignment || undefined
            : undefined,
        "--section-decoration-color": color(appearance?.decoration_color),
    } as CSSProperties;
}

export function sectionAppearanceClassName(
    appearance?: SectionAppearance | null,
): string {
    return [
        "section-appearance",
        ["left", "center", "right"].includes(appearance?.alignment || "")
            ? `section-align-${appearance?.alignment}`
            : "",
        sectionDecoration(appearance) ? "has-section-decoration" : "",
    ]
        .filter(Boolean)
        .join(" ");
}

export function sectionDecoration(appearance?: SectionAppearance | null) {
    return ["circle", "arch", "diagonal"].includes(appearance?.decoration || "")
        ? appearance?.decoration
        : null;
}

export function hasImageAppearance(style?: ImageAppearance | null) {
    return !!style && Object.values(style).some((value) => value != null);
}

export function imageAppearanceStyle(
    style?: ImageAppearance | null,
): CSSProperties {
    const ratios = {
        auto: "auto",
        landscape: "4 / 3",
        square: "1 / 1",
        portrait: "3 / 4",
        wide: "16 / 9",
    };
    const radius = {
        rectangle: "0px",
        rounded: "28px",
        circle: "50%",
        arch: "50% 50% 0 0",
        diamond: "0px",
    };
    const shadows = {
        none: "none",
        soft: "0 12px 28px rgb(15 23 42 / 14%)",
        strong: "0 24px 56px rgb(15 23 42 / 30%)",
    };
    const border = bounded(style?.border_width, 8);
    const opacity = bounded(style?.opacity, 100, 20);
    const shapedRatio = ["circle", "diamond"].includes(style?.shape || "");
    const ratio = shapedRatio
        ? "1 / 1"
        : style?.aspect_ratio && ratios[style.aspect_ratio];
    return {
        borderRadius: style?.shape ? radius[style.shape] : undefined,
        clipPath:
            style?.shape === "diamond"
                ? "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"
                : undefined,
        aspectRatio: ratio || undefined,
        height: ratio ? "auto" : undefined,
        maxHeight: ratio && ratio !== "auto" ? "none" : undefined,
        objectFit: ["cover", "contain"].includes(style?.fit || "")
            ? style?.fit || undefined
            : undefined,
        objectPosition: ["center", "top", "bottom", "left", "right"].includes(
            style?.position || "",
        )
            ? style?.position || undefined
            : undefined,
        borderColor: color(style?.border_color),
        borderWidth: border,
        borderStyle: border ? "solid" : undefined,
        boxShadow: style?.shadow ? shadows[style.shadow] : undefined,
        opacity: opacity != null ? opacity / 100 : undefined,
    };
}

export function heroImageStyle(
    image?: string | null,
    style?: ImageAppearance | null,
): CSSProperties {
    if (!image) return {};
    const dimming = 100 - (bounded(style?.opacity, 100, 20) ?? 100);
    const safeImage = image.replace(/["\\\n\r]/g, (character) =>
        character === "\n" || character === "\r" ? "" : `\\${character}`,
    );
    return {
        "--hero-image": `${dimming ? `linear-gradient(rgb(0 0 0 / ${dimming}%), rgb(0 0 0 / ${dimming}%)), ` : ""}url("${safeImage}")`,
        backgroundPosition: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
        ].includes(style?.position || "")
            ? style?.position
            : undefined,
        backgroundSize: ["cover", "contain"].includes(style?.fit || "")
            ? style?.fit
            : undefined,
        backgroundRepeat: "no-repeat",
    } as CSSProperties;
}
