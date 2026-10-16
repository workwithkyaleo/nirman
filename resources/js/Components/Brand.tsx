import { Link } from "@inertiajs/react";
import { SVGAttributes } from "react";

export function BrandMark(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect width="48" height="48" rx="24" fill="#173F37" />
            <path
                d="M14 33V15l10 10 10-10v18"
                stroke="#F4C557"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 33h20"
                stroke="#FFFDF8"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="Nirmaan home"
        >
            <BrandMark className={compact ? "h-9 w-9" : "h-12 w-12"} />
            <span
                className={`${compact ? "text-xl" : "text-2xl"} font-semibold tracking-[-0.04em] text-[#173f37]`}
            >
                nirmaan<span className="text-[#d59624]">.</span>
            </span>
        </Link>
    );
}
