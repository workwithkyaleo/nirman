import type { ReactNode } from "react";

export default function CanvaSelectionBar({
    label,
    kind,
    hint,
    onClear,
    status,
    children,
}: {
    label?: string;
    kind?: string;
    hint?: string;
    onClear?: () => void;
    status?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div
            className={`canva-properties-bar ${label ? "has-selection" : "is-empty"}`}
            aria-label="Selected element controls"
        >
            {label ? (
                <>
                    <div className="canva-selection-label">
                        <span>{kind || "Selected"}</span>
                        <strong title={label}>{label}</strong>
                    </div>
                    <div className="canva-selection-controls">{children}</div>
                    <div className="canva-selection-actions">
                        {status && (
                            <span
                                className="canva-selection-status"
                                role="status"
                            >
                                {status}
                            </span>
                        )}
                        {onClear && (
                            <button
                                type="button"
                                className="canva-clear-selection"
                                aria-label="Clear selection"
                                title="Clear selection"
                                onClick={onClear}
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <p className="canva-selection-hint">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    >
                        <path d="m6 3 12 10-7 1-4 7-1-18Z" />
                    </svg>
                    {hint ||
                        "Click text, an image, or a section on your website to edit it here."}
                </p>
            )}
        </div>
    );
}
