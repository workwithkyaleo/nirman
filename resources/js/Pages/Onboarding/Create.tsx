import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

const groups = ["Business", "Contact", "Offer", "Brand", "Finish"];
const onboardingPresets: Record<string, any> = {
    modern: { primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b" },
    elegant: { primary: "#5b3a70", secondary: "#28252e", accent: "#d9bd8b" },
    bold: { primary: "#3325c9", secondary: "#18124a", accent: "#ff5d3a" },
    minimal: { primary: "#1e2825", secondary: "#303936", accent: "#8a9690" },
    traditional: {
        primary: "#8b2e22",
        secondary: "#4c201b",
        accent: "#e1a92f",
    },
};

type TemplateOption = {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    sections: string[];
    theme: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
        style?: string;
    };
};

export default function Create({
    templates = [],
    selectedTemplateId = null,
}: {
    templates?: TemplateOption[];
    selectedTemplateId?: number | null;
}) {
    const initialTemplate =
        templates.find((template) => template.id === selectedTemplateId) ??
        templates[0];
    const [step, setStep] = useState(0);
    const [stepError, setStepError] = useState("");
    const form = useForm<any>({
        name: "",
        type: "business",
        company_count: 1,
        template_id: initialTemplate?.id ?? "",
        category: "",
        description: "",
        target_customers: "",
        address: "",
        map_url: "",
        phone: "",
        email: "",
        whatsapp: "",
        facebook: "",
        instagram: "",
        tiktok: "",
        website: "",
        opening_hours: "",
        services: "",
        unique_value: "",
        primary: initialTemplate?.theme.primary ?? "#0f766e",
        secondary: initialTemplate?.theme.secondary ?? "#134e4a",
        accent: initialTemplate?.theme.accent ?? "#f59e0b",
        style: initialTemplate?.theme.style ?? "modern",
        language: "en",
        currency: "NPR",
        ordering: false,
        logo: null,
    });
    const input = (
        key: string,
        label: string,
        placeholder: string,
        type = "text",
    ) => (
        <label>
            {label}
            <input
                type={type}
                value={form.data[key]}
                onChange={(e) => form.setData(key, e.target.value)}
                placeholder={placeholder}
            />
            {form.errors[key] && (
                <small className="field-error">{form.errors[key]}</small>
            )}
        </label>
    );
    const requiredByStep = [
        ["name", "category", "description", "target_customers"],
        ["phone", "email", "address"],
        ["services", "unique_value"],
        ["template_id"],
        [],
    ];
    const fieldStep: Record<string, number> = {
        name: 0,
        type: 0,
        company_count: 0,
        template_id: 3,
        category: 0,
        description: 0,
        target_customers: 0,
        address: 1,
        map_url: 1,
        phone: 1,
        email: 1,
        whatsapp: 1,
        facebook: 1,
        instagram: 1,
        tiktok: 1,
        website: 1,
        opening_hours: 1,
        services: 2,
        unique_value: 2,
        ordering: 2,
        logo: 3,
        primary: 3,
        secondary: 3,
        accent: 3,
        style: 3,
        language: 4,
        currency: 4,
    };
    const next = () => {
        if (
            step === 0 &&
            form.data.type === "business" &&
            Number(form.data.company_count) < 1
        ) {
            setStepError("Please enter how many companies you run.");
            return;
        }
        const missing = requiredByStep[step].find(
            (key) => !String(form.data[key] ?? "").trim(),
        );
        if (missing) {
            setStepError(
                "Please complete the required information on this step.",
            );
            return;
        }
        setStepError("");
        setStep(Math.min(4, step + 1));
    };
    return (
        <AuthenticatedLayout
            header={
                <>
                    <p className="eyebrow">New website</p>
                    <h1 className="text-3xl font-bold">
                        Help AI understand your business
                    </h1>
                </>
            }
        >
            <Head title="Create website" />
            <main className="onboarding-shell py-10">
                <div className="wizard-progress">
                    {groups.map((g, i) => (
                        <button
                            type="button"
                            key={g}
                            className={
                                i === step ? "active" : i < step ? "done" : ""
                            }
                            onClick={() =>
                                i <= step
                                    ? (setStepError(""), setStep(i))
                                    : undefined
                            }
                        >
                            <span>{i < step ? "✓" : i + 1}</span>
                            <b>{g}</b>
                        </button>
                    ))}
                </div>
                <form
                    className="form-card onboarding-card"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route("sites.store"), {
                            forceFormData: true,
                            onError: (errors) => {
                                const first = Object.keys(errors)[0];
                                if (first) setStep(fieldStep[first] ?? 0);
                                setStepError(
                                    "Please correct the highlighted information.",
                                );
                            },
                        });
                    }}
                >
                    {step === 0 && (
                        <fieldset>
                            <legend>What are we building?</legend>
                            <p className="form-intro">
                                The more specific you are, the more personal
                                your first draft becomes.
                            </p>
                            <div className="choice-grid">
                                <button
                                    type="button"
                                    className={
                                        form.data.type === "business"
                                            ? "choice active"
                                            : "choice"
                                    }
                                    onClick={() =>
                                        form.setData("type", "business")
                                    }
                                >
                                    <b>Business website</b>
                                    <span>
                                        Services, enquiries and bookings
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className={
                                        form.data.type === "store"
                                            ? "choice active"
                                            : "choice"
                                    }
                                    onClick={() =>
                                        form.setData("type", "store")
                                    }
                                >
                                    <b>Online store</b>
                                    <span>Products, checkout and orders</span>
                                </button>
                            </div>
                            <div className="form-grid">
                                {input(
                                    "name",
                                    "Business name",
                                    "e.g. Himalayan Bloom",
                                )}
                                {input(
                                    "category",
                                    "Business category",
                                    "e.g. Florist, café, consultancy",
                                )}
                            </div>
                            {form.data.type === "business" && (
                                <label>
                                    How many companies do you run?
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={form.data.company_count}
                                        onChange={(e) =>
                                            form.setData(
                                                "company_count",
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <small>
                                        “Our Businesses” is added to navigation
                                        only when you run more than one company.
                                    </small>
                                    {form.errors.company_count && (
                                        <small className="field-error">
                                            {form.errors.company_count}
                                        </small>
                                    )}
                                </label>
                            )}
                            <label>
                                Describe your business
                                <textarea
                                    rows={4}
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="What do you do, where do you operate, and what should visitors remember?"
                                />
                            </label>
                            <label>
                                Who are your ideal customers?
                                <textarea
                                    rows={3}
                                    value={form.data.target_customers}
                                    onChange={(e) =>
                                        form.setData(
                                            "target_customers",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g. Busy families in Kathmandu looking for fresh weekly meals"
                                />
                            </label>
                        </fieldset>
                    )}
                    {step === 1 && (
                        <fieldset>
                            <legend>How can customers reach you?</legend>
                            <p className="form-intro">
                                These details power contact sections, maps,
                                calls and social links.
                            </p>
                            <div className="form-grid">
                                {input(
                                    "phone",
                                    "Phone number",
                                    "+977 98…",
                                    "tel",
                                )}
                                {input(
                                    "email",
                                    "Business email",
                                    "hello@business.com",
                                    "email",
                                )}
                                {input(
                                    "whatsapp",
                                    "WhatsApp number",
                                    "+977 98…",
                                    "tel",
                                )}
                                {input(
                                    "address",
                                    "Full business address",
                                    "Street, city, province",
                                )}
                            </div>
                            {input(
                                "map_url",
                                "Google Maps link",
                                "https://maps.google.com/…",
                                "url",
                            )}
                            {input(
                                "opening_hours",
                                "Business hours",
                                "Sun–Fri, 9:00 AM–6:00 PM",
                            )}
                            <div className="form-grid">
                                {input(
                                    "facebook",
                                    "Facebook page",
                                    "https://facebook.com/…",
                                    "url",
                                )}
                                {input(
                                    "instagram",
                                    "Instagram",
                                    "https://instagram.com/…",
                                    "url",
                                )}
                                {input(
                                    "tiktok",
                                    "TikTok",
                                    "https://tiktok.com/@…",
                                    "url",
                                )}
                                {input(
                                    "website",
                                    "Existing website",
                                    "https://…",
                                    "url",
                                )}
                            </div>
                        </fieldset>
                    )}
                    {step === 2 && (
                        <fieldset>
                            <legend>What do you offer?</legend>
                            <p className="form-intro">
                                Use one item per line. AI will turn these into
                                useful website sections.
                            </p>
                            <label>
                                Products or services
                                <textarea
                                    rows={6}
                                    value={form.data.services}
                                    onChange={(e) =>
                                        form.setData("services", e.target.value)
                                    }
                                    placeholder={
                                        "Wedding flower arrangements\nSame-day bouquet delivery\nWeekly office flowers"
                                    }
                                />
                            </label>
                            <label>
                                Why should someone choose you?
                                <textarea
                                    rows={4}
                                    value={form.data.unique_value}
                                    onChange={(e) =>
                                        form.setData(
                                            "unique_value",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Your experience, special process, guarantees, local knowledge or customer promise."
                                />
                            </label>
                            <label className="toggle-row">
                                <input
                                    type="checkbox"
                                    checked={form.data.ordering}
                                    onChange={(e) =>
                                        form.setData(
                                            "ordering",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <b>Accept products or online orders</b>
                                    <small>
                                        We’ll include catalogue and ordering
                                        sections.
                                    </small>
                                </span>
                            </label>
                        </fieldset>
                    )}
                    {step === 3 && (
                        <fieldset>
                            <legend>Choose your visual personality</legend>
                            <p className="form-intro">
                                Start with a complete design, then make the
                                colours and details unmistakably yours.
                            </p>
                            <div className="nirmaan-template-gallery-heading">
                                <div>
                                    <p className="eyebrow">Template library</p>
                                    <h2>Pick your starting point</h2>
                                </div>
                                <span>{templates.length} designs</span>
                            </div>
                            <div
                                className="nirmaan-template-gallery"
                                aria-label="Website templates"
                            >
                                {templates.map((template) => {
                                    const selected =
                                        Number(form.data.template_id) ===
                                        template.id;

                                    return (
                                        <button
                                            type="button"
                                            className={`nirmaan-template-card ${selected ? "is-selected" : ""}`}
                                            key={template.id}
                                            aria-pressed={selected}
                                            aria-describedby={`template-description-${template.id}`}
                                            onClick={() =>
                                                form.setData({
                                                    ...form.data,
                                                    template_id: template.id,
                                                    primary:
                                                        template.theme
                                                            .primary ??
                                                        form.data.primary,
                                                    secondary:
                                                        template.theme
                                                            .secondary ??
                                                        form.data.secondary,
                                                    accent:
                                                        template.theme.accent ??
                                                        form.data.accent,
                                                    style:
                                                        template.theme.style ??
                                                        form.data.style,
                                                })
                                            }
                                        >
                                            <span
                                                className={`nirmaan-template-preview nirmaan-template-preview--${template.slug}`}
                                                style={
                                                    {
                                                        "--template-primary":
                                                            template.theme
                                                                .primary ||
                                                            "#0f766e",
                                                        "--template-secondary":
                                                            template.theme
                                                                .secondary ||
                                                            "#134e4a",
                                                        "--template-accent":
                                                            template.theme
                                                                .accent ||
                                                            "#f59e0b",
                                                        "--template-background":
                                                            template.theme
                                                                .background ||
                                                            "#fffdf7",
                                                        "--template-text":
                                                            template.theme
                                                                .text ||
                                                            "#17201e",
                                                    } as any
                                                }
                                                aria-hidden="true"
                                            >
                                                <span className="nirmaan-template-preview__nav">
                                                    <i />
                                                    <span />
                                                    <span />
                                                    <b />
                                                </span>
                                                <span className="nirmaan-template-preview__hero">
                                                    <span>
                                                        <small />
                                                        <strong />
                                                        <span />
                                                        <i />
                                                    </span>
                                                    <b />
                                                </span>
                                                <span className="nirmaan-template-preview__sections">
                                                    <i />
                                                    <i />
                                                    <i />
                                                </span>
                                            </span>
                                            <span className="nirmaan-template-card__heading">
                                                <span>
                                                    <span>
                                                        {template.category}
                                                    </span>
                                                    <strong>
                                                        {template.name}
                                                    </strong>
                                                </span>
                                                <b aria-hidden="true">
                                                    {selected ? "✓" : ""}
                                                </b>
                                            </span>
                                            <span
                                                className="nirmaan-template-card__description"
                                                id={`template-description-${template.id}`}
                                            >
                                                {template.description}
                                            </span>
                                            <span className="nirmaan-template-card__footer">
                                                <span>
                                                    {template.sections.length}{" "}
                                                    homepage sections
                                                </span>
                                                <span
                                                    className="nirmaan-template-swatches"
                                                    aria-label="Template colour palette"
                                                >
                                                    {[
                                                        template.theme.primary,
                                                        template.theme
                                                            .secondary,
                                                        template.theme.accent,
                                                    ].map((colour, index) => (
                                                        <i
                                                            key={index}
                                                            style={{
                                                                background:
                                                                    colour,
                                                            }}
                                                        />
                                                    ))}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {form.errors.template_id && (
                                <small className="field-error" role="alert">
                                    {form.errors.template_id}
                                </small>
                            )}
                            <div className="nirmaan-template-customize-divider">
                                <span>Fine-tune your brand</span>
                            </div>
                            <label>
                                Logo
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={(e) =>
                                        form.setData(
                                            "logo",
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                />
                                <small>PNG, JPG, WebP or SVG · max 3 MB</small>
                            </label>
                            <div className="style-grid">
                                {[
                                    "modern",
                                    "elegant",
                                    "bold",
                                    "minimal",
                                    "traditional",
                                ].map((style) => (
                                    <button
                                        type="button"
                                        className={
                                            form.data.style === style
                                                ? "style-choice active"
                                                : "style-choice"
                                        }
                                        key={style}
                                        onClick={() =>
                                            form.setData({
                                                ...form.data,
                                                ...onboardingPresets[style],
                                                style,
                                            })
                                        }
                                    >
                                        <span
                                            className={`style-demo ${style}`}
                                        />
                                        <b>{style}</b>
                                    </button>
                                ))}
                            </div>
                            <div className="color-grid">
                                {[
                                    ["primary", "Primary"],
                                    ["secondary", "Secondary"],
                                    ["accent", "Accent"],
                                ].map(([key, label]) => (
                                    <label key={key}>
                                        {label}
                                        <div className="color-input">
                                            <input
                                                type="color"
                                                value={form.data[key]}
                                                onChange={(e) =>
                                                    form.setData(
                                                        key,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <code>{form.data[key]}</code>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    )}
                    {step === 4 && (
                        <fieldset>
                            <legend>Final preferences</legend>
                            <p className="form-intro">
                                Review these defaults. Your content and design
                                remain fully editable.
                            </p>
                            <div className="form-grid">
                                <label>
                                    Website language
                                    <select
                                        value={form.data.language}
                                        onChange={(e) =>
                                            form.setData(
                                                "language",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="en">English</option>
                                        <option value="ne">नेपाली</option>
                                        <option value="bilingual">
                                            English + नेपाली
                                        </option>
                                    </select>
                                </label>
                                <label>
                                    Currency
                                    <select
                                        value={form.data.currency}
                                        onChange={(e) =>
                                            form.setData(
                                                "currency",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option>NPR</option>
                                        <option>USD</option>
                                        <option>INR</option>
                                    </select>
                                </label>
                            </div>
                            <div className="review-box">
                                <span>✦</span>
                                <div>
                                    <b>
                                        AI is ready to build{" "}
                                        {form.data.name || "your website"}
                                    </b>
                                    <p>
                                        It will create relevant pages,
                                        navigation, messaging, contact details,
                                        calls to action and a consistent theme
                                        from your answers.
                                    </p>
                                </div>
                            </div>
                            {Object.keys(form.errors).length > 0 && (
                                <p className="error-summary">
                                    Please review the highlighted or required
                                    information before continuing.
                                </p>
                            )}
                        </fieldset>
                    )}
                    {stepError && (
                        <p className="error-summary" role="alert">
                            {stepError}
                        </p>
                    )}
                    <div className="wizard-actions">
                        {step > 0 && (
                            <button
                                type="button"
                                className="button button-ghost"
                                onClick={() => setStep(step - 1)}
                            >
                                ← Back
                            </button>
                        )}
                        <span />
                        {step < 4 ? (
                            <button
                                type="button"
                                className="button button-dark"
                                onClick={next}
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                className="button button-dark"
                                disabled={form.processing}
                            >
                                {form.processing
                                    ? "Creating your website…"
                                    : "✦ Generate my website"}
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </AuthenticatedLayout>
    );
}
