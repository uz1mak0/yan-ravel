"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

const n8nBaseUrl = (
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678"
).replace(/\/$/, "");
const useTestWebhook = process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === "true";
const recoverWebhookUrl = `${n8nBaseUrl}${useTestWebhook ? "/webhook-test" : "/webhook"}/auth/recover-account`;

export default function RecoverAccount() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(recoverWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET!,
        },
        body: JSON.stringify({ email: cleanedEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error("Recovery request failed:", error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-zinc-950">
      <img
        src={`${basePath}/background.jpg`}
        alt="Background"
        className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <main className="w-full p-8 md:p-10 bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                  Account Recovery
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  Enter the email you registered with and we&apos;ll send you a temporary password.
                </p>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-6">

                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                    autoComplete="email"
                    className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                    placeholder="email@example.com"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
                  >
                    Email Address
                  </label>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? "Sending..." : "Send Temporary Password"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                Check Your Email
              </h1>
              <p className="text-gray-300 mb-2 leading-relaxed">
                If an account exists for {email.trim() || "that address"}, we&apos;ve sent a temporary password.
              </p>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                It expires in 30 minutes. Sign in with it, then open Profile &rarr; Change Password to set your own.
                Don&apos;t see it? Check your spam folder.
              </p>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-4 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                Back to Sign In
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-6 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Didn&apos;t get it? Try again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}