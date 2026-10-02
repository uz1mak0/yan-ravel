"use client";

import { useEffect, useRef, useState } from "react";

export type TravelLoaderMode = "signin" | "signup";

interface TravelLoaderProps {
    /** Show / hide the loader. Hiding plays a smooth fade-out before unmounting. */
    visible: boolean;
    /** Used for the greeting, e.g. "Welcome back, Maria". Only the first name is shown. */
    userName?: string;
    /** Changes the greeting and the first status line. */
    mode?: TravelLoaderMode;
    /** How long the plane takes to fly the full route, in ms. */
    durationMs?: number;
    /**
     * Where the animation begins, 0–100.
     * Use 100 on the destination page to pick up exactly where the previous
     * page left off (plane already landed) and simply fade out.
     */
    startAt?: number;
    /** Fires once when the plane reaches the destination. */
    onComplete?: () => void;
}

const ROUTE = "M 24 140 Q 200 -30 376 140";
const START_POINT = { x: 24, y: 140, angle: -44 };
const END_POINT = { x: 376, y: 140, angle: 44 };
const EXIT_MS = 700;

const STAGE_STARTS = [0, 30, 62, 90];

function stageFor(progressPercent: number) {
    let index = 0;
    STAGE_STARTS.forEach((start, i) => {
        if (progressPercent >= start) index = i;
    });
    return index;
}

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function TravelLoader({
    visible,
    userName,
    mode = "signin",
    durationMs = 2600,
    startAt = 0,
    onComplete,
}: TravelLoaderProps) {
    const [rendered, setRendered] = useState(visible);
    const [leaving, setLeaving] = useState(false);
    const [stageIndex, setStageIndex] = useState(() => stageFor(startAt));

    const arcRef = useRef<SVGPathElement>(null);
    const planeRef = useRef<SVGGElement>(null);
    const trailRef = useRef<SVGPathElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Mount immediately when shown, fade out then unmount when hidden.
    useEffect(() => {
        if (visible) {
            setRendered(true);
            setLeaving(false);
            return;
        }
        setLeaving(true);
        const timer = setTimeout(() => setRendered(false), EXIT_MS);
        return () => clearTimeout(timer);
    }, [visible]);

    // Drive the plane, trail and progress bar from a single progress value.
    useEffect(() => {
        if (!visible || !rendered) return;
        const arc = arcRef.current;
        if (!arc) return;

        const total = arc.getTotalLength();
        const from = Math.min(Math.max(startAt, 0), 100) / 100;
        const span = durationMs * (1 - from);

        let raf = 0;
        let startTime = 0;
        let completed = false;

        const paint = (p: number) => {
            const length = total * p;
            const point = arc.getPointAtLength(length);
            const ahead = arc.getPointAtLength(Math.min(total, length + 1));
            const behind = arc.getPointAtLength(Math.max(0, length - 1));
            const angle =
                (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;

            planeRef.current?.setAttribute(
                "transform",
                `translate(${point.x} ${point.y}) rotate(${angle})`
            );
            trailRef.current?.setAttribute("stroke-dashoffset", String(100 - p * 100));
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
            setStageIndex(stageFor(p * 100));
        };

        const tick = (now: number) => {
            if (!startTime) startTime = now;
            const t = span <= 0 ? 1 : Math.min(1, (now - startTime) / span);
            paint(from + (1 - from) * easeInOutCubic(t));

            if (t < 1) {
                raf = requestAnimationFrame(tick);
            } else if (!completed) {
                completed = true;
                onCompleteRef.current?.();
            }
        };

        paint(from);
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [visible, rendered, startAt, durationMs]);

    if (!rendered) return null;

    const firstName = userName?.trim().split(/\s+/)[0];
    const greeting =
        mode === "signup"
            ? firstName
                ? `Welcome, ${firstName}`
                : "Welcome"
            : firstName
                ? `Welcome back, ${firstName}`
                : "Welcome back";

    const stages = [
        mode === "signup" ? "Setting up your account" : "Signing you in",
        "Charting your route",
        "Preparing your itinerary",
        "Welcome aboard",
    ];

    const planeStart = startAt >= 100 ? END_POINT : START_POINT;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Loading your dashboard"
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center font-sans bg-zinc-900/90 backdrop-blur-2xl transition-opacity ease-out ${leaving ? "opacity-0 pointer-events-none" : "opacity-100"
                } ${startAt < 100 ? "yr-loader-in" : ""}`}
            style={{ transitionDuration: `${EXIT_MS}ms` }}
        >
            <style>{`
        @keyframes yr-loader-in { from { opacity: 0; } to { opacity: 1; } }
        .yr-loader-in { animation: yr-loader-in 500ms ease-out backwards; }

        @keyframes yr-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
        .yr-fade { animation: yr-fade 450ms ease-out both; }

        @keyframes yr-ping {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(3.4); opacity: 0; }
        }
        .yr-ping {
          transform-box: fill-box;
          transform-origin: center;
          animation: yr-ping 1.8s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .yr-ping { animation: none; opacity: 0; }
          .yr-fade, .yr-loader-in { animation-duration: 1ms; }
        }
      `}</style>

            {/* Soft light behind the route */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] max-w-[140vw] -translate-x-1/2 -translate-y-[65%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.09),transparent_65%)]"
            />

            <div className="relative flex flex-col items-center">
                <svg
                    viewBox="0 0 400 170"
                    className="mb-10 w-full max-w-[26rem] overflow-visible"
                    aria-hidden
                >
                    {/* Dotted route */}
                    <path
                        ref={arcRef}
                        d={ROUTE}
                        fill="none"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="1 8"
                    />

                    {/* Solid trail that follows the plane */}
                    <path
                        ref={trailRef}
                        d={ROUTE}
                        pathLength={100}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.75"
                        strokeDasharray="100"
                        strokeDashoffset={100 - startAt}
                        opacity="0.9"
                    />

                    {/* Origin */}
                    <circle cx="24" cy="140" r="3.5" fill="white" />

                    {/* Destination */}
                    <circle
                        cx="376"
                        cy="140"
                        r="3.5"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                    />
                    <circle
                        className="yr-ping"
                        cx="376"
                        cy="140"
                        r="3.5"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                    />

                    {/* Plane */}
                    <g
                        ref={planeRef}
                        transform={`translate(${planeStart.x} ${planeStart.y}) rotate(${planeStart.angle})`}
                    >
                        <path
                            d="M11 0 L-2 -2.2 L-7 -9 L-9.5 -9 L-6.5 -1.6 L-10.5 -1.2 L-12 -4 L-13.5 -4 L-12.5 0 L-13.5 4 L-12 4 L-10.5 1.2 L-6.5 1.6 L-9.5 9 L-7 9 L-2 2.2 Z"
                            fill="white"
                            transform="scale(1.25)"
                            style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.55))" }}
                        />
                    </g>
                </svg>

                <h2 className="max-w-2xl break-words text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-6xl">
                    {greeting}
                </h2>

                <div className="mt-4 h-8">
                    <p key={stageIndex} className="yr-fade text-lg text-gray-300 md:text-xl">
                        {stages[stageIndex]}
                    </p>
                </div>

                <div className="mt-8 h-[3px] w-56 overflow-hidden rounded-full bg-white/15">
                    <div
                        ref={barRef}
                        className="h-full origin-left rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                        style={{ transform: `scaleX(${startAt / 100})` }}
                    />
                </div>
            </div>
        </div>
    );
}