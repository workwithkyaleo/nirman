import { useState } from "react";
import AnimatedText from "@/Components/AnimatedText";
import { TEXT_ANIMATIONS, textAnimationSettings } from "@/lib/textAnimation";
import type { TextStyle } from "@/lib/publicTheme";

export default function TextAnimationControls({
    label,
    value,
    onChange,
}: {
    label: string;
    value?: TextStyle | null;
    onChange: (style: TextStyle | null) => void;
}) {
    const [replay, setReplay] = useState(0);
    const settings = textAnimationSettings(value);
    const update = (patch: Partial<TextStyle>) => {
        onChange({ ...value, ...patch });
        setReplay((current) => current + 1);
    };
    return (
        <div className="text-animation-controls">
            <p className="text-format__help">
                Choose how this text appears as visitors scroll. Animations play
                once and respect reduced-motion preferences.
            </p>
            <div
                className="text-animation-choices"
                role="group"
                aria-label={`${label} animation choices`}
            >
                {TEXT_ANIMATIONS.map(
                    ({ value: effect, label: name, description }) => (
                        <button
                            type="button"
                            key={effect}
                            className="text-animation-choice"
                            aria-pressed={settings.effect === effect}
                            onClick={() => update({ animation: effect })}
                        >
                            <span
                                className={`text-animation-choice__icon text-animation-choice__icon--${effect}`}
                                aria-hidden="true"
                            >
                                Aa
                            </span>
                            <strong>{name}</strong>
                            <small>{description}</small>
                        </button>
                    ),
                )}
            </div>
            <div className="text-animation-preview">
                <span>Animation preview</span>
                <div>
                    <AnimatedText
                        as="p"
                        animationStyle={value}
                        replayKey={replay}
                    >
                        Bring your words to life
                    </AnimatedText>
                </div>
                <button
                    type="button"
                    onClick={() => setReplay((current) => current + 1)}
                >
                    ↻ Replay preview
                </button>
            </div>
            {settings.effect !== "none" && (
                <>
                    <fieldset className="text-format__setting">
                        <legend>Speed</legend>
                        <div className="text-format__segments">
                            {(
                                [
                                    [400, "Quick"],
                                    [700, "Natural"],
                                    [1200, "Gentle"],
                                ] as const
                            ).map(([duration, name]) => (
                                <button
                                    type="button"
                                    key={duration}
                                    aria-pressed={
                                        settings.duration === duration
                                    }
                                    onClick={() =>
                                        update({ animation_duration: duration })
                                    }
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <label className="text-animation-range">
                        Duration{" "}
                        <span>
                            {(settings.duration / 1000).toFixed(1)} seconds
                        </span>
                        <input
                            type="range"
                            aria-label={`${label} animation duration`}
                            min={200}
                            max={2000}
                            step={100}
                            value={settings.duration}
                            onChange={(event) =>
                                update({
                                    animation_duration: Number(
                                        event.target.value,
                                    ),
                                })
                            }
                        />
                    </label>
                    <label className="text-animation-range">
                        Start delay{" "}
                        <span>
                            {(settings.delay / 1000).toFixed(1)} seconds
                        </span>
                        <input
                            type="range"
                            aria-label={`${label} animation delay`}
                            min={0}
                            max={2000}
                            step={100}
                            value={settings.delay}
                            onChange={(event) =>
                                update({
                                    animation_delay: Number(event.target.value),
                                })
                            }
                        />
                    </label>
                </>
            )}
        </div>
    );
}
