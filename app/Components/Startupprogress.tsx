"use client";

interface StartupProgressProps {
    progress: number;
}

const MESSAGES: { from: number; text: string }[] = [
    { from: 0, text: "Packing your bags..." },
    { from: 30, text: "Charting your routes..." },
    { from: 60, text: "Finding hidden gems..." },
    { from: 90, text: "Ready for takeoff!" },
];

export default function StartupProgress({ progress }: StartupProgressProps) {
    const value = Math.max(0, Math.min(100, progress));
    const message = [...MESSAGES].reverse().find((m) => value >= m.from)!.text;

    return (
        <div className="w-64 sm:w-72 text-center">
            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="h-1.5 w-full rounded-full bg-white/10 border border-white/10 overflow-hidden"
            >
                <div
                    className="h-full w-full rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-transform duration-200 ease-out"
                    style={{ transform: `scaleX(${value / 100})`, transformOrigin: "left" }}
                />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
                <span key={message} className="yr-fade text-gray-300">
                    {message}
                </span>
                <span className="tabular-nums text-gray-400">{value}%</span>
            </div>
        </div>
    );
}