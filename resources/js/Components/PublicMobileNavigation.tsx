import { Link } from "@inertiajs/react";
import { useEffect, useId, useRef, useState } from "react";

export type PublicNavigationItem = {
    label: string;
    href: string;
    current?: boolean;
};

export default function PublicMobileNavigation({
    items,
    action,
}: {
    items: PublicNavigationItem[];
    action?: PublicNavigationItem;
}) {
    const menu = useRef<HTMLDetailsElement>(null);
    const panelId = useId();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const closeOutside = (event: PointerEvent) => {
            if (!menu.current?.contains(event.target as Node)) {
                menu.current?.removeAttribute("open");
            }
        };
        const closeWithEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                menu.current?.removeAttribute("open");
                menu.current?.querySelector("summary")?.focus();
            }
        };
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("keydown", closeWithEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOutside);
            document.removeEventListener("keydown", closeWithEscape);
        };
    }, [open]);

    return (
        <details
            ref={menu}
            className="public-mobile-navigation"
            onToggle={(event) => setOpen(event.currentTarget.open)}
        >
            <summary aria-expanded={open} aria-controls={panelId}>
                <span>Menu</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
                </svg>
            </summary>
            <div
                id={panelId}
                className="public-mobile-navigation-panel"
                onClick={(event) => {
                    if ((event.target as Element).closest("a")) {
                        menu.current?.removeAttribute("open");
                    }
                }}
            >
                <nav aria-label="Mobile navigation">
                    <ul>
                        {items.map((item) => (
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
                {action && (
                    <a className="button button-public" href={action.href}>
                        {action.label}
                    </a>
                )}
            </div>
        </details>
    );
}
