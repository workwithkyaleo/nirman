import TextAnimationControls from "@/Components/TextAnimationControls";
import HexColorInput from "@/Components/HexColorInput";
import { useEffect, useId, useRef, useState } from "react";
import {
    TEXT_FONTS,
    textFontStack,
    textStyleProperties,
    type TextStyle,
} from "@/lib/publicTheme";

type Formatting = {
    font?: string | null;
    color?: string | null;
    style?: TextStyle | null;
};
type Panel = "font" | "color" | "styles" | "animation" | "more" | null;
const enabled = (value: unknown) =>
    value === true || value === 1 || value === "1";
const PRESETS: { name: string; description: string; style: TextStyle }[] = [
    {
        name: "Title",
        description: "A strong main heading",
        style: { size: 48, weight: 700, line_height: 1.15, letter_spacing: -1 },
    },
    {
        name: "Subtitle",
        description: "Introduce the next section",
        style: { size: 26, weight: 600, line_height: 1.35 },
    },
    {
        name: "Body",
        description: "Comfortable reading",
        style: { size: 16, weight: 400, line_height: 1.6 },
    },
    {
        name: "Caption",
        description: "Small supporting details",
        style: { size: 12, weight: 500, line_height: 1.4 },
    },
    {
        name: "Overline",
        description: "A short label above a title",
        style: {
            size: 12,
            weight: 700,
            uppercase: true,
            line_height: 1.4,
            letter_spacing: 1.8,
        },
    },
    {
        name: "Quote",
        description: "Give a statement emphasis",
        style: { size: 22, weight: 400, italic: true, line_height: 1.5 },
    },
];
const WEIGHTS = [
    [300, "Light"],
    [400, "Regular"],
    [500, "Medium"],
    [600, "Semibold"],
    [700, "Bold"],
    [800, "Extra bold"],
    [900, "Black"],
] as const;

function NumberSetting({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value?: number;
    min: number;
    max: number;
    step: number;
    onChange: (value?: number) => void;
}) {
    const [draft, setDraft] = useState(value == null ? "" : String(value));
    useEffect(() => setDraft(value == null ? "" : String(value)), [value]);
    return (
        <input
            type="number"
            aria-label={label}
            min={min}
            max={max}
            step={step}
            placeholder="Theme"
            value={draft}
            onChange={(event) => {
                const raw = event.target.value;
                setDraft(raw);
                if (raw === "") {
                    onChange();
                    return;
                }
                const number = Number(raw);
                if (Number.isFinite(number) && number >= min && number <= max)
                    onChange(number);
            }}
            onBlur={() => {
                if (draft === "") return;
                const number = Number(draft);
                if (!Number.isFinite(number)) {
                    setDraft(value == null ? "" : String(value));
                    return;
                }
                const bounded = Math.min(max, Math.max(min, number));
                setDraft(String(bounded));
                onChange(bounded);
            }}
        />
    );
}

export default function TextFormattingToolbar({
    label,
    value,
    themeFont,
    themeColor,
    heading = false,
    onChange,
}: {
    label: string;
    value: Formatting;
    themeFont: string;
    themeColor: string;
    heading?: boolean;
    onChange: (formatting: Formatting) => void;
}) {
    const [panel, setPanel] = useState<Panel>(null);
    const [query, setQuery] = useState("");
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement | null>(null);
    const search = useRef<HTMLInputElement>(null);
    const panelId = useId();
    const font = value.font || themeFont;
    const color = value.color || themeColor;
    const fonts = TEXT_FONTS.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
    );
    useEffect(() => {
        if (!panel) return;
        if (panel === "font") search.current?.focus();
        const close = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setPanel(null);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [panel]);
    const closePanel = () => {
        setPanel(null);
        trigger.current?.focus();
    };
    const openPanel = (next: Panel, button: HTMLButtonElement) => {
        trigger.current = button;
        setPanel(panel === next ? null : next);
        if (next === "font") setQuery("");
    };
    const updateStyle = (patch: TextStyle) =>
        onChange({ ...value, style: { ...value.style, ...patch } });
    const resetProperty = (property: keyof TextStyle) => {
        const style = { ...value.style };
        delete style[property];
        onChange({ ...value, style: Object.keys(style).length ? style : null });
    };
    const weight =
        value.style?.weight ??
        (value.style?.bold == null
            ? heading
                ? 700
                : 400
            : enabled(value.style.bold)
              ? 700
              : 400);
    const formatToggle = (
        key: "bold" | "italic" | "underline" | "strikethrough" | "uppercase",
        name: string,
        icon: string,
    ) => {
        const active =
            key === "bold" ? weight >= 700 : enabled(value.style?.[key]);
        return (
            <button
                key={key}
                type="button"
                className={`text-format__toggle text-format__${key}`}
                aria-label={`${label} ${name.toLowerCase()}`}
                title={name}
                aria-pressed={active}
                onClick={() => {
                    const style = { ...value.style, [key]: !active };
                    if (key === "bold") delete style.weight;
                    onChange({ ...value, style });
                }}
            >
                <span aria-hidden="true">{icon}</span>
                <span className="text-format__toggle-name">{name}</span>
            </button>
        );
    };
    return (
        <div
            className="text-format text-format--friendly"
            ref={root}
            onKeyDown={(event) => {
                if (event.key === "Escape" && panel) {
                    event.stopPropagation();
                    closePanel();
                }
            }}
        >
            <div className="text-format__header">
                <span className="text-format__label">{label} appearance</span>
                <button
                    type="button"
                    className="text-format__reset"
                    title="Restore theme font, color and style"
                    aria-label={`Reset ${label.toLowerCase()} formatting`}
                    onClick={() => {
                        onChange({ font: null, color: null, style: null });
                        setPanel(null);
                    }}
                >
                    ↺ Reset
                </button>
            </div>
            <div
                className="text-format__bar"
                role="group"
                aria-label={`${label} formatting`}
            >
                <button
                    type="button"
                    className="text-format__font"
                    aria-label={`${label} font`}
                    aria-expanded={panel === "font"}
                    aria-controls={panelId}
                    onClick={(event) => openPanel("font", event.currentTarget)}
                >
                    <span>
                        <small>Font</small>
                        <span style={{ fontFamily: textFontStack(font) }}>
                            {font}
                        </span>
                    </span>
                    <span aria-hidden="true">⌄</span>
                </button>
                <label className="text-format__size-control">
                    <span>Size</span>
                    <NumberSetting
                        label={`${label} size in pixels`}
                        min={10}
                        max={120}
                        step={1}
                        value={value.style?.size}
                        onChange={(size) =>
                            size == null
                                ? resetProperty("size")
                                : updateStyle({ size })
                        }
                    />
                </label>
                <button
                    type="button"
                    className="text-format__color"
                    aria-label={`${label} text color`}
                    aria-expanded={panel === "color"}
                    aria-controls={panelId}
                    onClick={(event) => openPanel("color", event.currentTarget)}
                >
                    <i style={{ background: color }} aria-hidden="true" />
                    <span>Color</span>
                </button>
                <button
                    type="button"
                    className="text-format__menu"
                    aria-label={`${label} style presets`}
                    aria-expanded={panel === "styles"}
                    aria-controls={panelId}
                    onClick={(event) =>
                        openPanel("styles", event.currentTarget)
                    }
                >
                    Styles <span aria-hidden="true">⌄</span>
                </button>
                <button
                    type="button"
                    className="text-format__menu"
                    aria-label={`${label} text animation`}
                    aria-expanded={panel === "animation"}
                    aria-controls={panelId}
                    onClick={(event) =>
                        openPanel("animation", event.currentTarget)
                    }
                >
                    Animate <span aria-hidden="true">⌄</span>
                </button>
                <span className="text-format__divider" />
                {formatToggle("bold", "Bold", "B")}
                {formatToggle("italic", "Italic", "I")}
                {formatToggle("underline", "Underline", "U")}
                <button
                    type="button"
                    className="text-format__menu"
                    aria-label={`${label} more text options`}
                    aria-expanded={panel === "more"}
                    aria-controls={panelId}
                    onClick={(event) => openPanel("more", event.currentTarget)}
                >
                    More <span aria-hidden="true">⌄</span>
                </button>
                <button
                    type="button"
                    className="text-format__reset-inline"
                    aria-label={`Reset ${label.toLowerCase()} appearance`}
                    onClick={() =>
                        onChange({ font: null, color: null, style: null })
                    }
                >
                    ↺ Reset
                </button>
            </div>
            <p className="text-format__help">
                Changes apply to this text. Use Styles for a quick starting
                point.
            </p>
            {panel && (
                <div
                    className="text-format__panel"
                    id={panelId}
                    role="region"
                    aria-label={`${label} ${panel === "font" ? "fonts" : panel === "color" ? "colors" : panel === "styles" ? "style presets" : panel === "animation" ? "text animation" : "typography options"}`}
                >
                    <div className="text-format__panel-header">
                        <strong>
                            {panel === "font"
                                ? "Choose a font"
                                : panel === "color"
                                  ? "Choose text color"
                                  : panel === "styles"
                                    ? "Choose a text style"
                                    : panel === "animation"
                                      ? "Animate your text"
                                      : "Fine-tune your text"}
                        </strong>
                        <button
                            type="button"
                            onClick={closePanel}
                            aria-label="Close formatting options"
                        >
                            ✕
                        </button>
                    </div>
                    {panel === "font" && (
                        <>
                            <input
                                ref={search}
                                aria-label="Search fonts"
                                placeholder={`Search ${TEXT_FONTS.length} fonts`}
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                            />
                            <button
                                type="button"
                                className="text-format__choice text-format__theme-choice"
                                aria-pressed={!value.font}
                                onClick={() => {
                                    onChange({ ...value, font: null });
                                    closePanel();
                                }}
                            >
                                Use theme font <span>{themeFont}</span>
                            </button>
                            <div className="text-format__fonts">
                                {fonts.map((name) => (
                                    <button
                                        type="button"
                                        className="text-format__choice"
                                        key={name}
                                        aria-pressed={font === name}
                                        style={{
                                            fontFamily: textFontStack(name),
                                        }}
                                        onClick={() => {
                                            onChange({ ...value, font: name });
                                            closePanel();
                                        }}
                                    >
                                        {name}
                                        <span aria-hidden="true">
                                            {font === name ? "✓" : "Aa"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {!fonts.length && (
                                <p className="text-format__empty">
                                    No fonts found. Try a different name.
                                </p>
                            )}
                            <p className="text-format__help">
                                Includes Nepali fonts. System fonts may vary by
                                device.
                            </p>
                        </>
                    )}
                    {panel === "color" && (
                        <>
                            <div className="text-format__swatches">
                                {Array.from(
                                    new Set([
                                        themeColor,
                                        "#17201e",
                                        "#ffffff",
                                        "#64748b",
                                        "#ef4444",
                                        "#f97316",
                                        "#eab308",
                                        "#22c55e",
                                        "#14b8a6",
                                        "#3b82f6",
                                        "#8b5cf6",
                                        "#ec4899",
                                    ]),
                                ).map((swatch) => (
                                    <button
                                        type="button"
                                        key={swatch}
                                        style={{ background: swatch }}
                                        aria-label={`Choose ${swatch}`}
                                        aria-pressed={
                                            color.toLowerCase() ===
                                            swatch.toLowerCase()
                                        }
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                color: swatch,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                            <label className="text-format__custom">
                                Custom color <span>{color.toUpperCase()}</span>
                                <HexColorInput
                                    label={`${label} custom color`}
                                    value={color}
                                    onChange={(color) =>
                                        onChange({
                                            ...value,
                                            color,
                                        })
                                    }
                                />
                            </label>
                            <button
                                type="button"
                                className="text-format__choice text-format__theme-choice"
                                onClick={() => {
                                    onChange({ ...value, color: null });
                                    closePanel();
                                }}
                            >
                                Use theme color{" "}
                                <span style={{ color: themeColor }}>●</span>
                            </button>
                        </>
                    )}
                    {panel === "styles" && (
                        <>
                            <p className="text-format__help">
                                Sets size, weight and spacing. Your font, color
                                and animation stay selected.
                            </p>
                            <div className="text-format__presets">
                                {PRESETS.map((preset) => (
                                    <button
                                        type="button"
                                        key={preset.name}
                                        className="text-format__preset"
                                        onClick={() => {
                                            onChange({
                                                ...value,
                                                style: {
                                                    ...preset.style,
                                                    ...(value.style?.animation
                                                        ? {
                                                              animation:
                                                                  value.style
                                                                      .animation,
                                                          }
                                                        : {}),
                                                    ...(value.style
                                                        ?.animation_duration !=
                                                    null
                                                        ? {
                                                              animation_duration:
                                                                  value.style
                                                                      .animation_duration,
                                                          }
                                                        : {}),
                                                    ...(value.style
                                                        ?.animation_delay !=
                                                    null
                                                        ? {
                                                              animation_delay:
                                                                  value.style
                                                                      .animation_delay,
                                                          }
                                                        : {}),
                                                },
                                            });
                                            closePanel();
                                        }}
                                    >
                                        <span
                                            className="text-format__preset-name"
                                            style={{
                                                fontWeight: preset.style.weight,
                                                fontStyle: preset.style.italic
                                                    ? "italic"
                                                    : "normal",
                                                textTransform: preset.style
                                                    .uppercase
                                                    ? "uppercase"
                                                    : "none",
                                            }}
                                        >
                                            {preset.name}
                                        </span>
                                        <small>{preset.description}</small>
                                        <span className="text-format__preset-size">
                                            {preset.style.size} px
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="text-format__choice text-format__theme-choice"
                                onClick={() => {
                                    onChange({ ...value, style: null });
                                    closePanel();
                                }}
                            >
                                Use theme style
                            </button>
                        </>
                    )}
                    {panel === "animation" && (
                        <TextAnimationControls
                            label={label}
                            value={value.style}
                            onChange={(style) => onChange({ ...value, style })}
                        />
                    )}
                    {panel === "more" && (
                        <>
                            <div className="text-format__measurements">
                                {(
                                    [
                                        [
                                            "size",
                                            "Size (px)",
                                            10,
                                            120,
                                            1,
                                            "Theme",
                                        ],
                                        [
                                            "line_height",
                                            "Line height",
                                            0.8,
                                            2.5,
                                            0.05,
                                            "Theme",
                                        ],
                                        [
                                            "letter_spacing",
                                            "Letter spacing (px)",
                                            -2,
                                            12,
                                            0.1,
                                            "Theme",
                                        ],
                                    ] as const
                                ).map(([key, name, min, max, step]) => (
                                    <label key={key}>
                                        {name}
                                        <NumberSetting
                                            label={`${label} ${name.toLowerCase()}`}
                                            min={min}
                                            max={max}
                                            step={step}
                                            value={value.style?.[key]}
                                            onChange={(number) =>
                                                number == null
                                                    ? resetProperty(key)
                                                    : updateStyle({
                                                          [key]: number,
                                                      })
                                            }
                                        />
                                    </label>
                                ))}
                            </div>
                            <p className="text-format__help">
                                Clear a number to use the theme setting.
                            </p>
                            <fieldset className="text-format__setting">
                                <legend>Alignment</legend>
                                <div className="text-format__segments">
                                    <button
                                        type="button"
                                        aria-pressed={!value.style?.align}
                                        onClick={() => resetProperty("align")}
                                    >
                                        Theme
                                    </button>
                                    {(
                                        [
                                            "left",
                                            "center",
                                            "right",
                                            "justify",
                                        ] as const
                                    ).map((align) => (
                                        <button
                                            type="button"
                                            key={align}
                                            aria-pressed={
                                                value.style?.align === align
                                            }
                                            onClick={() =>
                                                updateStyle({ align })
                                            }
                                        >
                                            {align[0].toUpperCase() +
                                                align.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                            <fieldset className="text-format__setting">
                                <legend>Font weight</legend>
                                <div className="text-format__segments">
                                    <button
                                        type="button"
                                        aria-pressed={
                                            value.style?.weight == null &&
                                            value.style?.bold == null
                                        }
                                        onClick={() => {
                                            const style = { ...value.style };
                                            delete style.weight;
                                            delete style.bold;
                                            onChange({
                                                ...value,
                                                style: Object.keys(style).length
                                                    ? style
                                                    : null,
                                            });
                                        }}
                                    >
                                        Theme
                                    </button>
                                    {WEIGHTS.map(([number, name]) => (
                                        <button
                                            type="button"
                                            key={number}
                                            aria-pressed={
                                                weight === number &&
                                                (value.style?.weight != null ||
                                                    value.style?.bold != null)
                                            }
                                            onClick={() =>
                                                updateStyle({ weight: number })
                                            }
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                            <fieldset className="text-format__setting">
                                <legend>Effects</legend>
                                <div className="text-format__segments">
                                    {formatToggle(
                                        "uppercase",
                                        "Uppercase",
                                        "Aa",
                                    )}
                                    {formatToggle(
                                        "strikethrough",
                                        "Strikethrough",
                                        "S",
                                    )}
                                </div>
                            </fieldset>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
