import HexColorInput from "@/Components/HexColorInput";

export default function StudioElementControls({
    layout,
    element,
    free = false,
    onLayout,
    onElement,
    onReset,
}: {
    layout: any;
    element?: any;
    free?: boolean;
    onLayout: (patch: any) => void;
    onElement?: (patch: any) => void;
    onReset: () => void;
}) {
    const fields = [
        [
            "x",
            free ? "Horizontal position (%)" : "Horizontal offset (%)",
            free ? 0 : -100,
            100,
            1,
            free ? 35 : 0,
        ],
        [
            "y",
            free ? "Vertical position (%)" : "Vertical offset (px)",
            free ? 0 : -1000,
            free ? 100 : 1000,
            1,
            free ? 35 : 0,
        ],
        ["width", "Width (%)", 2, 100, 1, free ? 25 : 100],
        ["height", "Height (px)", 16, 1200, 1, free ? 160 : ""],
        ["rotation", "Rotation (degrees)", -180, 180, 1, 0],
        ["layer", "Layer", 0, 30, 1, 0],
    ] as const;
    return (
        <div className="studio-element-controls">
            <h3>Size & position</h3>
            <p>
                Drag the move handle or resize from a corner. Positions belong
                to this section.
            </p>
            <div className="studio-measurements">
                {fields.map(([key, label, min, max, step, fallback]) => (
                    <label key={key}>
                        {label}
                        <input
                            type="number"
                            aria-label={label}
                            min={min}
                            max={max}
                            step={step}
                            value={layout?.[key] ?? fallback}
                            onChange={(event) => {
                                const number = Number(event.target.value);
                                if (
                                    event.target.value !== "" &&
                                    Number.isFinite(number) &&
                                    number >= min &&
                                    number <= max
                                )
                                    onLayout({ [key]: number });
                            }}
                        />
                    </label>
                ))}
            </div>
            <div className="studio-order-actions">
                <button
                    type="button"
                    onClick={() =>
                        onLayout({
                            layer: Math.min(30, (layout?.layer || 0) + 1),
                        })
                    }
                >
                    Bring forward
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onLayout({
                            layer: Math.max(0, (layout?.layer || 0) - 1),
                        })
                    }
                >
                    Send backward
                </button>
                <button type="button" onClick={onReset}>
                    Reset position & size
                </button>
            </div>
            {element && onElement && (
                <>
                    {element.type === "image" && (
                        <>
                            <label>
                                Image URL
                                <input
                                    type="url"
                                    aria-label="Element image URL"
                                    value={element.image || ""}
                                    onChange={(event) =>
                                        onElement({ image: event.target.value })
                                    }
                                />
                            </label>
                            <label>
                                Image description
                                <input
                                    type="text"
                                    aria-label="Element image description"
                                    maxLength={180}
                                    value={element.image_alt || ""}
                                    onChange={(event) =>
                                        onElement({
                                            image_alt: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        </>
                    )}
                    {(element.type === "shape" || element.type === "image") && (
                        <div
                            className="studio-shape-choices"
                            role="group"
                            aria-label="Element shape"
                        >
                            {[
                                "rectangle",
                                "rounded",
                                "circle",
                                "triangle",
                                "star",
                                "diamond",
                                "line",
                                "arch",
                            ].map((shape) => (
                                <button
                                    type="button"
                                    key={shape}
                                    aria-pressed={element.shape === shape}
                                    onClick={() => onElement({ shape })}
                                >
                                    <i
                                        className={`studio-shape-icon shape-${shape}`}
                                    />
                                    {shape}
                                </button>
                            ))}
                        </div>
                    )}
                    {(element.type === "shape" ||
                        element.type === "button") && (
                        <label>
                            Fill color
                            <HexColorInput
                                label="Element fill"
                                value={element.fill || "#0f766e"}
                                onChange={(fill) => onElement({ fill })}
                            />
                        </label>
                    )}
                    <label>
                        Border color
                        <HexColorInput
                            label="Element border color"
                            value={element.border_color || "#0f766e"}
                            onChange={(border_color) =>
                                onElement({ border_color })
                            }
                        />
                    </label>
                    <label>
                        Border width
                        <input
                            type="number"
                            aria-label="Element border width"
                            min={0}
                            max={16}
                            value={element.border_width || 0}
                            onChange={(event) => {
                                const width = Number(event.target.value);
                                if (width >= 0 && width <= 16)
                                    onElement({ border_width: width });
                            }}
                        />
                    </label>
                    <label>
                        Corner rounding
                        <input
                            type="number"
                            aria-label="Element corner rounding"
                            min={0}
                            max={100}
                            value={element.radius || 0}
                            onChange={(event) => {
                                const radius = Number(event.target.value);
                                if (radius >= 0 && radius <= 100)
                                    onElement({ radius });
                            }}
                        />
                    </label>
                </>
            )}
        </div>
    );
}
