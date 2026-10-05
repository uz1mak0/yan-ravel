"use client";

/**
 * Yan-Ravel emblem: a glass disc holding a slowly turning globe,
 * with a plane circling it on a dashed flight path.
 * Animation classes (yr-*) come from startupStyles.ts.
 */
export default function StartupLogo() {
    return (
        <div className="relative h-36 w-36 sm:h-40 sm:w-40">
            {/* Soft pulse rings */}
            <span className="yr-ping absolute inset-0 rounded-full border border-blue-400/40" />
            <span
                className="yr-ping absolute inset-0 rounded-full border border-white/20"
                style={{ animationDelay: "1.3s" }}
            />

            {/* Glassmorphic disc (same glass recipe as the Sign In card) */}
            <div className="absolute inset-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />

            <svg
                viewBox="0 0 120 120"
                className="relative h-full w-full"
                fill="none"
                aria-hidden="true"
            >
                {/* Dashed flight path */}
                <circle
                    className="yr-ring"
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1"
                    strokeDasharray="2 6"
                    strokeLinecap="round"
                />

                {/* Globe */}
                <g className="yr-globe" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2">
                    <circle cx="60" cy="60" r="30" />
                    <ellipse cx="60" cy="60" rx="12" ry="30" />
                    <line x1="60" y1="30" x2="60" y2="90" />
                    <path d="M32 48h56M32 72h56" />
                    <line x1="30" y1="60" x2="90" y2="60" />
                </g>

                {/* Destination pin */}
                <circle className="yr-pin" cx="78" cy="50" r="3" fill="#60a5fa" />
                <circle cx="78" cy="50" r="6" fill="#60a5fa" opacity="0.25" />

                {/* Orbiting plane */}
                <g className="yr-orbit">
                    <g transform="translate(60 10) rotate(45) scale(0.85) translate(-12 -12)">
                        <path
                            d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                            fill="white"
                        />
                    </g>
                </g>
            </svg>
        </div>
    );
}