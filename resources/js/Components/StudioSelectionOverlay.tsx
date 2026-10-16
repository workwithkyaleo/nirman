import { useEffect, useRef, useState } from "react";

export default function StudioSelectionOverlay({
    selector,
    layout,
    free,
    revision,
    sourceKey,
    onLayout,
    onStart,
    onEnd,
}: {
    selector?: string;
    layout: any;
    free: boolean;
    revision: unknown;
    sourceKey?: string;
    onLayout: (patch: any) => void;
    onStart: () => void;
    onEnd: () => void;
}) {
    const root = useRef<HTMLDivElement>(null);
    const handlers = useRef({ onLayout, onStart, onEnd });
    handlers.current = { onLayout, onStart, onEnd };
    const [rect, setRect] = useState<{
        left: number;
        top: number;
        width: number;
        height: number;
    } | null>(null);
    const gesture = useRef<{
        pointer: number;
        clientX: number;
        clientY: number;
        layout: any;
        width: number;
        height: number;
        parentWidth: number;
        parentHeight: number;
        scale: number;
        mode: string;
    } | null>(null);
    useEffect(() => {
        if (!selector) {
            setRect(null);
            return;
        }
        const update = () => {
            const target = document.querySelector<HTMLElement>(selector);
            const host = root.current?.parentElement;
            if (!target || !host) {
                setRect(null);
                return;
            }
            const box = target.getBoundingClientRect(),
                container = host.getBoundingClientRect();
            const scale = container.width / Math.max(host.offsetWidth, 1);
            setRect({
                left: (box.left - container.left) / scale,
                top: (box.top - container.top) / scale,
                width: box.width / scale,
                height: box.height / scale,
            });
        };
        update();
        const observer = new ResizeObserver(update);
        const target = document.querySelector(selector);
        if (target) observer.observe(target);
        window.addEventListener("resize", update);
        document.addEventListener("scroll", update, true);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
            document.removeEventListener("scroll", update, true);
        };
    }, [selector, revision, sourceKey]);
    useEffect(() => {
        if (!selector) return;
        const target = document.querySelector<HTMLElement>(selector);
        if (
            !target ||
            !["image", "shape"].includes(target.dataset.designKind || "")
        )
            return;
        let active: any = null;
        const down = (event: PointerEvent) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const parent =
                target.offsetParent instanceof HTMLElement
                    ? target.offsetParent
                    : target.parentElement!;
            const box = target.getBoundingClientRect(),
                parentBox = parent.getBoundingClientRect();
            const scale = parentBox.width / Math.max(parent.offsetWidth, 1);
            const absolute =
                free || getComputedStyle(target).position === "absolute";
            active = {
                pointer: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                x: absolute
                    ? ((box.left - parentBox.left) / parentBox.width) * 100
                    : layout?.x || 0,
                y: free
                    ? ((box.top - parentBox.top) / parentBox.height) * 100
                    : absolute
                      ? (box.top - parentBox.top) / scale
                      : layout?.y || 0,
                parentWidth: parentBox.width,
                parentHeight: parentBox.height,
                scale,
                width: (box.width / parentBox.width) * 100,
            };
            target.setPointerCapture(event.pointerId);
            handlers.current.onStart();
        };
        const move = (event: PointerEvent) => {
            if (!active || active.pointer !== event.pointerId) return;
            const dx = event.clientX - active.clientX,
                dy = event.clientY - active.clientY;
            handlers.current.onLayout({
                x:
                    Math.round(
                        Math.max(
                            free ? 0 : -100,
                            Math.min(
                                free ? 100 - active.width : 100,
                                active.x + (dx / active.parentWidth) * 100,
                            ),
                        ) * 100,
                    ) / 100,
                y:
                    Math.round(
                        Math.max(
                            free ? 0 : -1000,
                            Math.min(
                                free ? 95 : 1000,
                                active.y +
                                    (free
                                        ? (dy / active.parentHeight) * 100
                                        : dy / active.scale),
                            ),
                        ) * 100,
                    ) / 100,
            });
        };
        const up = (event: PointerEvent) => {
            if (active?.pointer === event.pointerId) {
                active = null;
                if (target.hasPointerCapture(event.pointerId))
                    target.releasePointerCapture(event.pointerId);
                handlers.current.onEnd();
            }
        };
        target.addEventListener("pointerdown", down);
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", up);
        target.addEventListener("pointercancel", up);
        return () => {
            target.removeEventListener("pointerdown", down);
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            target.removeEventListener("pointercancel", up);
            if (active) handlers.current.onEnd();
        };
    }, [selector, free, sourceKey]);
    const start = (
        event: React.PointerEvent<HTMLButtonElement>,
        mode: string,
    ) => {
        if (!selector) return;
        const target = document.querySelector<HTMLElement>(selector);
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const parent =
            target.offsetParent instanceof HTMLElement
                ? target.offsetParent
                : target.parentElement!;
        const box = target.getBoundingClientRect(),
            parentRect = parent.getBoundingClientRect();
        const scale = parentRect.width / Math.max(parent.offsetWidth, 1);
        const absolute =
            free || getComputedStyle(target).position === "absolute";
        const initialLayout = {
            ...layout,
            x:
                absolute && layout?.x == null
                    ? ((box.left - parentRect.left) / parentRect.width) * 100
                    : layout?.x || 0,
            y: free
                ? ((box.top - parentRect.top) / parentRect.height) * 100
                : absolute && layout?.y == null
                  ? (box.top - parentRect.top) / scale
                  : layout?.y || 0,
        };
        gesture.current = {
            pointer: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            layout: initialLayout,
            width: box.width,
            height: box.height,
            parentWidth: parentRect.width,
            parentHeight: parentRect.height,
            scale,
            mode,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart();
    };
    const move = (event: React.PointerEvent<HTMLButtonElement>) => {
        const current = gesture.current;
        if (!current || current.pointer !== event.pointerId) return;
        const dx = event.clientX - current.clientX,
            dy = event.clientY - current.clientY;
        const bound = (value: number, min: number, max: number) =>
            Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
        if (current.mode === "move")
            onLayout({
                x: bound(
                    (current.layout.x || 0) + (dx / current.parentWidth) * 100,
                    free ? 0 : -100,
                    free ? 100 - (current.layout.width || 25) : 100,
                ),
                y: bound(
                    (current.layout.y || 0) +
                        (free
                            ? (dy / current.parentHeight) * 100
                            : dy / current.scale),
                    free ? 0 : -1000,
                    free ? 95 : 1000,
                ),
            });
        else
            onLayout({
                width: bound(
                    ((current.width + dx) / current.parentWidth) * 100,
                    2,
                    100,
                ),
                height: bound((current.height + dy) / current.scale, 16, 1200),
            });
    };
    return (
        <div ref={root} className="studio-selection-layer">
            {rect && (
                <div className="studio-selection-box" style={rect}>
                    <button
                        type="button"
                        className="studio-move-handle"
                        aria-label="Drag selected element"
                        title="Drag to move · arrow keys to nudge"
                        onPointerDown={(e) => start(e, "move")}
                        onPointerMove={move}
                        onPointerUp={(event) => {
                            if (gesture.current) {
                                gesture.current = null;
                                event.currentTarget.releasePointerCapture(
                                    event.pointerId,
                                );
                                onEnd();
                            }
                        }}
                        onKeyDown={(event) => {
                            if (
                                [
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "ArrowUp",
                                    "ArrowDown",
                                ].includes(event.key)
                            ) {
                                event.preventDefault();
                                const step = event.shiftKey ? 10 : 1;
                                onStart();
                                onLayout(
                                    event.key === "ArrowLeft" ||
                                        event.key === "ArrowRight"
                                        ? {
                                              x: Math.max(
                                                  free ? 0 : -100,
                                                  Math.min(
                                                      100,
                                                      (layout?.x || 0) +
                                                          (event.key ===
                                                          "ArrowLeft"
                                                              ? -step
                                                              : step),
                                                  ),
                                              ),
                                          }
                                        : {
                                              y: Math.max(
                                                  free ? 0 : -1000,
                                                  Math.min(
                                                      free ? 100 : 1000,
                                                      (layout?.y || 0) +
                                                          (event.key ===
                                                          "ArrowUp"
                                                              ? -step
                                                              : step),
                                                  ),
                                              ),
                                          },
                                );
                                onEnd();
                            }
                        }}
                    >
                        ✥
                    </button>
                    <button
                        type="button"
                        className="studio-resize-handle"
                        aria-label="Resize selected element"
                        title="Drag to resize"
                        onPointerDown={(e) => start(e, "resize")}
                        onPointerMove={move}
                        onPointerUp={(event) => {
                            if (gesture.current) {
                                gesture.current = null;
                                event.currentTarget.releasePointerCapture(
                                    event.pointerId,
                                );
                                onEnd();
                            }
                        }}
                        onPointerCancel={() => {
                            gesture.current = null;
                            onEnd();
                        }}
                    />
                </div>
            )}
        </div>
    );
}
