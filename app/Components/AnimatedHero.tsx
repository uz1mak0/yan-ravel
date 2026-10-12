"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";

type AnimatedHeroProps = {
    play?: boolean;
    title: string;
    subtitle: string;
    children?: ReactNode;
};

/**
 * Landing hero with a staggered word reveal, a soft light sweep across the title,
 * a subtitle fade-up and a gently breathing glow behind the CTA.
 * Colors stay white / gray-200 with white glows, same as the rest of the app.
 */
export default function AnimatedHero({
    play = true,
    title,
    subtitle,
    children,
}: AnimatedHeroProps) {
    const titleWords = title.split(" ");
    const subtitleWords = subtitle.split(" ");

    const TITLE_STEP = 0.14;
    const titleEnd = 0.1 + titleWords.length * TITLE_STEP + 0.7;
    const SUB_STEP = 0.035;
    const subStart = titleEnd - 0.3;
    const subEnd = subStart + subtitleWords.length * SUB_STEP + 0.6;

    return (
        <div className={`yr-hero ${play ? "yr-play" : ""}`}>
            <h1 className="yr-title text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                <span className="sr-only">{title}</span>
                <span aria-hidden="true">
                    {titleWords.map((word, i) => (
                        <Fragment key={i}>
                            <span
                                className="yr-word"
                                style={
                                    {
                                        "--d": `${0.1 + i * TITLE_STEP}s`,
                                        "--s": `${titleEnd - 0.2 + i * 0.18}s`,
                                    } as CSSProperties
                                }
                            >
                                {word}
                            </span>
                            {i < titleWords.length - 1 ? " " : null}
                        </Fragment>
                    ))}
                </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl drop-shadow-md">
                <span className="sr-only">{subtitle}</span>
                <span aria-hidden="true">
                    {subtitleWords.map((word, i) => (
                        <Fragment key={i}>
                            <span
                                className="yr-sub-word"
                                style={{ animationDelay: `${subStart + i * SUB_STEP}s` }}
                            >
                                {word}
                            </span>
                            {i < subtitleWords.length - 1 ? " " : null}
                        </Fragment>
                    ))}
                </span>
            </p>

            <div className="yr-cta" style={{ animationDelay: `${subEnd}s` }}>
                <div className="yr-cta-glow" style={{ animationDelay: `${subEnd + 0.4}s` }} />
                <div className="relative">{children}</div>
            </div>

            <style>{
                `
            .yr-hero { display: flex; flex-direction: column; align-items: center; }

            /* Everything is hidden until play, so nothing flashes behind the loader */
            .yr-word, .yr-sub-word, .yr-cta { opacity: 0; }

            /* Title: word rises, un-blurs and settles */
            .yr-word {
            display: inline-block;
            transform: translateY(0.45em) scale(0.96);
            filter: blur(14px);
            will-change: transform, filter, opacity;
            /* white text with a faint light band that sweeps through once */
            background-image: linear-gradient(
                110deg, #ffffff 0%, #ffffff 42%, #c9d4ff 50%, #ffffff 58%, #ffffff 100%
            );
            background-size: 300% 100%;
            background-position: 110% 0;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            }
            .yr-play .yr-word {
            animation:
                yr-word-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) var(--d) forwards,
                yr-sweep 1.4s ease-in-out var(--s) 1 forwards;
            }
            .yr-title { filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.45)); }

            /* Subtitle: quick word-by-word fade up */
            .yr-sub-word {
            display: inline-block;
            transform: translateY(0.6em);
            filter: blur(4px);
            }
            .yr-play .yr-sub-word {
            animation: yr-sub-in 0.6s ease-out forwards;
            }

            /* CTA: scale in, then a slow breathing glow */
            .yr-cta {
            position: relative;
            transform: translateY(16px) scale(0.92);
            }
            .yr-play .yr-cta {
            animation: yr-cta-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .yr-cta-glow {
            position: absolute;
            inset: -6px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.35);
            filter: blur(22px);
            opacity: 0;
            pointer-events: none;
            }
            .yr-play .yr-cta-glow {
            animation: yr-glow 3.2s ease-in-out infinite;
            }

            @keyframes yr-word-in {
            to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
            }
            @keyframes yr-sweep {
            from { background-position: 110% 0; }
            to   { background-position: -10% 0; }
            }
            @keyframes yr-sub-in {
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes yr-cta-in {
            to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes yr-glow {
            0%, 100% { opacity: 0.15; transform: scale(0.96); }
            50%      { opacity: 0.5;  transform: scale(1.06); }
            }

            /* Respect reduced-motion: show everything immediately, no movement */
            @media (prefers-reduced-motion: reduce) {
            .yr-word, .yr-sub-word, .yr-cta {
                opacity: 1 !important; transform: none !important; filter: none !important;
                animation: none !important;
            }
            .yr-word { background-position: 0 0 !important; }
            .yr-cta-glow { animation: none !important; opacity: 0.2; }
            }
        `
            }</style>
        </div >
    );
}