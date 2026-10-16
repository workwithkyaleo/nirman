import HexColorInput from "@/Components/HexColorInput";
import {
    sectionAppearanceClassName,
    sectionAppearanceStyle,
    sectionDecoration,
    type SectionAppearance,
} from "@/lib/sectionAppearance";

export function AppearanceChoices({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: readonly (readonly [string, string])[];
    value?: string | null;
    onChange: (value: string) => void;
}) {
    return (
        <div className="appearance-field">
            <span className="appearance-label">{label}</span>
            <div className="appearance-choices" role="group" aria-label={label}>
                {options.map(([key, name]) => (
                    <button
                        type="button"
                        key={key}
                        aria-pressed={value === key}
                        onClick={() => onChange(key)}
                    >
                        {name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function AppearanceColor({
    label,
    value,
    fallback,
    onChange,
}: {
    label: string;
    value?: string | null;
    fallback: string;
    onChange: (color: string | null) => void;
}) {
    return (
        <div className="appearance-color">
            <label>
                <HexColorInput
                    label={label}
                    value={value || fallback}
                    onChange={onChange}
                />
                <span>
                    <b>{label}</b>
                    <small>{value || "Use theme color"}</small>
                </span>
            </label>
            {value && (
                <button
                    type="button"
                    aria-label={`Reset ${label.toLowerCase()} to theme`}
                    onClick={() => onChange(null)}
                >
                    Reset
                </button>
            )}
        </div>
    );
}

export function AppearanceRange({
    label,
    value,
    max,
    min = 0,
    suffix = "px",
    onChange,
}: {
    label: string;
    value: number;
    max: number;
    min?: number;
    suffix?: string;
    onChange: (value: number) => void;
}) {
    return (
        <label className="appearance-range">
            <span>
                <b>{label}</b>
                <output>
                    {value}
                    {suffix}
                </output>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                aria-label={label}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
}

export default function SectionAppearanceControls({
    value,
    themeBackground,
    themeAccent,
    onChange,
}: {
    value?: SectionAppearance | null;
    themeBackground: string;
    themeAccent: string;
    onChange: (appearance: SectionAppearance | null) => void;
}) {
    const change = (update: Partial<SectionAppearance>) =>
        onChange({ ...value, ...update });
    const decoration = sectionDecoration(value);
    return (
        <div className="appearance-controls">
            <div className="appearance-heading">
                <div>
                    <h3>Design this section</h3>
                    <p>Set the background, spacing, and decorative shapes.</p>
                </div>
                <button
                    type="button"
                    className="appearance-reset"
                    onClick={() => onChange(null)}
                >
                    Use theme design
                </button>
            </div>
            <div
                className={`appearance-section-preview ${sectionAppearanceClassName(value)}`}
                style={{
                    backgroundColor: themeBackground,
                    ...sectionAppearanceStyle(value),
                    paddingBlock: 28,
                }}
                aria-label="Section design preview"
            >
                {decoration && (
                    <span
                        aria-hidden="true"
                        className={`section-decoration section-decoration-${decoration}`}
                        style={{
                            color: value?.decoration_color || themeAccent,
                        }}
                    />
                )}
                <strong>Your section</strong>
                <p>A preview of the background, border and decorative shape.</p>
            </div>
            <AppearanceColor
                label="Background color"
                value={value?.background_color}
                fallback={themeBackground}
                onChange={(background_color) => change({ background_color })}
            />
            <AppearanceChoices
                label="Content alignment"
                options={[
                    ["left", "Left"],
                    ["center", "Center"],
                    ["right", "Right"],
                ]}
                value={value?.alignment}
                onChange={(alignment) =>
                    change({
                        alignment: alignment as SectionAppearance["alignment"],
                    })
                }
            />
            <AppearanceChoices
                label="Space around content"
                options={[
                    ["compact", "Compact"],
                    ["comfortable", "Comfortable"],
                    ["spacious", "Spacious"],
                ]}
                value={value?.spacing}
                onChange={(spacing) =>
                    change({ spacing: spacing as SectionAppearance["spacing"] })
                }
            />
            <AppearanceRange
                label="Section minimum height"
                value={value?.min_height ?? 240}
                min={240}
                max={1600}
                onChange={(min_height) => change({ min_height })}
            />
            <div className="appearance-two-columns">
                <AppearanceRange
                    label="Rounded corners"
                    value={value?.radius ?? 0}
                    max={64}
                    onChange={(radius) => change({ radius })}
                />
                <AppearanceRange
                    label="Border thickness"
                    value={value?.border_width ?? 0}
                    max={8}
                    onChange={(border_width) => change({ border_width })}
                />
            </div>
            <AppearanceColor
                label="Border color"
                value={value?.border_color}
                fallback={themeAccent}
                onChange={(border_color) =>
                    change({
                        border_color,
                        border_width: value?.border_width || 1,
                    })
                }
            />
            <AppearanceChoices
                label="Decorative background shape"
                options={[
                    ["none", "None"],
                    ["circle", "Circle"],
                    ["arch", "Arch"],
                    ["diagonal", "Diagonal"],
                ]}
                value={value?.decoration || "none"}
                onChange={(decoration) =>
                    change({
                        decoration:
                            decoration as SectionAppearance["decoration"],
                    })
                }
            />
            {decoration && (
                <AppearanceColor
                    label="Shape color"
                    value={value?.decoration_color}
                    fallback={themeAccent}
                    onChange={(decoration_color) =>
                        change({ decoration_color })
                    }
                />
            )}
        </div>
    );
}
