import { useEffect, useId, useState } from "react";

export default function HexColorInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (color: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    const id = useId();
    useEffect(() => setDraft(value), [value]);
    const normalize = (input: string) => {
        const hex = input.trim().replace(/^#/, "");
        if (/^[\da-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
        if (/^[\da-f]{3}$/i.test(hex))
            return `#${hex
                .split("")
                .map((c) => c + c)
                .join("")
                .toLowerCase()}`;
        return null;
    };
    const valid = normalize(draft);
    return (
        <div className="studio-color-input">
            <input
                type="color"
                aria-label={label}
                value={normalize(value) || "#17201e"}
                onChange={(event) => onChange(event.target.value)}
            />
            <input
                type="text"
                aria-label={`${label} hex code`}
                value={draft}
                spellCheck={false}
                maxLength={7}
                aria-invalid={!valid}
                aria-describedby={!valid ? id : undefined}
                onChange={(event) => {
                    setDraft(event.target.value);
                    const color = normalize(event.target.value);
                    if (
                        color &&
                        event.target.value.trim().replace(/^#/, "").length === 6
                    )
                        onChange(color);
                }}
                onBlur={() => {
                    const color = normalize(draft);
                    if (color) {
                        setDraft(color);
                        onChange(color);
                    }
                }}
            />
            {!valid && (
                <small id={id} role="status">
                    Use a hex code such as #0F766E.
                </small>
            )}
        </div>
    );
}
