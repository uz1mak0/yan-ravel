const steps = [
    { title: "Share your details", text: "Just your basic information." },
    { title: "I plan the journey", text: "I handle everything else." },
    { title: "You enjoy the trip", text: "Travel with nothing to worry about." },
];

export default function BrandIntro() {
    return (
        <section className="relative w-full max-w-md lg:max-w-xl text-center lg:text-left text-white">
            <style>{`
        @keyframes yr-shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .yr-wordmark {
          background-image: linear-gradient(90deg, #ffffff 0%, #bfdbfe 25%, #60a5fa 50%, #f9a8d4 75%, #ffffff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: yr-shimmer 8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .yr-wordmark { animation: none; }
        }
      `}</style>

            {/* soft glow behind the intro */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-rose-500/20 blur-3xl"
            />

            <div className="relative">
                {/* logo lockup */}
                <div className="flex items-center justify-center lg:justify-start gap-4">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_25px_rgba(96,165,250,0.35)]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-blue-300"
                        >
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                        </svg>
                    </div>
                    <h1 className="yr-wordmark text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-none pb-1">
                        Yan-ravel
                    </h1>
                </div>

                <p className="mt-5 lg:mt-8 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white text-balance">
                    Here to serve all of you, Travelers!
                </p>

                <p className="mt-2 lg:mt-3 text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed text-balance max-w-md mx-auto lg:mx-0">
                    Just provide your basic information and I&apos;ll do the rest.
                </p>

                {/* the three-step flow, desktop only so the form stays near the top on mobile */}
                <ol className="relative mt-10 hidden lg:block max-w-md">
                    <div
                        aria-hidden="true"
                        className="absolute left-5 top-5 bottom-5 border-l border-dashed border-white/25"
                    />
                    {steps.map((step, i) => (
                        <li key={step.title} className="relative flex items-center gap-4 py-3">
                            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-sm font-bold text-blue-300">
                                {i + 1}
                            </span>
                            <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                                <p className="text-sm font-semibold text-white">{step.title}</p>
                                <p className="text-xs text-gray-300">{step.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}