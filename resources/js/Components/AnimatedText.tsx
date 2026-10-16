import {
    createElement,
    useEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactNode,
} from "react";
import type { TextStyle } from "@/lib/publicTheme";
import {
    textAnimationProperties,
    textAnimationSettings,
} from "@/lib/textAnimation";
import "../../css/text-animation.css";

type AnimatedTextProps = HTMLAttributes<HTMLElement> & {
    as?: "h1" | "h2" | "h3" | "p" | "span" | "b" | "div";
    animationStyle?: TextStyle | null;
    replayKey?: string | number;
    children: ReactNode;
};

export default function AnimatedText({
    as = "span",
    animationStyle,
    replayKey,
    children,
    ...props
}: AnimatedTextProps) {
    const element = useRef<HTMLElement>(null);
    const {
        effect: animation,
        duration,
        delay,
    } = textAnimationSettings(animationStyle);
    const [state, setState] = useState<"idle" | "playing" | "done">("idle");
    const [playback, setPlayback] = useState(0);

    useEffect(() => {
        setState("idle");
        if (animation === "none") return;

        const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        const play = () => {
            if (motion?.matches) {
                setState("done");
                return;
            }
            setPlayback((current) => current + 1);
            setState("playing");
        };
        const stopForReducedMotion = () => {
            if (motion?.matches) setState("done");
        };
        motion?.addEventListener?.("change", stopForReducedMotion);

        let observer: IntersectionObserver | undefined;
        if (motion?.matches) {
            setState("done");
        } else if (typeof IntersectionObserver === "undefined") {
            play();
        } else if (element.current) {
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        play();
                        observer?.disconnect();
                    }
                },
                { threshold: 0.1 },
            );
            observer.observe(element.current);
        }

        return () => {
            observer?.disconnect();
            motion?.removeEventListener?.("change", stopForReducedMotion);
        };
    }, [animation, duration, delay, replayKey]);

    return createElement(
        as,
        { ...props, ref: element },
        animation === "none" ? (
            children
        ) : (
            <span
                key={playback}
                className="animated-text__content"
                data-text-animation={animation}
                data-animation-state={state}
                style={textAnimationProperties(animationStyle)}
                onAnimationEnd={() => setState("done")}
            >
                {children}
            </span>
        ),
    );
}
