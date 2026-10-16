import { createContext, type CSSProperties } from "react";
import type { WebsiteEditor } from "@/Components/WebsiteText";
import type { TextStyle } from "@/lib/publicTheme";
import "../../css/element-design.css";

export type ElementLayout = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    layer?: number;
    hidden?: boolean | 0 | 1 | "0" | "1";
};

export type DesignElement = {
    id: string;
    type: "text" | "image" | "shape" | "button";
    text?: string;
    image?: string;
    image_alt?: string;
    font?: string;
    color?: string;
    text_style?: TextStyle;
    shape?:
        | "rectangle"
        | "rounded"
        | "circle"
        | "triangle"
        | "star"
        | "diamond"
        | "line"
        | "arch";
    fill?: string;
    border_color?: string;
    border_width?: number;
    radius?: number;
    href?: string;
    new_tab?: boolean;
    layout?: ElementLayout;
};

export type ElementDesignContent = {
    links?: Record<string, string | null>;
    element_layouts?: Record<string, ElementLayout | null>;
    elements?: DesignElement[];
    appearance?: { min_height?: number | null };
};

export const ElementDesignContext = createContext<{
    content: ElementDesignContent;
    sectionId?: number;
    editor?: WebsiteEditor;
}>({ content: {} });

/** Only navigation schemes supported by the content contract reach an anchor. */
export function safeHref(value?: string | null): string | undefined {
    if (typeof value !== "string") return undefined;
    const href = value.trim();
    if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return undefined;
    if (href.startsWith("#")) return href;
    if (href.startsWith("/") && !href.startsWith("//")) return href;
    if (/^https?:\/\//i.test(href)) {
        try {
            const url = new URL(href);
            return ["http:", "https:"].includes(url.protocol) && url.hostname
                ? href
                : undefined;
        } catch {
            return undefined;
        }
    }
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href)) return `mailto:${href}`;
    return /^(mailto|tel):[^\s]+$/i.test(href) ? href : undefined;
}

export function safeImageSource(
    value?: string | null,
    editor = false,
): string | undefined {
    if (typeof value !== "string") return undefined;
    if (editor && value.startsWith("blob:")) return value;
    const source = safeHref(value);
    return source && (/^https?:\/\//i.test(source) || source.startsWith("/"))
        ? source
        : undefined;
}

export function designKey(field: string, itemIndex?: number): string {
    return itemIndex == null ? field : `item_${itemIndex}_${field}`;
}

function number(value: unknown, min: number, max: number): number | undefined {
    if (value == null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed)
        ? Math.max(min, Math.min(max, parsed))
        : undefined;
}

export function elementLayoutStyle(
    layout?: ElementLayout | null,
    mode: "relative" | "absolute" = "relative",
): CSSProperties {
    if (!layout || !Object.values(layout).some((value) => value != null))
        return {};
    const width = number(layout.width, 2, 100);
    const height = number(layout.height, 16, 1200);
    const x = number(layout.x, mode === "absolute" ? 0 : -100, 100);
    const y = number(
        layout.y,
        mode === "absolute" ? 0 : -1000,
        mode === "absolute" ? 100 : 1000,
    );
    const rotation = number(layout.rotation, -180, 180);
    const hidden =
        layout.hidden === true || layout.hidden === 1 || layout.hidden === "1";
    const hasGeometry = [x, y, width, height, rotation, layout.layer].some(
        (value) => value != null,
    );
    if (!hasGeometry) return hidden ? { display: "none" } : {};
    return {
        ...(hidden ? { display: "none" } : {}),
        position: mode,
        ...(x != null
            ? {
                  left: `${mode === "absolute" ? Math.min(x, 100 - (width ?? 30)) : x}%`,
              }
            : {}),
        ...(y != null
            ? {
                  top:
                      mode === "absolute"
                          ? `clamp(0px, ${y}%, calc(100% - min(${height ?? 120}px, 100%)))`
                          : `${y}px`,
              }
            : {}),
        ...(width != null ? { width: `${width}%`, maxWidth: "100%" } : {}),
        ...(height != null
            ? { height, maxHeight: "none", "--design-height": `${height}px` }
            : {}),
        minWidth: 0,
        ...(rotation != null ? { transform: `rotate(${rotation}deg)` } : {}),
        ...(layout.layer != null
            ? { zIndex: number(layout.layer, 0, 30) }
            : {}),
    } as CSSProperties;
}

export function sectionElementStyle(
    content?: ElementDesignContent | null,
): CSSProperties {
    const minimum = number(content?.appearance?.min_height, 240, 1600);
    const hasElements = !!content?.elements?.length;
    return {
        position: hasElements ? "relative" : undefined,
        isolation: hasElements ? "isolate" : undefined,
        minHeight: minimum ?? (hasElements ? 400 : undefined),
    };
}

export function designColor(value?: string | null): string | undefined {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
        ? value
        : undefined;
}
