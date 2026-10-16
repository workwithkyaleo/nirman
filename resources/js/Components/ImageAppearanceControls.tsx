import {
    imageAppearanceStyle,
    type ImageAppearance,
} from "@/lib/sectionAppearance";
import {
    AppearanceChoices,
    AppearanceColor,
    AppearanceRange,
} from "@/Components/SectionAppearanceControls";

export default function ImageAppearanceControls({
    value,
    image,
    label = "Image",
    background = false,
    onChange,
}: {
    value?: ImageAppearance | null;
    image?: string;
    label?: string;
    background?: boolean;
    onChange: (appearance: ImageAppearance | null) => void;
}) {
    const change = (update: Partial<ImageAppearance>) =>
        onChange({ ...value, ...update });
    const squareShape = ["circle", "diamond"].includes(value?.shape || "");
    return (
        <div className="appearance-controls appearance-image-controls">
            <div className="appearance-heading">
                <div>
                    <h3>{label} design</h3>
                    <p>
                        {background
                            ? "Adjust how the cover photo fills your hero."
                            : "Frame your photo and choose which part stays visible."}
                    </p>
                </div>
                <button
                    type="button"
                    className="appearance-reset"
                    onClick={() => onChange(null)}
                >
                    Reset image design
                </button>
            </div>
            {image && (
                <div className="appearance-image-preview">
                    <img
                        src={image}
                        alt={`${label} design preview`}
                        style={{
                            aspectRatio: "16 / 9",
                            ...imageAppearanceStyle(value),
                            ...(background
                                ? {
                                      aspectRatio: "16 / 9",
                                      borderRadius: 8,
                                      clipPath: undefined,
                                      borderWidth: 0,
                                      boxShadow: "none",
                                  }
                                : {}),
                        }}
                    />
                </div>
            )}
            {!background && (
                <>
                    <div className="appearance-field">
                        <span className="appearance-label">Photo shape</span>
                        <div
                            className="appearance-shapes"
                            role="group"
                            aria-label={`${label} shape`}
                        >
                            {(
                                [
                                    ["rectangle", "Rectangle"],
                                    ["rounded", "Rounded"],
                                    ["circle", "Circle"],
                                    ["arch", "Arch"],
                                    ["diamond", "Diamond"],
                                ] as const
                            ).map(([shape, title]) => (
                                <button
                                    key={shape}
                                    type="button"
                                    aria-pressed={value?.shape === shape}
                                    onClick={() => change({ shape })}
                                >
                                    <i
                                        aria-hidden="true"
                                        className={`appearance-shape appearance-shape-${shape}`}
                                    />
                                    <span>{title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {squareShape ? (
                        <p className="appearance-hint">
                            {value?.shape === "circle" ? "Circle" : "Diamond"}{" "}
                            photos use a square crop. Choose the focus below.
                        </p>
                    ) : (
                        <AppearanceChoices
                            label={`${label} proportions`}
                            options={[
                                ["auto", "Original"],
                                ["wide", "Wide"],
                                ["landscape", "Landscape"],
                                ["square", "Square"],
                                ["portrait", "Portrait"],
                            ]}
                            value={value?.aspect_ratio}
                            onChange={(aspect_ratio) =>
                                change({
                                    aspect_ratio:
                                        aspect_ratio as ImageAppearance["aspect_ratio"],
                                })
                            }
                        />
                    )}
                </>
            )}
            <AppearanceChoices
                label={`${label} fit`}
                options={[
                    ["cover", "Fill frame"],
                    ["contain", "Show whole photo"],
                ]}
                value={value?.fit || "cover"}
                onChange={(fit) =>
                    change({ fit: fit as ImageAppearance["fit"] })
                }
            />
            <AppearanceChoices
                label={`${label} focus`}
                options={[
                    ["left", "← Left"],
                    ["top", "↑ Top"],
                    ["center", "Center"],
                    ["bottom", "↓ Bottom"],
                    ["right", "Right →"],
                ]}
                value={value?.position || "center"}
                onChange={(position) =>
                    change({
                        position: position as ImageAppearance["position"],
                    })
                }
            />
            <AppearanceRange
                label={background ? "Photo brightness" : `${label} opacity`}
                value={value?.opacity ?? 100}
                min={20}
                max={100}
                suffix="%"
                onChange={(opacity) => change({ opacity })}
            />
            {!background && (
                <>
                    <AppearanceChoices
                        label={`${label} shadow`}
                        options={[
                            ["none", "None"],
                            ["soft", "Soft"],
                            ["strong", "Strong"],
                        ]}
                        value={value?.shadow}
                        onChange={(shadow) =>
                            change({
                                shadow: shadow as ImageAppearance["shadow"],
                            })
                        }
                    />
                    <AppearanceRange
                        label={`${label} border thickness`}
                        value={value?.border_width ?? 0}
                        max={8}
                        onChange={(border_width) => change({ border_width })}
                    />
                    <AppearanceColor
                        label={`${label} border color`}
                        value={value?.border_color}
                        fallback="#cbd5e1"
                        onChange={(border_color) =>
                            change({
                                border_color,
                                border_width: value?.border_width || 1,
                            })
                        }
                    />
                </>
            )}
        </div>
    );
}
