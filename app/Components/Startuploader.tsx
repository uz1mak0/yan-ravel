"use client";

import { useEffect } from "react";
import StartupLogo from "./Startuplogo";
import StartupProgress from "./Startupprogress";
import { STARTUP_STYLES } from "./Startupstyles";
import { useStartupSequence } from "./Usestartupsequence";

interface StartupLoaderProps {
    /** Called once the loader has fully faded out. */
    onComplete?: () => void;
}

const APP_NAME = "Yan-Ravel";

// [left %, top %, delay s] - tiny "stars" / waypoints in the background
const SPARKS: [number, number, number][] = [
    [12, 18, 0], [82, 14, 0.6], [24, 72, 1.2], [90, 66, 0.3],
    [8, 46, 1.8], [68, 84, 0.9], [46, 10, 2.1], [56, 90, 1.5],
];

export default function StartupLoader({ onComplete }: StartupLoaderProps) {
    const { phase, progress } = useStartupSequence(onComplete);

    // Lock scrolling behind the loader (web + WebView)
    useEffect(() => {
        if (phase === "done") return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [phase]);

    if (phase === "done") return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={`Loading ${APP_NAME}`}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-zinc-950 text-white font-sans transition-all duration-700 ease-out ${phase === "exiting"
                ? "opacity-0 scale-105 pointer-events-none"
                : "opacity-100 scale-100"
                }`}
            style={{
                minHeight: "100dvh",
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
        >
            <style>{STARTUP_STYLES}</style>

            {/* Ambient glow + cinematic gradient (same overlay as the Sign In page) */}
            <div className="yr-float pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div
                className="yr-float pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
                style={{ animationDelay: "-4s" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

            {SPARKS.map(([left, top, delay], i) => (
                <span
                    key={i}
                    className="yr-twinkle pointer-events-none absolute h-1 w-1 rounded-full bg-white"
                    style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}
                />
            ))}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-6">
                <div className="yr-fade">
                    <StartupLogo />
                </div>

                <h1
                    className="mt-8 flex text-4xl sm:text-5xl font-bold tracking-tight"
                    aria-label={APP_NAME}
                >
                    {APP_NAME.split("").map((char, i) => (
                        <span
                            key={i}
                            aria-hidden="true"
                            className="yr-rise inline-block"
                            style={{ animationDelay: `${0.35 + i * 0.07}s` }}
                        >
                            {char}
                        </span>
                    ))}
                </h1>

                <p
                    className="yr-rise mt-2 text-sm text-gray-300"
                    style={{ animationDelay: "1.1s" }}
                >
                    Plan your journey.
                </p>

                <div className="yr-rise mt-10" style={{ animationDelay: "1.3s" }}>
                    <StartupProgress progress={progress} />
                </div>
            </div>
        </div>
    );
}