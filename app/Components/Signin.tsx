"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // TODO: replace with your real sign-in / sign-up request (no validation implemented yet)
      console.log(authMode === "signin" ? "Signing in:" : "Signing up:", authData);

      router.push("/landing");
    } catch (error) {
      console.error("Auth request failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        <source src="/travel.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-black/40"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        <main className="w-full p-8 md:p-10 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              {authMode === "signin" ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-gray-600">
              {authMode === "signin"
                ? "Sign in to continue planning your journey."
                : "Sign up to start planning your journey."}
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex mb-8 bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${authMode === "signin" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${authMode === "signup" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" value={authData.name} onChange={handleAuthChange}
                  className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="John Doe" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={authData.email} onChange={handleAuthChange}
                className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="email@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={authData.password} onChange={handleAuthChange}
                className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="••••••••" />
            </div>

            {authMode === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={authData.confirmPassword} onChange={handleAuthChange}
                  className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="••••••••" />
              </div>
            )}

            {authMode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => router.push("/recover-account")}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isSubmitting
                ? "Please wait..."
                : authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}