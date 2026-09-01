"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

export default function RecoverAccount() {
  const router = useRouter();

  const [recoveryMode, setRecoveryMode] = useState<"password" | "username">("password");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [recoveryData, setRecoveryData] = useState({
    email: "",
  });

  const handleRecoveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecoveryData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // TODO: replace with your real password/username recovery request (no validation implemented yet)
      console.log(
        recoveryMode === "password" ? "Recovering password for:" : "Recovering username for:",
        recoveryData
      );

      setIsSubmitted(true);
    } catch (error) {
      console.error("Recovery request failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (mode: "password" | "username") => {
    setRecoveryMode(mode);
    setIsSubmitted(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-zinc-900">

      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover"
      >
        <source src={`${basePath}/travel.mp4`} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-black/40"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <main className="w-full p-8 md:p-10 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl">

          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  Account Recovery
                </h1>
                <p className="text-gray-600">
                  {recoveryMode === "password"
                    ? "Enter your email and we'll send you a reset link."
                    : "Enter your email and we'll send you your username."}
                </p>
              </div>

              {/* Mode switcher */}
              <div className="flex mb-8 bg-gray-100 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("password")}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${recoveryMode === "password" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("username")}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${recoveryMode === "username" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Username
                </button>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={recoveryData.email}
                    onChange={handleRecoveryChange}
                    className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
                    placeholder="email@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting
                    ? "Please wait..."
                    : recoveryMode === "password"
                      ? "Send Reset Link"
                      : "Recover Username"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Check Your Email
              </h1>
              <p className="text-gray-600 mb-8">
                {recoveryMode === "password"
                  ? `If an account exists for ${recoveryData.email || "that address"}, we've sent a password reset link.`
                  : `If an account exists for ${recoveryData.email || "that address"}, we've sent your username.`}
              </p>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 transition-all"
              >
                Back to Sign In
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Didn't get it? Try again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}