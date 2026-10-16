import { router, useForm } from "@inertiajs/react";

export default function BusinessSettings({ site }: { site: any }) {
    const form = useForm({
        name: site.name || "",
        description: site.description || "",
        phone: site.phone || "",
        email: site.email || "",
        address: site.address || "",
        map_url: site.map_url || "",
        whatsapp: site.whatsapp || "",
        opening_hours: site.business_hours?.display || "",
        facebook: site.social_links?.facebook || "",
        instagram: site.social_links?.instagram || "",
        tiktok: site.social_links?.tiktok || "",
        website: site.social_links?.website || "",
    });

    return (
        <form
            className="ns-studio-panel ns-business-settings"
            id="studio-panel-settings"
            role="tabpanel"
            aria-labelledby="studio-tab-settings"
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(route("sites.update", site.id), {
                    preserveScroll: true,
                });
            }}
        >
            <div className="ns-studio-panel-heading">
                <p className="eyebrow">Business settings</p>
                <h2>Your public details</h2>
                <p>
                    These details power contact, map and social sections across
                    your website.
                </p>
            </div>
            <div className="ns-business-logo">
                {site.logo_path ? (
                    <img
                        src={`/storage/${site.logo_path}`}
                        alt={`${site.name} logo`}
                    />
                ) : (
                    <span>{String(site.name || "N").charAt(0)}</span>
                )}
                <label>
                    Change logo
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(event) => {
                            const logo = event.target.files?.[0];
                            if (logo)
                                router.post(
                                    route("sites.logo", site.id),
                                    { logo },
                                    {
                                        forceFormData: true,
                                        preserveScroll: true,
                                    },
                                );
                        }}
                    />
                </label>
            </div>
            <label>
                Business name
                <input
                    value={form.data.name}
                    maxLength={120}
                    onChange={(e) => form.setData("name", e.target.value)}
                />
            </label>
            <label>
                Description
                <textarea
                    rows={5}
                    value={form.data.description}
                    maxLength={1500}
                    onChange={(e) =>
                        form.setData("description", e.target.value)
                    }
                />
            </label>
            <div className="ns-business-settings-grid">
                <label>
                    Phone
                    <input
                        value={form.data.phone}
                        onChange={(e) => form.setData("phone", e.target.value)}
                    />
                </label>
                <label>
                    Email
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData("email", e.target.value)}
                    />
                </label>
                <label>
                    WhatsApp
                    <input
                        value={form.data.whatsapp}
                        onChange={(e) =>
                            form.setData("whatsapp", e.target.value)
                        }
                    />
                </label>
                <label>
                    Opening hours
                    <input
                        value={form.data.opening_hours}
                        onChange={(e) =>
                            form.setData("opening_hours", e.target.value)
                        }
                    />
                </label>
            </div>
            <label>
                Address
                <textarea
                    rows={3}
                    value={form.data.address}
                    onChange={(e) => form.setData("address", e.target.value)}
                />
            </label>
            <label>
                Google Maps URL
                <input
                    type="url"
                    value={form.data.map_url}
                    placeholder="https://maps.google.com/…"
                    onChange={(e) => form.setData("map_url", e.target.value)}
                />
            </label>
            <p className="eyebrow">Social profiles</p>
            <label>
                Facebook
                <input
                    type="url"
                    value={form.data.facebook}
                    onChange={(e) => form.setData("facebook", e.target.value)}
                />
            </label>
            <label>
                Instagram
                <input
                    type="url"
                    value={form.data.instagram}
                    onChange={(e) => form.setData("instagram", e.target.value)}
                />
            </label>
            <label>
                TikTok
                <input
                    type="url"
                    value={form.data.tiktok}
                    onChange={(e) => form.setData("tiktok", e.target.value)}
                />
            </label>
            <label>
                Existing website
                <input
                    type="url"
                    value={form.data.website}
                    onChange={(e) => form.setData("website", e.target.value)}
                />
            </label>
            {Object.values(form.errors).length > 0 && (
                <p className="error-summary" role="alert">
                    Please correct the highlighted business details.
                </p>
            )}
            <button className="button button-dark" disabled={form.processing}>
                {form.processing ? "Saving…" : "Save business details"}
            </button>
        </form>
    );
}
