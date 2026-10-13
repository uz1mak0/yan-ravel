"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type StartupPhase = "loading" | "exiting" | "done";

const SESSION_KEY = "yanRavelStartupSeen";
const MIN_MS = 3000;
const MAX_MS = 6500;
const HOLD_MS = 350;
const EXIT_MS = 700;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useStartupSequence(onComplete?: () => void) {
    const [phase, setPhase] = useState<StartupPhase>("loading");
    const [progress, setProgress] = useState(0);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useIsoLayoutEffect(() => {
        try {
            if (sessionStorage.getItem(SESSION_KEY) === "1") {
                setPhase("done");
            }
        } catch {
        }
    }, []);

    useEffect(() => {
        if (phase !== "loading") return;

        const start = performance.now();
        let raf = 0;
        const timers: ReturnType<typeof setTimeout>[] = [];

        const finish = () => {
            setProgress(100);
            timers.push(
                setTimeout(() => {
                    try {
                        sessionStorage.setItem(SESSION_KEY, "1");
                    } catch {
                        // ignore
                    }
                    setPhase("exiting");
                }, HOLD_MS)
            );
        };

        const tick = (now: number) => {
            const elapsed = now - start;
            const loaded = document.readyState === "complete";

            if (elapsed >= MIN_MS && (loaded || elapsed >= MAX_MS)) {
                finish();
                return;
            }

            const t = Math.min(elapsed / MIN_MS, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const next = Math.round(Math.min(eased * 100, 92));
            setProgress((prev) => (prev === next ? prev : next));
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            timers.forEach(clearTimeout);
        };
    }, [phase]);

    useEffect(() => {
        if (phase !== "exiting") return;
        const t = setTimeout(() => {
            setPhase("done");
            onCompleteRef.current?.();
        }, EXIT_MS);
        return () => clearTimeout(t);
    }, [phase]);

    return { phase, progress };
}