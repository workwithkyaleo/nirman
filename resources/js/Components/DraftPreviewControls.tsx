import { Link } from "@inertiajs/react";

export default function DraftPreviewControls({ siteId }: { siteId: number }) {
    return (
        <aside
            className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 rounded-2xl border border-white/15 bg-[#111827]/95 p-2 text-xs font-bold text-white shadow-2xl backdrop-blur sm:bottom-6 sm:right-6"
            aria-label="Draft preview controls"
        >
            <span className="hidden px-2 text-white/70 md:inline">
                Draft preview
            </span>
            <Link
                href={route("sites.edit", siteId)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm text-[#111827] transition hover:bg-[#e8f0ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                <span aria-hidden="true">←</span>
                Back to editor
            </Link>
        </aside>
    );
}
