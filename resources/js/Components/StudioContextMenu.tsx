import { useEffect, useRef, useState } from "react";

export type StudioMenuAction = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
};
export default function StudioContextMenu({
    x,
    y,
    label,
    actions,
    onClose,
}: {
    x: number;
    y: number;
    label: string;
    actions: StudioMenuAction[];
    onClose: () => void;
}) {
    const root = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y });
    useEffect(() => {
        const rect = root.current?.getBoundingClientRect();
        setPosition({
            x: Math.max(8, Math.min(x, innerWidth - (rect?.width || 240) - 8)),
            y: Math.max(
                8,
                Math.min(y, innerHeight - (rect?.height || 320) - 8),
            ),
        });
        root.current
            ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
            ?.focus();
        const close = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) onClose();
        };
        document.addEventListener("pointerdown", close);
        document.addEventListener("scroll", onClose, true);
        return () => {
            document.removeEventListener("pointerdown", close);
            document.removeEventListener("scroll", onClose, true);
        };
    }, [x, y]);
    return (
        <div
            ref={root}
            className="studio-context-menu"
            role="menu"
            aria-label={`${label} edits`}
            style={{ left: position.x, top: position.y }}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    onClose();
                }
                if (
                    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                ) {
                    event.preventDefault();
                    const buttons = Array.from(
                        root.current?.querySelectorAll<HTMLButtonElement>(
                            "button:not(:disabled)",
                        ) || [],
                    );
                    const index = buttons.indexOf(
                        document.activeElement as HTMLButtonElement,
                    );
                    buttons[
                        event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? buttons.length - 1
                              : (index +
                                    (event.key === "ArrowDown" ? 1 : -1) +
                                    buttons.length) %
                                buttons.length
                    ]?.focus();
                }
            }}
        >
            <p>{label}</p>
            {actions.map((action) => (
                <button
                    role="menuitem"
                    type="button"
                    key={action.label}
                    disabled={action.disabled}
                    onClick={() => {
                        onClose();
                        action.onClick();
                    }}
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
}
