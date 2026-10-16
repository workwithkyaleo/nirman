const DARK_FOREGROUND = "#111827";
const LIGHT_FOREGROUND = "#ffffff";

type Rgb = [number, number, number];

function parseHexColor(value: unknown): Rgb | null {
    if (typeof value !== "string") return null;

    const normalized = value.trim().replace(/^#/, "");
    const expanded =
        normalized.length === 3
            ? normalized
                  .split("")
                  .map((character) => character.repeat(2))
                  .join("")
            : normalized;

    if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;

    return [
        Number.parseInt(expanded.slice(0, 2), 16),
        Number.parseInt(expanded.slice(2, 4), 16),
        Number.parseInt(expanded.slice(4, 6), 16),
    ];
}

function luminance(color: Rgb): number {
    const channels = color.map((channel) => {
        const normalized = channel / 255;

        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function rgbContrastRatio(first: Rgb, second: Rgb): number {
    const brightest = Math.max(luminance(first), luminance(second));
    const darkest = Math.min(luminance(first), luminance(second));

    return (brightest + 0.05) / (darkest + 0.05);
}

function rgbToHex(color: Rgb): string {
    return `#${color
        .map((channel) =>
            Math.round(channel).toString(16).padStart(2, "0"),
        )
        .join("")}`;
}

export function colorContrastRatio(first: unknown, second: unknown): number {
    const parsedFirst = parseHexColor(first);
    const parsedSecond = parseHexColor(second);

    if (!parsedFirst || !parsedSecond) return 1;

    return rgbContrastRatio(parsedFirst, parsedSecond);
}

/** Picks whichever neutral foreground has the stronger WCAG contrast. */
export function readableTextColor(background: unknown): string {
    const parsedBackground = parseHexColor(background);
    const dark = parseHexColor(DARK_FOREGROUND);
    const light = parseHexColor(LIGHT_FOREGROUND);

    if (!parsedBackground || !dark || !light) return LIGHT_FOREGROUND;

    return rgbContrastRatio(parsedBackground, dark) >=
        rgbContrastRatio(parsedBackground, light)
        ? DARK_FOREGROUND
        : LIGHT_FOREGROUND;
}

/**
 * Creates a subtle surface tone by moving the background away from the text
 * luminance. This preserves (or improves) the configured text contrast instead
 * of putting light theme text on hard-coded white cards.
 */
export function readableSurfaceColor(
    background: unknown,
    text: unknown,
    strength = 0.08,
): string {
    const parsedBackground = parseHexColor(background);
    const parsedText = parseHexColor(text);

    if (!parsedBackground || !parsedText) return String(background || "#ffffff");

    const target: Rgb =
        luminance(parsedText) > luminance(parsedBackground)
            ? [0, 0, 0]
            : [255, 255, 255];
    const amount = Math.max(0, Math.min(strength, 1));
    const surface = parsedBackground.map((channel, index) =>
        Math.round(channel + (target[index] - channel) * amount),
    ) as Rgb;

    return rgbContrastRatio(surface, parsedText) >=
        rgbContrastRatio(parsedBackground, parsedText)
        ? rgbToHex(surface)
        : rgbToHex(parsedBackground);
}
