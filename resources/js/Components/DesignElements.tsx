import {
    useContext,
    type ImgHTMLAttributes,
    type KeyboardEvent,
    type MouseEvent,
} from "react";
import AnimatedText from "@/Components/AnimatedText";
import CanvasText from "@/Components/CanvasText";
import ElementLink from "@/Components/ElementLink";
import type { WebsiteEditor } from "@/Components/WebsiteText";
import {
    ElementDesignContext,
    designColor,
    elementLayoutStyle,
    safeImageSource,
    type DesignElement,
    type ElementDesignContent,
} from "@/lib/elementDesign";
import { textFontStack, textStyleProperties } from "@/lib/publicTheme";
import { readableTextColor } from "@/lib/themeContrast";

export function ElementImage({
    designKey = "image",
    style,
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement> & { designKey?: string }) {
    const { content, editor } = useContext(ElementDesignContext);
    const layout = content.element_layouts?.[designKey];
    return (
        <ElementLink
            href={content.links?.[designKey]}
            editor={!!editor}
            className="design-linked-image"
        >
            <img
                {...props}
                className={`${className || ""} design-existing-element`}
                data-design-key={designKey}
                data-design-kind="image"
                data-design-layout={layout ? "true" : undefined}
                style={{
                    ...style,
                    ...elementLayoutStyle(layout),
                    ...(className?.includes("design-hero-photo") && layout
                        ? { position: "absolute" }
                        : {}),
                }}
            />
        </ElementLink>
    );
}

export default function DesignElements({
    content,
    sectionId,
    editor,
}: {
    content: ElementDesignContent;
    sectionId?: number;
    editor?: WebsiteEditor;
}) {
    if (!Array.isArray(content.elements)) return null;
    return (
        <>
            {content.elements.slice(0, 30).map((element) => {
                if (
                    !element ||
                    !/^[a-zA-Z0-9_-]{1,64}$/.test(element.id || "") ||
                    !["text", "image", "shape", "button"].includes(element.type)
                )
                    return null;
                return (
                    <DesignElementView
                        key={element.id}
                        element={element}
                        sectionId={sectionId}
                        editor={editor}
                    />
                );
            })}
        </>
    );
}

function DesignElementView({
    element,
    sectionId,
    editor,
}: {
    element: DesignElement;
    sectionId?: number;
    editor?: WebsiteEditor;
}) {
    const selected =
        !!editor &&
        editor.selectedSectionId === sectionId &&
        editor.selectedElementId === element.id;
    const select = (event?: MouseEvent<HTMLElement>) => {
        if (!editor?.enabled || sectionId == null) return;
        event?.stopPropagation();
        editor.onSelectElement?.(sectionId, element.id);
    };
    const keySelect = (event: KeyboardEvent<HTMLElement>) => {
        if (!editor?.enabled || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (sectionId != null) editor.onSelectElement?.(sectionId, element.id);
    };
    const shape = [
        "rectangle",
        "rounded",
        "circle",
        "triangle",
        "star",
        "diamond",
        "line",
        "arch",
    ].includes(element.shape || "")
        ? element.shape
        : "rectangle";
    const layout = elementLayoutStyle(
        {
            x: 10,
            y: 10,
            width: 30,
            height: element.type === "button" ? 48 : 120,
            layer: 5,
            ...element.layout,
        },
        "absolute",
    );
    const borderWidth = Number(element.border_width);
    const radius = Number(element.radius);
    const style = {
        ...textStyleProperties(element.text_style),
        fontFamily: textFontStack(element.font),
        color:
            designColor(element.color) ||
            (element.type === "button"
                ? designColor(element.fill)
                    ? readableTextColor(element.fill!)
                    : "var(--on-primary)"
                : undefined),
        backgroundColor:
            element.type === "shape" || element.type === "button"
                ? designColor(element.fill) || "var(--primary)"
                : undefined,
        borderColor: designColor(element.border_color),
        borderWidth: Number.isFinite(borderWidth)
            ? Math.max(0, Math.min(16, borderWidth))
            : undefined,
        borderStyle: borderWidth > 0 ? "solid" : undefined,
        borderRadius:
            shape === "circle" &&
            (element.type === "shape" || element.type === "image")
                ? "50%"
                : shape === "arch" &&
                    (element.type === "shape" || element.type === "image")
                  ? "50% 50% 0 0"
                  : shape === "rounded" && !radius
                    ? 18
                    : element.radius != null && Number.isFinite(radius)
                      ? Math.max(0, Math.min(100, radius))
                      : undefined,
        ...layout,
        ...(element.type === "text" || element.type === "button"
            ? {
                  width: `max(${Math.max(2, Math.min(100, element.layout?.width ?? 30))}%, min(140px, 100%))`,
                  left: `clamp(0px, ${Math.max(0, Math.min(100, element.layout?.x ?? 10))}%, calc(100% - max(${Math.max(2, Math.min(100, element.layout?.width ?? 30))}%, min(140px, 100%))))`,
              }
            : {}),
    };
    const className = `design-element design-element-${element.type} ${element.type === "shape" || element.type === "image" ? `design-element-shape-${shape}` : ""} ${selected ? "is-selected" : ""}`;
    const metadata = {
        "data-design-id": element.id,
        "data-design-kind": element.type,
        "data-site-section": sectionId,
    };
    if (element.type === "text" || element.type === "button") {
        if (editor && sectionId != null)
            return (
                <CanvasText
                    {...metadata}
                    as={element.type === "button" ? "span" : "p"}
                    className={className}
                    style={style}
                    label={
                        element.type === "button"
                            ? "Button label"
                            : "Text element"
                    }
                    editable={editor.enabled}
                    selected={selected}
                    maxLength={element.type === "button" ? 100 : 2500}
                    multiline={element.type === "text"}
                    onSelect={() =>
                        editor.onSelectElement?.(sectionId, element.id)
                    }
                    onChange={(text) =>
                        editor.onChangeElementText?.(
                            sectionId,
                            element.id,
                            text,
                        )
                    }
                >
                    {element.text || ""}
                </CanvasText>
            );
        return (
            <ElementLink
                href={element.href}
                newTab={element.new_tab}
                fallback={element.type === "button"}
                className={
                    element.type === "button"
                        ? className
                        : "design-linked-image"
                }
                style={element.type === "button" ? style : undefined}
            >
                <AnimatedText
                    {...metadata}
                    as={element.type === "button" ? "span" : "p"}
                    animationStyle={element.text_style}
                    className={element.type === "text" ? className : undefined}
                    style={element.type === "text" ? style : undefined}
                >
                    {element.text || ""}
                </AnimatedText>
            </ElementLink>
        );
    }
    if (element.type === "image") {
        const source = safeImageSource(element.image, !!editor);
        if (!source)
            return editor ? (
                <span
                    {...metadata}
                    className={`${className} design-image-placeholder`}
                    style={style}
                    role="button"
                    tabIndex={0}
                    onClick={select}
                    onKeyDown={keySelect}
                >
                    Upload an image
                </span>
            ) : null;
        return (
            <ElementLink
                href={element.href}
                editor={!!editor}
                newTab={element.new_tab}
                className="design-linked-image"
            >
                <img
                    {...metadata}
                    src={source}
                    alt={element.image_alt || ""}
                    className={className}
                    style={style}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onClick={select}
                    onKeyDown={keySelect}
                    role={editor?.enabled ? "button" : undefined}
                    tabIndex={editor?.enabled ? 0 : undefined}
                />
            </ElementLink>
        );
    }
    return (
        <ElementLink
            href={element.href}
            editor={!!editor}
            newTab={element.new_tab}
            className="design-linked-image"
        >
            <span
                {...metadata}
                className={className}
                style={style}
                onClick={select}
                onKeyDown={keySelect}
                role={
                    editor?.enabled
                        ? "button"
                        : element.href
                          ? "img"
                          : undefined
                }
                aria-label={
                    editor
                        ? `${shape} shape`
                        : element.href
                          ? `${shape} link`
                          : undefined
                }
                aria-hidden={!editor && !element.href ? true : undefined}
                tabIndex={editor?.enabled ? 0 : undefined}
            />
        </ElementLink>
    );
}
