import { useContext, type HTMLAttributes } from "react";
import AnimatedText from "@/Components/AnimatedText";
import CanvasText from "@/Components/CanvasText";
import type { TextStyle } from "@/lib/publicTheme";
import ElementLink from "@/Components/ElementLink";
import {
    ElementDesignContext,
    designKey,
    elementLayoutStyle,
} from "@/lib/elementDesign";

export type WebsiteTextField =
    | "eyebrow"
    | "heading"
    | "body"
    | "title"
    | "description"
    | "primary_action"
    | "secondary_action"
    | "action";

export type WebsiteEditor = {
    enabled: boolean;
    selectedSectionId?: number | null;
    selectedField?: string;
    selectedItemIndex?: number | null;
    selectedElementId?: string | null;
    onSelectDecoration?: (sectionId: number) => void;
    onSelectElement?: (sectionId: number, elementId: string) => void;
    onChangeElementText?: (
        sectionId: number,
        elementId: string,
        text: string,
    ) => void;
    onSelectSection: (sectionId: number) => void;
    onSelectText: (
        sectionId: number,
        field: WebsiteTextField,
        itemIndex?: number,
    ) => void;
    onChangeText: (
        sectionId: number,
        field: string,
        text: string,
        itemIndex?: number,
    ) => void;
    onSelectImage: (sectionId: number, itemIndex?: number) => void;
};

type WebsiteTextProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    as?: "h1" | "h2" | "h3" | "p" | "span" | "b";
    children: string;
    animationStyle?: TextStyle | null;
    editor?: WebsiteEditor;
    sectionId?: number;
    field: WebsiteTextField;
    itemIndex?: number;
};

export default function WebsiteText({
    as = "span",
    children,
    animationStyle,
    editor,
    sectionId,
    field,
    itemIndex,
    ...props
}: WebsiteTextProps) {
    const { content } = useContext(ElementDesignContext);
    const key = designKey(field, itemIndex);
    const isButton = ["primary_action", "secondary_action", "action"].includes(
        field,
    );
    const layout = content.element_layouts?.[key];
    const designProps = {
        ...props,
        className: `${props.className || ""} design-existing-element`,
        "data-design-key": isButton ? undefined : key,
        "data-design-kind": isButton ? undefined : "text",
        "data-design-layout": !isButton && layout ? "true" : undefined,
        style: {
            ...props.style,
            ...(!isButton ? elementLayoutStyle(layout) : {}),
        },
    };
    if (!editor || sectionId == null)
        return (
            <ElementLink
                href={!isButton ? content.links?.[key] : undefined}
                className="design-linked-text"
            >
                <AnimatedText
                    as={as}
                    animationStyle={animationStyle}
                    {...designProps}
                >
                    {children}
                </AnimatedText>
            </ElementLink>
        );

    const maxLength =
        field === "eyebrow"
            ? 120
            : field === "heading"
              ? 180
              : field === "title"
                ? 160
                : field === "body"
                  ? 2500
                  : field === "description"
                    ? 1200
                    : 100;
    const label = field === "body" ? "Description" : field.replace(/_/g, " ");

    return (
        <CanvasText
            {...designProps}
            as={as}
            label={itemIndex == null ? label : `Item ${itemIndex + 1} ${label}`}
            editable={editor.enabled}
            selected={
                editor.selectedSectionId === sectionId &&
                editor.selectedField === field &&
                (editor.selectedItemIndex ?? undefined) === itemIndex
            }
            multiline={field === "body" || field === "description"}
            maxLength={maxLength}
            data-site-text={field}
            data-site-item={itemIndex}
            onSelect={() => editor.onSelectText(sectionId, field, itemIndex)}
            onChange={(text) =>
                editor.onChangeText(sectionId, field, text, itemIndex)
            }
        >
            {children || ""}
        </CanvasText>
    );
}
