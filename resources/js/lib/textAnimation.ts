import type { CSSProperties } from "react";
import type { TextStyle } from "@/lib/publicTheme";

export const TEXT_ANIMATIONS = [
    { value: "none", label: "None", description: "Keep text still." },
    { value: "fade", label: "Fade in", description: "Appear gently." },
    { value: "rise", label: "Rise up", description: "Move up into place." },
    { value: "slide", label: "Slide in", description: "Enter from the left." },
    { value: "zoom", label: "Zoom in", description: "Grow softly into place." },
    { value: "blur", label: "Clear focus", description: "Sharpen into view." },
] as const;

export type TextAnimation = (typeof TEXT_ANIMATIONS)[number]["value"];

export function textAnimationSettings(style?: TextStyle | null): {
    effect: TextAnimation;
    duration: number;
    delay: number;
} {
    const boundedMilliseconds = (
        value: unknown,
        minimum: number,
        maximum: number,
        fallback: number,
    ) => {
        if (
            value == null ||
            value === "" ||
            (typeof value !== "number" && typeof value !== "string")
        )
            return fallback;
        const number = Number(value);
        return Number.isFinite(number)
            ? Math.min(maximum, Math.max(minimum, Math.round(number)))
            : fallback;
    };
    const animation = TEXT_ANIMATIONS.find(
        (option) => option.value === style?.animation,
    )?.value;

    return {
        effect: animation || "none",
        duration: boundedMilliseconds(
            style?.animation_duration,
            200,
            2000,
            600,
        ),
        delay: boundedMilliseconds(style?.animation_delay, 0, 2000, 0),
    };
}

export function textAnimationProperties(
    style?: TextStyle | null,
): CSSProperties {
    const { duration, delay } = textAnimationSettings(style);
    return {
        "--text-animation-duration": `${duration}ms`,
        "--text-animation-delay": `${delay}ms`,
    } as CSSProperties;
}
