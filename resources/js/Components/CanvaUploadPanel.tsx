import { useId, useRef, useState } from "react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CanvaUploadPanel({
    selectedLabel,
    currentImage,
    onUpload,
    onRemove,
    disabled = false,
}: {
    selectedLabel?: string;
    currentImage?: string;
    onUpload: (file: File) => void | Promise<void>;
    onRemove?: () => void;
    disabled?: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const id = useId();
    const [dragging, setDragging] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const available = Boolean(selectedLabel) && !disabled && !busy;

    const choose = async (files: FileList | null) => {
        setDragging(false);
        if (!available || !files?.length) return;
        setError("");
        if (files.length !== 1) {
            setError("Choose one image at a time.");
            return;
        }
        const file = files[0];
        if (!IMAGE_TYPES.includes(file.type)) {
            setError("Choose a JPG, PNG, or WebP image.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError("This image is too large. Choose one smaller than 5 MB.");
            return;
        }
        setBusy(true);
        try {
            await onUpload(file);
        } catch {
            setError("Your image could not be added. Please try again.");
        } finally {
            setBusy(false);
            if (input.current) input.current.value = "";
        }
    };

    return (
        <div
            className="canva-upload-panel"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void choose(event.dataTransfer.files);
            }}
        >
            <p className="canva-panel-description">
                Add your own photos from your computer.
            </p>
            {!selectedLabel && (
                <div className="canva-panel-tip">
                    Select an image or a section on your website first. Your
                    upload will replace that section’s photo.
                </div>
            )}
            {selectedLabel && (
                <div className="canva-upload-target">
                    <span>Adding an image to</span>
                    <strong>{selectedLabel}</strong>
                </div>
            )}
            <input
                ref={input}
                id={id}
                className="canva-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={`Upload ${selectedLabel || "website"} image`}
                aria-describedby={`${id}-help`}
                disabled={!available}
                onChange={(event) => void choose(event.target.files)}
            />
            <button
                type="button"
                className={`canva-upload-dropzone ${dragging ? "is-dragging" : ""}`}
                disabled={!available}
                aria-describedby={`${id}-help`}
                onClick={() => input.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault();
                    if (available) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void choose(event.dataTransfer.files);
                }}
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 16V4m-4 4 4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                </svg>
                <strong>{busy ? "Adding image…" : "Upload an image"}</strong>
                <span>or drag and drop it here</span>
            </button>
            <p id={`${id}-help`} className="canva-upload-help">
                JPG, PNG, or WebP · Up to 5 MB
            </p>
            {error && (
                <p className="canva-upload-error" role="alert">
                    {error}
                </p>
            )}
            {currentImage && (
                <div className="canva-current-upload">
                    <div className="canva-panel-heading">
                        <h3>Current image</h3>
                        {onRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                disabled={!available}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <img
                        src={currentImage}
                        alt={`Current ${selectedLabel || "website"} image`}
                    />
                    <p>Upload another image to replace this one.</p>
                </div>
            )}
        </div>
    );
}
