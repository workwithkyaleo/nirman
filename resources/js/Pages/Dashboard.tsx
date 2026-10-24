import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";

export type SiteItem = {
    id: number;
    name: string;
    slug: string;
    type: "store" | "business" | string;
    status: "published" | "draft" | string;
    currency?: string;
    category?: string | null;
    description?: string | null;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    products_count?: number;
    orders_count?: number;
    pages_count?: number;
    pivot?: {
        role?: string;
    };
    theme?: {
        settings?: Record<string, any>;
    };
    template?: {
        id: number;
        name: string;
        slug: string;
        category: string;
    } | null;
};

type TemplateItem = {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    sections: any[];
    theme: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string };
};

interface DashboardProps {
    sites?: SiteItem[];
    templates?: TemplateItem[];
}

// Preset visual themes for site mockup preview cards
const PREVIEW_THEMES: Record<
    string,
    {
        bg: string;
        accent: string;
        nav: string;
        badge: string;
        heroBg: string;
    }
> = {
    emerald: {
        bg: "from-emerald-50 via-teal-50/60 to-cyan-50",
        accent: "bg-emerald-600",
        nav: "bg-emerald-800/10 text-emerald-800",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        heroBg: "bg-emerald-900/10",
    },
    amber: {
        bg: "from-amber-50 via-orange-50/60 to-yellow-50",
        accent: "bg-amber-600",
        nav: "bg-amber-800/10 text-amber-800",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        heroBg: "bg-amber-900/10",
    },
    indigo: {
        bg: "from-indigo-50 via-slate-50 to-blue-50",
        accent: "bg-indigo-600",
        nav: "bg-indigo-800/10 text-indigo-800",
        badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
        heroBg: "bg-indigo-900/10",
    },
    rose: {
        bg: "from-rose-50 via-pink-50/60 to-orange-50",
        accent: "bg-rose-600",
        nav: "bg-rose-800/10 text-rose-800",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        heroBg: "bg-rose-900/10",
    },
    slate: {
        bg: "from-slate-100 via-gray-50 to-zinc-100",
        accent: "bg-slate-700",
        nav: "bg-slate-800/10 text-slate-800",
        badge: "bg-slate-200 text-slate-800 border-slate-300",
        heroBg: "bg-slate-900/10",
    },
};

function getSiteTheme(site: SiteItem) {
    const key = (site.name + site.slug + (site.category || "")).toLowerCase();
    if (key.includes("bloom") || key.includes("flower") || key.includes("green") || key.includes("eco")) {
        return PREVIEW_THEMES.emerald;
    }
    if (key.includes("craft") || key.includes("bhada") || key.includes("pot") || key.includes("art")) {
        return PREVIEW_THEMES.amber;
    }
    if (key.includes("popular") || key.includes("trend") || key.includes("fashion")) {
        return PREVIEW_THEMES.rose;
    }
    if (site.type === "store") {
        return PREVIEW_THEMES.emerald;
    }
    return PREVIEW_THEMES.indigo;
}

// Category badge colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    store:    { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
    commerce: { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
    business: { bg: "bg-indigo-100",  text: "text-indigo-800",  dot: "bg-indigo-500" },
    portfolio:{ bg: "bg-purple-100",  text: "text-purple-800",  dot: "bg-purple-500" },
    restaurant:{ bg: "bg-rose-100",   text: "text-rose-800",    dot: "bg-rose-500" },
    default:  { bg: "bg-teal-100",    text: "text-teal-800",    dot: "bg-teal-500" },
};
function getCategoryColor(cat: string) {
    const key = cat.toLowerCase();
    for (const k of Object.keys(CATEGORY_COLORS)) {
        if (key.includes(k)) return CATEGORY_COLORS[k];
    }
    return CATEGORY_COLORS.default;
}

export default function Dashboard({ sites = [], templates = [] }: DashboardProps) {
    const { brand } = usePage().props as any;
    const siteDomain = brand?.siteDomain || "nirmaan.test";

    // Controls state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "store" | "business">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [sortBy, setSortBy] = useState<"updated" | "name" | "products" | "orders">("updated");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Template preview modal state
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");

    // Close modal on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setShowTemplatesModal(false); setSelectedTemplate(null); } };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    // Lock body scroll when modal open
    useEffect(() => {
        document.body.style.overflow = showTemplatesModal ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showTemplatesModal]);

    const templateCategories = useMemo(() => {
        const cats = Array.from(new Set(templates.map(t => t.category)));
        return ["all", ...cats];
    }, [templates]);

    const filteredTemplates = useMemo(() => {
        if (templateCategoryFilter === "all") return templates;
        return templates.filter(t => t.category === templateCategoryFilter);
    }, [templates, templateCategoryFilter]);

    // Toast feedback state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 2400);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
    };

    const copySiteUrl = (slug: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const url = `https://${slug}.${siteDomain}`;
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard
                .writeText(url)
                .then(() => showToast(`Copied ${url} to clipboard`))
                .catch(() => showToast(`URL: ${url}`));
        } else {
            showToast(`URL: ${url}`);
        }
    };

    // Calculate overall workspace metrics
    const totalSites = sites.length;
    const publishedSites = sites.filter((s) => s.status === "published").length;
    const storeSites = sites.filter((s) => s.type === "store").length;
    const businessSites = sites.filter((s) => s.type === "business").length;
    const totalProducts = sites.reduce((sum, s) => sum + (s.products_count || 0), 0);
    const totalOrders = sites.reduce((sum, s) => sum + (s.orders_count || 0), 0);

    // Filter and sort sites
    const filteredSites = useMemo(() => {
        let result = [...sites];

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.slug.toLowerCase().includes(q) ||
                    (s.category && s.category.toLowerCase().includes(q)),
            );
        }

        // Type filter
        if (typeFilter !== "all") {
            result = result.filter((s) => s.type === typeFilter);
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((s) => s.status === statusFilter);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }
            if (sortBy === "products") {
                return (b.products_count || 0) - (a.products_count || 0);
            }
            if (sortBy === "orders") {
                return (b.orders_count || 0) - (a.orders_count || 0);
            }
            // default: recently updated or id
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : a.id;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : b.id;
            return dateB - dateA;
        });

        return result;
    }, [sites, searchQuery, typeFilter, statusFilter, sortBy]);

    // Active 3-dot dropdown menu site id
    const [openMenuSiteId, setOpenMenuSiteId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuSiteId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="My Sites — Dashboard" />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="min-h-screen bg-[#f8faf9] pb-16">
                {/* Wix Studio Top Workspace Header */}
                <div className="border-b border-slate-200/80 bg-white shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-7">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                                        Sites
                                    </h1>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                        {totalSites} {totalSites === 1 ? "site" : "sites"}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    Manage, edit, and grow your digital storefronts and web experiences.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowTemplatesModal(true); setSelectedTemplate(null); }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Browse Templates
                                </button>

                                <Link
                                    href={route("sites.create")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Site
                                </Link>
                            </div>
                        </div>

                        {/* Wix-Style Workspace KPI Summary Bar */}
                        {totalSites > 0 && (
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">{totalSites}</div>
                                        <div className="text-xs font-medium text-slate-500">Total Sites</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">{publishedSites}</div>
                                        <div className="text-xs font-medium text-slate-500">Published Live</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">{storeSites}</div>
                                        <div className="text-xs font-medium text-slate-500">Online Stores</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">{totalProducts}</div>
                                        <div className="text-xs font-medium text-slate-500">Catalog Products</div>
                                    </div>
                                </div>

                                <div className="hidden lg:flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-slate-900">{totalOrders}</div>
                                        <div className="text-xs font-medium text-slate-500">Total Orders</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
                    {/* Wix Studio Control Bar (Search, Filter Tabs, Sort, View Switcher) */}
                    {totalSites > 0 && (
                        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            {/* Search Box */}
                            <div className="relative min-w-[260px] flex-1 max-w-md">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search sites by name, domain, slug..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Filters & View Toggles */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {/* Type Filter */}
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold text-slate-600">
                                    <button
                                        type="button"
                                        onClick={() => setTypeFilter("all")}
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            typeFilter === "all"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "hover:text-slate-900"
                                        }`}
                                    >
                                        All ({totalSites})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTypeFilter("store")}
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            typeFilter === "store"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "hover:text-slate-900"
                                        }`}
                                    >
                                        Stores ({storeSites})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTypeFilter("business")}
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            typeFilter === "business"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "hover:text-slate-900"
                                        }`}
                                    >
                                        Business ({businessSites})
                                    </button>
                                </div>

                                {/* Status Filter Dropdown */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                    <option value="all">Status: All</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>

                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                    <option value="updated">Recently Updated</option>
                                    <option value="name">Site Name (A-Z)</option>
                                    <option value="products">Most Products</option>
                                    <option value="orders">Most Orders</option>
                                </select>

                                {/* View Switcher (Grid vs List) */}
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-slate-600">
                                    <button
                                        type="button"
                                        title="Grid view"
                                        onClick={() => setViewMode("grid")}
                                        className={`rounded-lg p-1.5 transition ${
                                            viewMode === "grid"
                                                ? "bg-white text-teal-800 shadow-sm"
                                                : "hover:text-slate-900"
                                        }`}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        title="List view"
                                        onClick={() => setViewMode("list")}
                                        className={`rounded-lg p-1.5 transition ${
                                            viewMode === "list"
                                                ? "bg-white text-teal-800 shadow-sm"
                                                : "hover:text-slate-900"
                                        }`}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Site Grid / List or Empty State */}
                    {filteredSites.length > 0 ? (
                        viewMode === "grid" ? (
                            /* Wix-Style Cards Grid */
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredSites.map((site) => {
                                    const theme = getSiteTheme(site);
                                    const isStore = site.type === "store";
                                    const isPublished = site.status === "published";
                                    const isMenuOpen = openMenuSiteId === site.id;

                                    return (
                                        <article
                                            key={site.id}
                                            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                                        >
                                            {/* Realistic Miniature Browser Mockup Window (Replaces the ugly yellow orb!) */}
                                            <div className="relative border-b border-slate-100 bg-slate-50">
                                                {/* Browser Chrome Header */}
                                                <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-3.5 py-2 backdrop-blur-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 truncate rounded-md bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono text-slate-500">
                                                        <svg className="h-2.5 w-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        <span className="truncate max-w-[130px]">{site.slug}.{siteDomain}</span>
                                                    </div>
                                                    <div className="w-8" />
                                                </div>

                                                {/* Mockup Canvas */}
                                                <div className={`relative h-44 bg-gradient-to-br ${theme.bg} p-4 transition-transform group-hover:scale-[1.01]`}>
                                                    {/* Badges on Top */}
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                                                isPublished
                                                                    ? "bg-emerald-500/15 text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
                                                                    : "bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-600/20"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    isPublished ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                                                                }`}
                                                            />
                                                            {isPublished ? "Published" : "Draft"}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                                                            {isStore ? (
                                                                <>
                                                                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                    </svg>
                                                                    Online store
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                                    </svg>
                                                                    Business site
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Mini Layout Wireframe Illustration */}
                                                    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white/70 p-3 shadow-sm backdrop-blur-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div className="h-3 w-20 rounded bg-slate-800/20" />
                                                            <div className="flex gap-1">
                                                                <div className="h-2 w-6 rounded bg-slate-800/10" />
                                                                <div className="h-2 w-6 rounded bg-slate-800/10" />
                                                            </div>
                                                        </div>

                                                        <div className="mt-1">
                                                            <div className="text-xs font-bold text-slate-800 truncate">
                                                                {site.name}
                                                            </div>
                                                            <div className="mt-0.5 h-1.5 w-32 rounded bg-slate-400/20" />
                                                        </div>

                                                        {/* Preview mini cards */}
                                                        {isStore ? (
                                                            <div className="mt-1 grid grid-cols-3 gap-1.5">
                                                                <div className="rounded bg-white/90 p-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <div className="h-5 rounded bg-amber-100" />
                                                                    <div className="mt-1 h-1 w-full rounded bg-slate-200" />
                                                                </div>
                                                                <div className="rounded bg-white/90 p-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <div className="h-5 rounded bg-emerald-100" />
                                                                    <div className="mt-1 h-1 w-full rounded bg-slate-200" />
                                                                </div>
                                                                <div className="rounded bg-white/90 p-1 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <div className="h-5 rounded bg-indigo-100" />
                                                                    <div className="mt-1 h-1 w-full rounded bg-slate-200" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 grid grid-cols-2 gap-1.5">
                                                                <div className="rounded bg-white/90 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <div className="h-1.5 w-10 rounded bg-slate-400/40" />
                                                                    <div className="mt-1 h-1 w-14 rounded bg-slate-200" />
                                                                </div>
                                                                <div className="rounded bg-white/90 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                                                    <div className="h-1.5 w-10 rounded bg-slate-400/40" />
                                                                    <div className="mt-1 h-1 w-14 rounded bg-slate-200" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Hover Quick Action Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                                                        {isPublished && (
                                                            <a
                                                                href={route("public.site", { siteSlug: site.slug })}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md transition hover:bg-slate-100"
                                                            >
                                                                Live View
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        <Link
                                                            href={route("sites.edit", site.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-teal-900"
                                                        >
                                                            Studio
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="flex flex-1 flex-col justify-between p-5">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <h3
                                                                className="text-lg font-bold text-slate-900 transition-colors group-hover:text-teal-800 truncate"
                                                                title={site.name}
                                                            >
                                                                {site.name}
                                                            </h3>
                                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                                <span className="truncate font-medium text-slate-600">
                                                                    {site.slug}.{siteDomain}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    title="Copy site address"
                                                                    onClick={(e) => copySiteUrl(site.slug, e)}
                                                                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                                >
                                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Wix 3-Dots Action Menu */}
                                                        <div className="relative shrink-0">
                                                            <button
                                                                type="button"
                                                                title="Site options"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuSiteId(isMenuOpen ? null : site.id);
                                                                }}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                            >
                                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                </svg>
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {isMenuOpen && (
                                                                <div
                                                                    ref={menuRef}
                                                                    className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                                                                >
                                                                    {isPublished && (
                                                                        <a
                                                                            href={route("public.site", { siteSlug: site.slug })}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                        >
                                                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                            </svg>
                                                                            View Live Site
                                                                        </a>
                                                                    )}
                                                                    <Link
                                                                        href={route("sites.admin", site.id)}
                                                                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                    >
                                                                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                                        </svg>
                                                                        Site Dashboard
                                                                    </Link>
                                                                    <Link
                                                                        href={route("sites.edit", site.id)}
                                                                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                    >
                                                                        <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                        </svg>
                                                                        Edit in Studio
                                                                    </Link>

                                                                    {isStore && (
                                                                        <>
                                                                            <div className="my-1 border-t border-slate-100" />
                                                                            <Link
                                                                                href={route("commerce.hub", site.id)}
                                                                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50"
                                                                            >
                                                                                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                                </svg>
                                                                                Commerce Hub
                                                                            </Link>
                                                                            <Link
                                                                                href={route("products.index", site.id)}
                                                                                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                            </svg>
                                                                            Products Catalogue
                                                                        </Link>
                                                                        <Link
                                                                            href={route("orders.index", site.id)}
                                                                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                        >
                                                                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                            </svg>
                                                                            Customer Orders
                                                                        </Link>
                                                                    </>
                                                                )}

                                                                <div className="my-1 border-t border-slate-100" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenMenuSiteId(null);
                                                                        copySiteUrl(site.slug);
                                                                    }}
                                                                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-start text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                    Copy Site Address
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Metrics Row */}
                                                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1.5" title="Catalog products">
                                                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        <span>{site.products_count ?? 0} products</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5" title="Customer orders">
                                                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                        <span>{site.orders_count ?? 0} orders</span>
                                                    </div>

                                                    {site.pages_count !== undefined && (
                                                        <div className="flex items-center gap-1.5" title="Pages">
                                                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span>{site.pages_count} pages</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unified 2-Button Action Row (Consistent height across ALL cards!) */}
                                            <div className="mt-5 grid grid-cols-2 gap-2.5">
                                                {isStore ? (
                                                    <Link
                                                        href={route("commerce.hub", site.id)}
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 hover:border-amber-400"
                                                    >
                                                        <svg className="h-3.5 w-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                        </svg>
                                                        Commerce hub
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={route("sites.edit", site.id)}
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300"
                                                    >
                                                        <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        Studio editor
                                                    </Link>
                                                )}

                                                <Link
                                                    href={route("sites.admin", site.id)}
                                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-teal-900"
                                                >
                                                    Manage site
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        /* Wix-Style List/Table Mode */
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th scope="col" className="px-6 py-4">Site</th>
                                            <th scope="col" className="px-6 py-4">Type</th>
                                            <th scope="col" className="px-6 py-4">Status</th>
                                            <th scope="col" className="px-6 py-4">Inventory & Orders</th>
                                            <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredSites.map((site) => {
                                            const isStore = site.type === "store";
                                            const isPublished = site.status === "published";
                                            return (
                                                <tr key={site.id} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700">
                                                                {site.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 truncate max-w-xs" title={site.name}>
                                                                    {site.name}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                    <span>{site.slug}.{siteDomain}</span>
                                                                    <button
                                                                        type="button"
                                                                        title="Copy address"
                                                                        onClick={(e) => copySiteUrl(site.slug, e)}
                                                                        className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                                                                    >
                                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            {isStore ? "Online store" : "Business site"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                                                isPublished
                                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                                                    : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                                                            }`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-600" : "bg-amber-600"}`} />
                                                            {site.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-xs">
                                                        <div className="font-semibold text-slate-800">
                                                            {site.products_count ?? 0} products · {site.orders_count ?? 0} orders
                                                        </div>
                                                        {site.pages_count !== undefined && (
                                                            <div className="text-slate-400">{site.pages_count} pages</div>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isPublished && (
                                                                <a
                                                                    href={route("public.site", { siteSlug: site.slug })}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    title="View live site"
                                                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                            <Link
                                                                href={route("sites.edit", site.id)}
                                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Studio
                                                            </Link>
                                                            {isStore && (
                                                                <Link
                                                                    href={route("commerce.hub", site.id)}
                                                                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                                                                >
                                                                    Commerce
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={route("sites.admin", site.id)}
                                                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-900"
                                                            >
                                                                Manage
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : totalSites > 0 ? (
                    /* Filter Zero-State */
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">No websites match your filter</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Try clearing your search query or switching your category filter.
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setTypeFilter("all");
                                    setStatusFilter("all");
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Completely Empty State (No sites at all yet) */
                    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-8 ring-teal-50/50">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                            Your first website starts here
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Build something memorable. Answer a few questions and our AI generator will prepare a polished storefront draft ready to publish.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link
                                href={route("sites.create")}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                Start Building
                            </Link>
                            <button
                                type="button"
                                onClick={() => { setShowTemplatesModal(true); setSelectedTemplate(null); }}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                Browse Templates
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>

        {/* ===== TEMPLATE PREVIEW MODAL ===== */}
        {showTemplatesModal && (
            <div
                className="fixed inset-0 z-50 flex items-stretch"
                aria-modal="true"
                role="dialog"
                aria-label="Browse Templates"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => { setShowTemplatesModal(false); setSelectedTemplate(null); }}
                />

                {/* Panel */}
                <div className="relative ml-auto flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shrink-0">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Website Templates</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Pick a template — then customise every word, color, and section.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowTemplatesModal(false); setSelectedTemplate(null); }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Close templates panel"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-6 py-3 shrink-0 overflow-x-auto">
                        {templateCategories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setTemplateCategoryFilter(cat)}
                                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                                    templateCategoryFilter === cat
                                        ? "bg-teal-800 text-white shadow-sm"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-teal-400 hover:text-teal-800"
                                }`}
                            >
                                {cat === "all" ? `All (${templates.length})` : cat}
                            </button>
                        ))}
                    </div>

                    {/* Body: List + Detail */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Template List */}
                        <div className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
                            {filteredTemplates.length === 0 ? (
                                <div className="py-16 text-center text-sm text-slate-400">No templates in this category.</div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {filteredTemplates.map(template => {
                                        const col = getCategoryColor(template.category);
                                        const isActive = selectedTemplate?.id === template.id;
                                        return (
                                            <li key={template.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTemplate(template)}
                                                    className={`w-full text-left px-5 py-4 transition ${
                                                        isActive
                                                            ? "bg-teal-50 border-l-2 border-teal-700"
                                                            : "hover:bg-slate-50 border-l-2 border-transparent"
                                                    }`}
                                                >
                                                    {/* Mini visual preview block */}
                                                    <div
                                                        className="mb-3 h-24 w-full overflow-hidden rounded-xl border border-slate-200"
                                                        style={{
                                                            background: template.theme.background || template.theme.primary || "#f1f5f9",
                                                        } as CSSProperties}
                                                    >
                                                        <div className="p-2 h-full flex flex-col gap-1.5">
                                                            {/* Fake browser bar */}
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                            </div>
                                                            {/* Fake nav */}
                                                            <div className="flex items-center gap-1">
                                                                <div className="h-2 w-10 rounded" style={{ background: template.theme.primary || "#64748b", opacity: 0.9 }} />
                                                                <div className="ml-auto flex gap-1">
                                                                    <div className="h-1.5 w-5 rounded bg-white/60" />
                                                                    <div className="h-1.5 w-5 rounded bg-white/60" />
                                                                </div>
                                                            </div>
                                                            {/* Fake hero */}
                                                            <div className="flex-1 rounded" style={{ background: template.theme.primary ? template.theme.primary + "33" : "rgba(255,255,255,0.4)" }} />
                                                            {/* Fake cta */}
                                                            <div className="h-3 w-12 rounded" style={{ background: template.theme.accent || template.theme.primary || "#0f766e" }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-bold text-sm text-slate-900 truncate">{template.name}</p>
                                                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${col.bg} ${col.text}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                                                            {template.category}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{template.description}</p>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Detail / Preview Pane */}
                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            {selectedTemplate ? (
                                <div className="flex h-full flex-col">
                                    {/* Detail header */}
                                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-7 py-5 shrink-0">
                                        <div>
                                            {(() => { const col = getCategoryColor(selectedTemplate.category); return (
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${col.bg} ${col.text} mb-2`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                                                    {selectedTemplate.category}
                                                </span>
                                            ); })()}
                                            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{selectedTemplate.name}</h3>
                                            <p className="mt-1.5 text-sm text-slate-500 max-w-lg">{selectedTemplate.description}</p>
                                        </div>
                                        <Link
                                            href={route("sites.create", { template: selectedTemplate.id })}
                                            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900"
                                        >
                                            Use this template
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>

                                    {/* Full-size visual mock */}
                                    <div className="flex-1 p-6">
                                        <div
                                            className="w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                                            style={{ background: selectedTemplate.theme.background || "#f8fafc" } as CSSProperties}
                                        >
                                            {/* Browser chrome */}
                                            <div className="flex items-center gap-2 border-b border-slate-200/60 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
                                                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                                                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                                                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                                                <div className="ml-3 flex-1 rounded-md bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-500 text-center">
                                                    yoursite.nirmaan.site
                                                </div>
                                            </div>

                                            {/* Page mockup body */}
                                            <div className="p-0">
                                                {/* Nav */}
                                                <div className="flex items-center justify-between px-8 py-4" style={{ background: selectedTemplate.theme.primary || "#1e293b" }}>
                                                    <div className="h-5 w-24 rounded" style={{ background: "rgba(255,255,255,0.9)" }} />
                                                    <div className="flex gap-4">
                                                        {["Home", "About", "Contact"].map(n => (
                                                            <div key={n} className="h-3 w-10 rounded" style={{ background: "rgba(255,255,255,0.6)" }} />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Hero */}
                                                <div className="flex flex-col items-center justify-center py-16 px-8 text-center" style={{ background: selectedTemplate.theme.background || "#f1f5f9" }}>
                                                    <div className="h-6 w-48 rounded mb-3" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.8 }} />
                                                    <div className="h-4 w-72 rounded mb-2" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.35 }} />
                                                    <div className="h-4 w-56 rounded mb-6" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.25 }} />
                                                    <div className="h-10 w-36 rounded-xl" style={{ background: selectedTemplate.theme.accent || selectedTemplate.theme.primary || "#0f766e" }} />
                                                </div>

                                                {/* Feature cards */}
                                                <div className="grid grid-cols-3 gap-4 px-8 py-8 bg-white">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="rounded-xl border border-slate-100 p-4 shadow-sm">
                                                            <div className="h-10 w-10 rounded-lg mb-3" style={{ background: (selectedTemplate.theme.accent || selectedTemplate.theme.primary || "#0f766e") + "22" }} />
                                                            <div className="h-3 w-20 rounded mb-2" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.7 }} />
                                                            <div className="h-2 w-full rounded mb-1" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.2 }} />
                                                            <div className="h-2 w-3/4 rounded" style={{ background: selectedTemplate.theme.primary || "#1e293b", opacity: 0.15 }} />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between px-8 py-5" style={{ background: selectedTemplate.theme.primary || "#1e293b" }}>
                                                    <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.5)" }} />
                                                    <div className="flex gap-3">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-3 w-8 rounded" style={{ background: "rgba(255,255,255,0.35)" }} />)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Feature highlight for the category */}
                                        <div className="mt-6 grid grid-cols-2 gap-4">
                                            {(selectedTemplate.category.toLowerCase().includes("store") || selectedTemplate.category.toLowerCase().includes("commerce") || selectedTemplate.category.toLowerCase().includes("shop")) ? (
                                                <>
                                                    {[
                                                        { icon: "🛒", title: "Product Catalogue", desc: "Showcase your products with photos, prices, and stock tracking." },
                                                        { icon: "💳", title: "Online Checkout", desc: "Secure payment flow with cart, checkout, and order confirmation." },
                                                        { icon: "📦", title: "Order Management", desc: "Track every order, manage fulfilment, and update order status." },
                                                        { icon: "📊", title: "Sales Analytics", desc: "Revenue reports, best sellers, and conversion insights." },
                                                    ].map(f => (
                                                        <div key={f.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                                            <span className="text-2xl">{f.icon}</span>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-800">{f.title}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    {[
                                                        { icon: "📋", title: "Service Pages", desc: "Present your services, team, and expertise with structured pages." },
                                                        { icon: "📬", title: "Contact & Enquiry", desc: "Built-in enquiry forms and contact info for lead generation." },
                                                        { icon: "🌐", title: "SEO Ready", desc: "Meta tags, sitemap and clean URLs to help customers find you." },
                                                        { icon: "✨", title: "AI Content", desc: "Generate and refine copy, headlines, and sections with AI." },
                                                    ].map(f => (
                                                        <div key={f.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                                            <span className="text-2xl">{f.icon}</span>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-800">{f.title}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-6 flex justify-center">
                                            <Link
                                                href={route("sites.create", { template: selectedTemplate.id })}
                                                className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-teal-900"
                                            >
                                                Start with {selectedTemplate.name}
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Empty state when no template selected */
                                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-4xl">
                                        🎨
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Pick a template to preview</h3>
                                        <p className="mt-1 text-sm text-slate-500 max-w-sm">
                                            Select any template from the left to see a live preview, features, and use it for your new site.
                                        </p>
                                    </div>
                                    {filteredTemplates.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTemplate(filteredTemplates[0])}
                                            className="rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
                                        >
                                            Preview first template →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </AuthenticatedLayout>
);
}
