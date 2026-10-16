import type { AnchorHTMLAttributes, ReactNode } from "react";
import { safeHref } from "@/lib/elementDesign";

type ElementLinkProps = Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
> & {
    href?: string | null;
    editor?: boolean;
    newTab?: boolean;
    fallback?: boolean;
    children: ReactNode;
};

export default function ElementLink({
    href,
    editor,
    newTab,
    fallback,
    children,
    className,
    ...props
}: ElementLinkProps) {
    const destination = safeHref(href);
    const opensNewTab =
        newTab === true ||
        (newTab as unknown) === 1 ||
        (newTab as unknown) === "1";
    if (!destination)
        return fallback ? (
            <span className={className} style={props.style}>
                {children}
            </span>
        ) : (
            <>{children}</>
        );
    return (
        <a
            {...props}
            className={`design-element-link ${className || ""}`}
            href={destination}
            target={!editor && opensNewTab ? "_blank" : undefined}
            rel={!editor && opensNewTab ? "noopener noreferrer" : undefined}
            onClick={(event) => {
                if (editor) event.preventDefault();
                props.onClick?.(event);
            }}
        >
            {children}
        </a>
    );
}
