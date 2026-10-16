import Brand from "@/Components/Brand";
import { PropsWithChildren } from "react";

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-[#f6f3eb] px-5 pt-10 sm:justify-center sm:pt-0">
            <Brand />
            <p className="mt-4 text-sm text-[#71817c]">
                Build your corner of the internet.
            </p>
            <div className="mt-8 w-full overflow-hidden rounded-2xl border border-[#ded8ca] bg-[#fffdf8] px-7 py-7 shadow-[0_20px_55px_rgba(23,63,55,.09)] sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
