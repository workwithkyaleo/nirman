import WixLayout from "@/Layouts/WixLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useState, FormEvent } from "react";

type Site = {
    id: number; name: string; slug: string; type: string; status: string;
    currency: string; description: string | null; phone: string | null;
    email: string | null; address: string | null; map_url: string | null;
    whatsapp: string | null; logo_path: string | null; published_at: string | null;
    can_manage: boolean; can_manage_store: boolean;
    business_hours: { display?: string } | null;
    social_links: Record<string, string | null> | null;
    seo: Record<string, string | null> | null;
    notifications: Record<string, boolean> | null;
};
type Member = { id: number; name: string; email: string; role: string };
type Props  = { site: Site; members: Member[] };

// ── Reusable field components ─────────────────────────────────────────────────
function SField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#263c36]">{label}</label>
            {children}
            {hint && <p className="text-xs text-[#84918d]">{hint}</p>}
        </div>
    );
}

function SInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full rounded-xl border border-[#d5dcd8] bg-white px-3.5 py-2.5 text-sm text-[#17201e] placeholder-[#aab3af] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15 disabled:bg-slate-50 disabled:text-slate-400 ${props.className ?? ""}`}
        />
    );
}

function STextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={`w-full rounded-xl border border-[#d5dcd8] bg-white px-3.5 py-2.5 text-sm text-[#17201e] placeholder-[#aab3af] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15 resize-none ${props.className ?? ""}`}
        />
    );
}

function SToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e0e5e2] bg-white px-4 py-3.5 hover:bg-slate-50 transition">
            <span className="text-sm font-medium text-[#263c36]">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#0f766e]" : "bg-slate-200"}`}
            >
                <span className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} style={{ height: 18, width: 18 }} />
            </button>
        </label>
    );
}

function SaveBtn({ processing, label = "Save changes" }: { processing: boolean; label?: string }) {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#173f37] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#225d50] disabled:opacity-60"
            >
                {processing ? (
                    <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving…
                    </>
                ) : label}
            </button>
        </div>
    );
}

function SCard({ id, icon, title, desc, children }: { id?: string; icon: string; title: string; desc: string; children: React.ReactNode }) {
    return (
        <section id={id} className="overflow-hidden rounded-2xl border border-[#e0e5e2] bg-white shadow-sm">
            <div className="border-b border-[#e9eeeb] px-6 py-5">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                        <h2 className="text-base font-bold text-[#17201e]">{title}</h2>
                        <p className="mt-0.5 text-xs text-[#84918d]">{desc}</p>
                    </div>
                </div>
            </div>
            <div className="px-6 py-5 space-y-5">{children}</div>
        </section>
    );
}

const CURRENCIES = [
    { code: "NPR", label: "NPR — Nepalese Rupee" },
    { code: "USD", label: "USD — US Dollar" },
    { code: "EUR", label: "EUR — Euro" },
    { code: "GBP", label: "GBP — British Pound" },
    { code: "INR", label: "INR — Indian Rupee" },
    { code: "AUD", label: "AUD — Australian Dollar" },
];

const ROLE_LABELS: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
};

const ROBOTS_OPTIONS = [
    { value: "index,follow",    label: "Index & Follow (recommended)" },
    { value: "noindex,nofollow",label: "No Index, No Follow" },
    { value: "noindex,follow",  label: "No Index, Follow" },
    { value: "index,nofollow",  label: "Index, No Follow" },
];

// ── Section nav tabs ──────────────────────────────────────────────────────────
const SECTIONS = [
    { key: "general",       icon: "🏠", label: "General Info" },
    { key: "contact",       icon: "📞", label: "Contact & Location" },
    { key: "social",        icon: "🔗", label: "Social Profiles" },
    { key: "seo",           icon: "🔍", label: "SEO & Analytics" },
    { key: "identity",      icon: "🎨", label: "Logo & Identity" },
    { key: "notifications", icon: "🔔", label: "Notifications" },
    { key: "team",          icon: "👥", label: "Team & Roles" },
    { key: "danger",        icon: "⚠️", label: "Danger Zone" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

export default function Settings({ site, members }: Props) {
    const [activeSection, setActiveSection] = useState<SectionKey>("general");

    // ── General form ──────────────────────────────────────────────────────────
    const general = useForm({
        section: "general",
        name: site.name ?? "",
        description: site.description ?? "",
        currency: site.currency ?? "NPR",
    });

    // ── Contact form ──────────────────────────────────────────────────────────
    const contact = useForm({
        section: "contact",
        phone: site.phone ?? "",
        email: site.email ?? "",
        whatsapp: site.whatsapp ?? "",
        address: site.address ?? "",
        map_url: site.map_url ?? "",
        opening_hours: site.business_hours?.display ?? "",
    });

    // ── Social form ───────────────────────────────────────────────────────────
    const social = useForm({
        section: "social",
        facebook:  site.social_links?.facebook  ?? "",
        instagram: site.social_links?.instagram ?? "",
        tiktok:    site.social_links?.tiktok    ?? "",
        youtube:   site.social_links?.youtube   ?? "",
        linkedin:  site.social_links?.linkedin  ?? "",
        twitter:   site.social_links?.twitter   ?? "",
        website:   site.social_links?.website   ?? "",
    });

    // ── SEO form ──────────────────────────────────────────────────────────────
    const seo = useForm({
        section: "seo",
        seo: {
            meta_title:       site.seo?.meta_title       ?? "",
            meta_description: site.seo?.meta_description ?? "",
            og_title:         site.seo?.og_title         ?? "",
            og_description:   site.seo?.og_description   ?? "",
            google_analytics: site.seo?.google_analytics ?? "",
            facebook_pixel:   site.seo?.facebook_pixel   ?? "",
            robots:           site.seo?.robots            ?? "index,follow",
        },
    });

    // ── Notifications form ────────────────────────────────────────────────────
    const notif = useForm({
        section: "notifications",
        notifications: {
            order_email:   site.notifications?.order_email   ?? true,
            enquiry_email: site.notifications?.enquiry_email ?? true,
            digest_email:  site.notifications?.digest_email  ?? false,
        },
    });

    const submit = (form: any, e?: FormEvent) => {
        e?.preventDefault();
        form.patch(route("sites.settings.update", site.id), { preserveScroll: true });
    };

    return (
        <WixLayout site={site} activeSection="settings" title="Settings">
            <Head title={`Settings · ${site.name}`} />

            <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">

                {/* ── Page Header ── */}
                <div className="mb-7">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e]">Site Settings</p>
                    <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#17201e]">{site.name}</h1>
                    <p className="mt-1 text-sm text-[#84918d]">Manage your site's general info, contact details, SEO, and team access.</p>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

                    {/* ── LEFT NAV ── */}
                    <nav className="shrink-0 lg:w-56" aria-label="Settings sections">
                        <ul className="space-y-0.5 rounded-2xl border border-[#e0e5e2] bg-white p-2 shadow-sm lg:sticky lg:top-20">
                            {SECTIONS.map(s => (
                                <li key={s.key}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(s.key)}
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                                            activeSection === s.key
                                                ? "bg-[#173f37] text-white"
                                                : "text-[#53645f] hover:bg-[#f0f5f2] hover:text-[#173f37]"
                                        }`}
                                    >
                                        <span className="text-base">{s.icon}</span>
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* ── CONTENT PANELS ── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* GENERAL INFO */}
                        {activeSection === "general" && (
                            <SCard id="general" icon="🏠" title="General Info" desc="Your business name, description, and default currency.">
                                <form onSubmit={e => submit(general, e)} className="space-y-5">
                                    <SField label="Business / Site Name" hint="Shown in browser tabs, emails, and receipts.">
                                        <SInput value={general.data.name} maxLength={120} onChange={e => general.setData("name", e.target.value)} placeholder="e.g. My Awesome Business" />
                                        {general.errors.name && <p className="text-xs text-rose-600">{general.errors.name}</p>}
                                    </SField>
                                    <SField label="Description" hint="Used on search results and the SEO social share preview.">
                                        <STextarea rows={4} value={general.data.description} maxLength={1500} onChange={e => general.setData("description", e.target.value)} placeholder="A brief description of your business or website…" />
                                        <p className="text-right text-[10px] text-slate-400">{general.data.description.length}/1500</p>
                                    </SField>
                                    <SField label="Default Currency" hint="Used for product prices and order totals.">
                                        <select
                                            value={general.data.currency}
                                            onChange={e => general.setData("currency", e.target.value)}
                                            className="w-full rounded-xl border border-[#d5dcd8] bg-white px-3.5 py-2.5 text-sm text-[#17201e] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"
                                        >
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                        </select>
                                    </SField>

                                    {/* Site URL (read-only) */}
                                    <SField label="Site URL" hint="Your site's public web address — change it in the Studio.">
                                        <div className="flex items-center gap-2">
                                            <SInput value={`${site.slug}.nirmaan.site`} disabled readOnly className="flex-1 bg-slate-50 text-slate-400" />
                                            {site.status === "published" && (
                                                <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-[#0f766e] hover:bg-slate-50 transition whitespace-nowrap"
                                                >
                                                    View site ↗
                                                </a>
                                            )}
                                        </div>
                                    </SField>

                                    {/* Status badge */}
                                    <div className="flex items-center justify-between rounded-xl border border-[#e0e5e2] bg-slate-50 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-[#263c36]">Publish Status</p>
                                            <p className="text-xs text-[#84918d]">{site.status === "published" ? `Live since ${new Date(site.published_at!).toLocaleDateString()}` : "Draft — not visible to the public"}</p>
                                        </div>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${site.status === "published" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"}`}>
                                            {site.status === "published" ? "Live" : "Draft"}
                                        </span>
                                    </div>

                                    <SaveBtn processing={general.processing} />
                                </form>
                            </SCard>
                        )}

                        {/* CONTACT & LOCATION */}
                        {activeSection === "contact" && (
                            <SCard id="contact" icon="📞" title="Contact & Location" desc="Phone, email, WhatsApp, address, and opening hours shown to visitors.">
                                <form onSubmit={e => submit(contact, e)} className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <SField label="Phone Number">
                                            <SInput type="tel" value={contact.data.phone} onChange={e => contact.setData("phone", e.target.value)} placeholder="+977 98xxxxxxxx" />
                                        </SField>
                                        <SField label="Email Address">
                                            <SInput type="email" value={contact.data.email} onChange={e => contact.setData("email", e.target.value)} placeholder="hello@yourbusiness.com" />
                                        </SField>
                                        <SField label="WhatsApp Number" hint="Include country code, e.g. +977 98xxxxxxxx">
                                            <SInput type="tel" value={contact.data.whatsapp} onChange={e => contact.setData("whatsapp", e.target.value)} placeholder="+977 98xxxxxxxx" />
                                        </SField>
                                        <SField label="Opening Hours" hint='e.g. "Sun–Fri 9am–6pm"'>
                                            <SInput value={contact.data.opening_hours} onChange={e => contact.setData("opening_hours", e.target.value)} placeholder="Sun–Fri, 9am–6pm" />
                                        </SField>
                                    </div>
                                    <SField label="Business Address" hint="Shown in the footer and contact section of your site.">
                                        <STextarea rows={3} value={contact.data.address} onChange={e => contact.setData("address", e.target.value)} placeholder="Thamel, Kathmandu, Nepal" />
                                    </SField>
                                    <SField label="Google Maps URL" hint="Paste a shareable Google Maps link for your location pin.">
                                        <SInput type="url" value={contact.data.map_url} onChange={e => contact.setData("map_url", e.target.value)} placeholder="https://maps.google.com/…" />
                                    </SField>
                                    <SaveBtn processing={contact.processing} />
                                </form>
                            </SCard>
                        )}

                        {/* SOCIAL PROFILES */}
                        {activeSection === "social" && (
                            <SCard id="social" icon="🔗" title="Social Profiles" desc="Links to your social media pages — displayed in the site footer and contact sections.">
                                <form onSubmit={e => submit(social, e)} className="space-y-4">
                                    {[
                                        { key: "facebook",  label: "Facebook",  icon: "📘", placeholder: "https://facebook.com/yourpage" },
                                        { key: "instagram", label: "Instagram", icon: "📷", placeholder: "https://instagram.com/yourhandle" },
                                        { key: "tiktok",    label: "TikTok",    icon: "🎵", placeholder: "https://tiktok.com/@yourhandle" },
                                        { key: "youtube",   label: "YouTube",   icon: "📺", placeholder: "https://youtube.com/@yourchannel" },
                                        { key: "linkedin",  label: "LinkedIn",  icon: "💼", placeholder: "https://linkedin.com/company/yourco" },
                                        { key: "twitter",   label: "X / Twitter", icon: "🐦", placeholder: "https://x.com/yourhandle" },
                                        { key: "website",   label: "Other Website", icon: "🌐", placeholder: "https://yoursite.com" },
                                    ].map(({ key, label, icon, placeholder }) => (
                                        <SField key={key} label={`${icon} ${label}`}>
                                            <SInput
                                                type="url"
                                                value={(social.data as any)[key]}
                                                onChange={e => social.setData(key as any, e.target.value)}
                                                placeholder={placeholder}
                                            />
                                        </SField>
                                    ))}
                                    <SaveBtn processing={social.processing} />
                                </form>
                            </SCard>
                        )}

                        {/* SEO & ANALYTICS */}
                        {activeSection === "seo" && (
                            <>
                                <SCard id="seo" icon="🔍" title="SEO Settings" desc="Control how your site appears in Google search results.">
                                    <form onSubmit={e => submit(seo, e)} className="space-y-5">
                                        <SField label="Meta Title" hint={`${(seo.data.seo.meta_title ?? "").length}/70 chars — shown in browser tab and Google result.`}>
                                            <SInput
                                                value={seo.data.seo.meta_title ?? ""}
                                                maxLength={70}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, meta_title: e.target.value })}
                                                placeholder={`${site.name} — Your Tagline`}
                                            />
                                        </SField>
                                        <SField label="Meta Description" hint={`${(seo.data.seo.meta_description ?? "").length}/160 chars — shown below your title in search results.`}>
                                            <STextarea
                                                rows={3}
                                                value={seo.data.seo.meta_description ?? ""}
                                                maxLength={160}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, meta_description: e.target.value })}
                                                placeholder="A clear, concise description of what your site offers…"
                                            />
                                        </SField>

                                        {/* SEO Preview */}
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Google preview</p>
                                            <p className="text-[#1a0dab] text-sm font-medium truncate hover:underline cursor-pointer">
                                                {seo.data.seo.meta_title || site.name || "Page Title"}
                                            </p>
                                            <p className="text-[#006621] text-xs mt-0.5">{site.slug}.nirmaan.site</p>
                                            <p className="text-[#545454] text-xs mt-1 line-clamp-2">
                                                {seo.data.seo.meta_description || "Your page description will appear here. Make it compelling and under 160 characters."}
                                            </p>
                                        </div>

                                        <SField label="Robots Directive" hint="Controls whether search engines index this site.">
                                            <select
                                                value={seo.data.seo.robots ?? "index,follow"}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, robots: e.target.value })}
                                                className="w-full rounded-xl border border-[#d5dcd8] bg-white px-3.5 py-2.5 text-sm text-[#17201e] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"
                                            >
                                                {ROBOTS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </SField>
                                        <SaveBtn processing={seo.processing} label="Save SEO settings" />
                                    </form>
                                </SCard>

                                {/* Social Share */}
                                <SCard id="social-share" icon="📣" title="Social Share (OG Tags)" desc="Customise how your site looks when shared on Facebook, WhatsApp, or LinkedIn.">
                                    <form onSubmit={e => submit(seo, e)} className="space-y-5">
                                        <SField label="OG Title" hint="Title shown when your link is shared on social media.">
                                            <SInput
                                                value={seo.data.seo.og_title ?? ""}
                                                maxLength={95}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, og_title: e.target.value })}
                                                placeholder={site.name}
                                            />
                                        </SField>
                                        <SField label="OG Description">
                                            <STextarea
                                                rows={3}
                                                value={seo.data.seo.og_description ?? ""}
                                                maxLength={200}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, og_description: e.target.value })}
                                                placeholder="What your business is about…"
                                            />
                                        </SField>
                                        {/* Social preview card */}
                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                            <div className="h-24 bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-4xl">🌐</div>
                                            <div className="px-4 py-3">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400">nirmaan.site</p>
                                                <p className="font-bold text-sm text-slate-900 mt-0.5">{seo.data.seo.og_title || site.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{seo.data.seo.og_description || "Your site description."}</p>
                                            </div>
                                        </div>
                                        <SaveBtn processing={seo.processing} label="Save social settings" />
                                    </form>
                                </SCard>

                                {/* Analytics */}
                                <SCard id="analytics" icon="📊" title="Analytics & Tracking" desc="Connect Google Analytics, Facebook Pixel, or other tracking tools.">
                                    <form onSubmit={e => submit(seo, e)} className="space-y-5">
                                        <SField label="Google Analytics Measurement ID" hint='Starts with "G-". Found in your GA4 data stream settings.'>
                                            <SInput
                                                value={seo.data.seo.google_analytics ?? ""}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, google_analytics: e.target.value })}
                                                placeholder="G-XXXXXXXXXX"
                                            />
                                        </SField>
                                        <SField label="Facebook Pixel ID" hint="15–16 digit number from your Facebook Events Manager.">
                                            <SInput
                                                value={seo.data.seo.facebook_pixel ?? ""}
                                                onChange={e => seo.setData("seo", { ...seo.data.seo, facebook_pixel: e.target.value })}
                                                placeholder="1234567890123456"
                                            />
                                        </SField>

                                        {/* Tracking status indicators */}
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {[
                                                { label: "Google Analytics", value: seo.data.seo.google_analytics, icon: "📈" },
                                                { label: "Facebook Pixel",   value: seo.data.seo.facebook_pixel,   icon: "👍" },
                                            ].map(t => (
                                                <div key={t.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${t.value ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                                                    <span className="text-lg">{t.icon}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{t.label}</p>
                                                        <p className={`text-[11px] font-semibold ${t.value ? "text-emerald-600" : "text-slate-400"}`}>
                                                            {t.value ? "Connected ✓" : "Not connected"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <SaveBtn processing={seo.processing} label="Save tracking settings" />
                                    </form>
                                </SCard>
                            </>
                        )}

                        {/* LOGO & IDENTITY */}
                        {activeSection === "identity" && (
                            <SCard id="identity" icon="🎨" title="Logo & Identity" desc="Your brand logo shown in the site header, navbar, and emails.">
                                <div className="space-y-5">
                                    {/* Logo preview */}
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                                            {site.logo_path ? (
                                                <img src={`/storage/${site.logo_path}`} alt={site.name} className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="text-3xl font-extrabold text-slate-400">{site.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[#17201e]">{site.logo_path ? "Logo uploaded" : "No logo yet"}</p>
                                            <p className="text-xs text-[#84918d] mt-0.5">PNG, JPG, WebP or SVG · max 3 MB · recommended 400×200px</p>
                                        </div>
                                    </div>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#0f766e] bg-teal-50 px-5 py-4 text-sm font-semibold text-[#0f766e] transition hover:bg-teal-100">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {site.logo_path ? "Replace logo" : "Upload logo"}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            className="sr-only"
                                            onChange={e => {
                                                const logo = e.target.files?.[0];
                                                if (logo) router.post(route("sites.settings.logo", site.id), { logo }, { forceFormData: true, preserveScroll: true });
                                            }}
                                        />
                                    </label>

                                    {/* Favicon note */}
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-start gap-3">
                                        <span className="text-xl mt-0.5">🌐</span>
                                        <div>
                                            <p className="text-sm font-bold text-[#263c36]">Favicon</p>
                                            <p className="text-xs text-[#84918d] mt-0.5">Your logo is automatically used as the favicon (the small icon shown in browser tabs). Upload a square logo for best results.</p>
                                        </div>
                                    </div>
                                </div>
                            </SCard>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeSection === "notifications" && (
                            <SCard id="notifications" icon="🔔" title="Notifications" desc="Control which email alerts you receive for this site.">
                                <form onSubmit={e => submit(notif, e)} className="space-y-3">
                                    <SToggle
                                        checked={notif.data.notifications.order_email}
                                        onChange={v => notif.setData("notifications", { ...notif.data.notifications, order_email: v })}
                                        label="New order email notifications"
                                    />
                                    <SToggle
                                        checked={notif.data.notifications.enquiry_email}
                                        onChange={v => notif.setData("notifications", { ...notif.data.notifications, enquiry_email: v })}
                                        label="Contact form & enquiry notifications"
                                    />
                                    <SToggle
                                        checked={notif.data.notifications.digest_email}
                                        onChange={v => notif.setData("notifications", { ...notif.data.notifications, digest_email: v })}
                                        label="Weekly summary digest email"
                                    />
                                    <p className="text-xs text-[#84918d] pt-2">All notifications are sent to <span className="font-semibold">{site.email || "your account email"}</span>.</p>
                                    <SaveBtn processing={notif.processing} label="Save notification settings" />
                                </form>
                            </SCard>
                        )}

                        {/* TEAM & ROLES */}
                        {activeSection === "team" && (
                            <SCard id="team" icon="👥" title="Team & Roles" desc="People who have access to manage this site.">
                                <div className="space-y-3">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center gap-4 rounded-xl border border-[#e0e5e2] bg-white px-4 py-3.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173f37] text-sm font-bold text-white">
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[#17201e] truncate">{m.name}</p>
                                                <p className="text-xs text-[#84918d] truncate">{m.email}</p>
                                            </div>
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${
                                                m.role === "owner" ? "bg-amber-50 text-amber-700 ring-amber-600/20" :
                                                m.role === "admin" ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20" :
                                                "bg-slate-100 text-slate-600 ring-slate-400/20"
                                            }`}>
                                                {ROLE_LABELS[m.role] ?? m.role}
                                            </span>
                                        </div>
                                    ))}
                                    {members.length === 0 && (
                                        <p className="py-6 text-center text-sm text-[#84918d]">No team members found.</p>
                                    )}
                                </div>
                                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                                    <p className="text-sm font-semibold text-slate-500">Team invitations</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Invite team members from your account settings to collaborate on this site.</p>
                                </div>
                            </SCard>
                        )}

                        {/* DANGER ZONE */}
                        {activeSection === "danger" && (
                            <SCard id="danger" icon="⚠️" title="Danger Zone" desc="Irreversible actions — please proceed carefully.">
                                <div className="space-y-4">
                                    {/* Unpublish */}
                                    {site.status === "published" && (
                                        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <div>
                                                <p className="font-bold text-sm text-amber-900">Take site offline</p>
                                                <p className="text-xs text-amber-700 mt-0.5">Sets status to draft. Visitors will see a "coming soon" page.</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                                                onClick={() => {
                                                    if (confirm("Take this site offline? Visitors won't be able to see it.")) {
                                                        router.post(route("sites.publish", site.id), { action: "unpublish" }, { preserveScroll: true });
                                                    }
                                                }}
                                            >
                                                Unpublish
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete site */}
                                    <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                                        <div>
                                            <p className="font-bold text-sm text-rose-900">Delete this site</p>
                                            <p className="text-xs text-rose-700 mt-0.5">Permanently deletes all pages, sections, products, and media. Cannot be undone.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="shrink-0 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                                            onClick={() => {
                                                if (confirm(`Are you absolutely sure you want to delete "${site.name}"? This cannot be undone.`)) {
                                                    router.delete(route("sites.update", site.id), { data: { _method: "DELETE" } });
                                                }
                                            }}
                                        >
                                            Delete site
                                        </button>
                                    </div>
                                </div>
                            </SCard>
                        )}

                    </div>
                </div>
            </div>
        </WixLayout>
    );
}
