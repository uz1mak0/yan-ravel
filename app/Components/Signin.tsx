"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

type AuthMode = "signin" | "signup";

interface AuthFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignIn() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [authData, setAuthData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (authMode === "signup" && authData.password !== authData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (authData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      const email = authData.email.trim().toLowerCase();
      const name = authData.name.trim();

      const requestBody =
        authMode === "signup"
          ? { mode: "signup", name, email, password: authData.password }
          : { mode: "signin", email, password: authData.password };

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.message ||
          (authMode === "signup"
            ? "Could not create your account. Please try again."
            : "Invalid email or password.")
        );
        setIsSubmitting(false);
        return;
      }

      // Prefer whatever the backend returns for the user; fall back to form input
      const returnedUser = data.user ?? data;
      const userPayload = {
        email: returnedUser.email ?? email,
        name: returnedUser.name ?? name ?? email.split("@")[0],
        subscriptionTier: returnedUser.subscriptionTier ?? "Basic",
      };

      localStorage.setItem("userSession", JSON.stringify(userPayload));

      setSuccessMessage(
        authMode === "signup"
          ? "Account created! Redirecting you to your dashboard..."
          : "Welcome back! Redirecting..."
      );

      // Give the user a moment to see the confirmation before leaving the page
      setTimeout(() => {
        router.push("/landing");
      }, 1200);
    } catch (error: unknown) {
      console.error("Auth request failed:", error);
      setErrorMessage("Something went wrong. Please try again.");
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
        <source src={`${basePath}/travel.mp4`} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-black/40" />

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
          <div className="flex mb-6 bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${authMode === "signin"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${authMode === "signup"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Sign Up
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={authData.name}
                  onChange={handleAuthChange}
                  className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={authData.email}
                onChange={handleAuthChange}
                className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={authData.password}
                onChange={handleAuthChange}
                className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
                placeholder="••••••••"
                autoComplete={
                  authMode === "signin" ? "current-password" : "new-password"
                }
              />
            </div>

            {authMode === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  value={authData.confirmPassword}
                  onChange={handleAuthChange}
                  className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
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