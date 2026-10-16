import {
    createElement,
    useLayoutEffect,
    useRef,
    type ClipboardEvent,
    type DragEvent,
    type HTMLAttributes,
} from "react";

type CanvasTextProps = Omit<
    HTMLAttributes<HTMLElement>,
    "children" | "onChange" | "onSelect"
> & {
    as?: "h1" | "h2" | "h3" | "p" | "span" | "b";
    children: string;
    label: string;
    editable?: boolean;
    selected?: boolean;
    multiline?: boolean;
    maxLength?: number;
    onSelect?: () => void;
    onChange: (text: string) => void;
};

/** Keep the canvas as plain text, including text copied from another website. */
function plainText(value: string, multiline: boolean) {
    const normalized = value.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
    return multiline ? normalized : normalized.replace(/\n+/g, " ");
}

function readText(element: HTMLElement, multiline: boolean) {
    if (!multiline) return plainText(element.textContent ?? "", false);
    // innerText preserves browser-generated line breaks, but it also applies
    // CSS uppercase/capitalize. Read with that visual transform disabled so
    // selecting styled text never rewrites what the customer originally typed.
    const transform = element.style.getPropertyValue("text-transform");
    const priority = element.style.getPropertyPriority("text-transform");
    element.style.setProperty("text-transform", "none", "important");
    try {
        return plainText(element.innerText ?? element.textContent ?? "", true);
    } finally {
        if (transform)
            element.style.setProperty("text-transform", transform, priority);
        else element.style.removeProperty("text-transform");
    }
}

function insertText(element: HTMLElement, value: string) {
    const selection = window.getSelection();
    if (!selection) return;
    const range =
        selection.rangeCount > 0 &&
        element.contains(selection.getRangeAt(0).commonAncestorContainer)
            ? selection.getRangeAt(0)
            : document.createRange();
    if (!element.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(element);
        range.collapse(false);
    }
    range.deleteContents();
    const text = document.createTextNode(value);
    range.insertNode(text);
    range.setStartAfter(text);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
}

export default function CanvasText({
    as = "p",
    children,
    label,
    editable = true,
    selected = false,
    multiline = as === "p",
    maxLength,
    onSelect,
    onChange,
    className,
    onClick,
    onFocus,
    onBlur,
    onKeyDown,
    onInput,
    onBeforeInput,
    ...props
}: CanvasTextProps) {
    const element = useRef<HTMLElement>(null);
    const focused = useRef(false);
    const initialText = useRef(children);
    const reportedText = useRef(children);

    // React must not replace the text node while someone types: that moves the
    // caret to the beginning. External changes are applied after focus leaves.
    useLayoutEffect(() => {
        if (!element.current || focused.current) return;
        if (element.current.textContent !== children)
            element.current.textContent = children;
        reportedText.current = children;
    }, [children, editable]);

    const report = (target: HTMLElement) => {
        let text = readText(target, multiline);
        if (maxLength != null && text.length > maxLength) {
            text = text.slice(0, maxLength);
            target.textContent = text;
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(target);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
        if (text !== reportedText.current) {
            reportedText.current = text;
            onChange(text);
        }
        return text;
    };

    const allowedText = (target: HTMLElement, value: string) => {
        const text = plainText(value, multiline);
        if (maxLength == null) return text;
        const selection = window.getSelection();
        const replaced =
            selection?.rangeCount &&
            target.contains(selection.getRangeAt(0).commonAncestorContainer)
                ? selection.toString().length
                : 0;
        const remaining = Math.max(
            0,
            maxLength - readText(target, multiline).length + replaced,
        );
        return text.slice(0, remaining);
    };

    const paste = (event: ClipboardEvent<HTMLElement>) => {
        event.preventDefault();
        insertText(
            event.currentTarget,
            allowedText(
                event.currentTarget,
                event.clipboardData.getData("text/plain"),
            ),
        );
        report(event.currentTarget);
    };

    const drop = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        // Files belong in Uploads. Dropped rich text never enters the canvas.
        if (event.dataTransfer.files.length) return;
        insertText(
            event.currentTarget,
            allowedText(
                event.currentTarget,
                event.dataTransfer.getData("text/plain"),
            ),
        );
        report(event.currentTarget);
    };

    return createElement(
        as,
        {
            ...props,
            ref: element,
            className: `canva-canvas-text canva-editable-text ${selected ? "is-selected" : ""} ${className || ""}`,
            contentEditable: editable ? "plaintext-only" : false,
            suppressContentEditableWarning: true,
            "data-editable": editable ? "true" : "false",
            "data-selected": selected ? "true" : "false",
            "aria-label": editable
                ? `${label}. Click to edit text.`
                : props["aria-label"],
            "aria-multiline": editable ? multiline : undefined,
            role: editable ? "textbox" : props.role,
            tabIndex: editable ? 0 : props.tabIndex,
            spellCheck: true,
            onClick: (event) => {
                if (editable) {
                    event.stopPropagation();
                    onSelect?.();
                }
                onClick?.(event);
            },
            onFocus: (event) => {
                focused.current = true;
                if (editable) onSelect?.();
                onFocus?.(event);
            },
            onInput: (event) => {
                if (editable) report(event.currentTarget);
                onInput?.(event);
            },
            onBeforeInput: (event) => {
                onBeforeInput?.(event);
                if (event.defaultPrevented || !editable) return;
                const nativeEvent = event.nativeEvent as InputEvent;
                if (
                    !multiline &&
                    ["insertParagraph", "insertLineBreak"].includes(
                        nativeEvent.inputType,
                    )
                ) {
                    event.preventDefault();
                    return;
                }
                if (
                    nativeEvent.data &&
                    !nativeEvent.isComposing &&
                    allowedText(event.currentTarget, nativeEvent.data).length <
                        nativeEvent.data.length
                )
                    event.preventDefault();
            },
            onPaste: editable ? paste : props.onPaste,
            onDrop: editable ? drop : props.onDrop,
            onBlur: (event) => {
                focused.current = false;
                if (editable) {
                    const text = report(event.currentTarget);
                    // Browsers may create <br> or <div> for line breaks. Flatten
                    // these nodes after editing, preserving only their text.
                    event.currentTarget.textContent = text;
                }
                onBlur?.(event);
            },
            onKeyDown: (event) => {
                onKeyDown?.(event);
                if (event.defaultPrevented || !editable) return;
                if (event.key === "Escape") event.currentTarget.blur();
                if (event.key === "Enter" && !multiline) event.preventDefault();
            },
        },
        initialText.current,
    );
}
