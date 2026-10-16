import { Link } from "@inertiajs/react";
import { ReactNode } from "react";

export type SiteWorkspaceSection =
    "overview" | "studio" | "commerce" | "products" | "orders" | "settings";

type WorkspaceSite = {
    id: number;
    name: string;
    type: "business" | "store" | string;
};

type Props = {
    site: WorkspaceSite;
    active: SiteWorkspaceSection;
    canManage?: boolean;
    canManageStore?: boolean;
};

type WorkspaceLink = {
    key: SiteWorkspaceSection;
    label: string;
    href: string;
    icon: ReactNode;
};

const iconClass = "h-[18px] w-[18px] shrink-0";

export default function SiteWorkspaceNav({
    site,
    active,
    canManage = false,
    canManageStore = false,
}: Props) {
    const links: WorkspaceLink[] = [
        {
            key: "overview",
            label: "Overview",
            href: route("sites.admin", site.id),
            icon: (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
        },
        {
            key: "studio",
            label: "Studio",
            href: route("sites.edit", site.id),
            icon: (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path
                        d="m4 20 4.2-1 10.6-10.6a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="m13.8 7.4 3 3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                </svg>
            ),
        },
    ];

    if (site.type === "store" && canManageStore) {
        links.push(
            {
                key: "commerce",
                label: "Commerce",
                href: route("commerce.hub", site.id),
                icon: (
                    <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                        <path
                            d="M4 8h16l-1 12H5L4 8Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M9 10V7a3 3 0 0 1 6 0v3"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                ),
            },
            {
                key: "products",
                label: "Products",
                href: route("products.index", site.id),
                icon: (
                    <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                        <path
                            d="m4 7 8-4 8 4-8 4-8-4Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                        <path
                            d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M12 11v10"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                    </svg>
                ),
            },
            {
                key: "orders",
                label: "Orders",
                href: route("orders.index", site.id),
                icon: (
                    <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                        <path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                ),
            },
        );
    }

    if (canManage) {
        links.push({
            key: "settings",
            label: "Settings",
            href: route("sites.edit", { site: site.id, panel: "settings" }),
            icon: (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <path
                        d="m19.4 15 .1.1-1 1.8-2.1-.4a8 8 0 0 1-1.5.9l-.7 2h-2.1l-.7-2a8 8 0 0 1-1.5-.9l-2.1.4-1-1.8 1.4-1.6a7 7 0 0 1 0-1.8L4.9 9.9l1-1.8 2.1.4a8 8 0 0 1 1.5-.9l.7-2h2.1l.7 2a8 8 0 0 1 1.5.9l2.1-.4 1 1.8-1.4 1.6a7 7 0 0 1 0 1.8l1.4 1.6Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
        });
    }

    return (
        <nav
            aria-label={`${site.name} workspace`}
            className="overflow-x-auto rounded-2xl border border-[#dfe5e1] bg-white p-2 shadow-[0_10px_35px_rgba(23,63,55,0.06)]"
        >
            <ul className="flex min-w-max items-center gap-1">
                {links.map((item) => {
                    const selected = active === item.key;

                    return (
                        <li key={item.key}>
                            <Link
                                href={item.href}
                                aria-current={selected ? "page" : undefined}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${
                                    selected
                                        ? "bg-[#173f37] text-white shadow-sm"
                                        : "text-[#53645f] hover:bg-[#f0f5f2] hover:text-[#173f37]"
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
