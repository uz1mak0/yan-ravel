"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TravelLoader from "./TravelLoader";
import StartupLoader from "./Startuploader";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

type AuthMode = "signin" | "signup";

interface AuthFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const cleanValue = (val: any): string => {
  if (typeof val === "string") {
    let trimmed = val.trim();
    while (trimmed.startsWith("=")) {
      trimmed = trimmed.slice(1).trim();
    }
    return trimmed;
  }
  return val ? String(val) : "";
};

export default function SignIn() {
  const router = useRouter();

  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectName, setRedirectName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      const returnedUser = data.user ?? data;
      const userPayload = {
        email: cleanValue(returnedUser.email ?? email),
        name: cleanValue(returnedUser.name ?? returnedUser.fullName ?? name ?? email.split("@")[0]),
        fullName: cleanValue(returnedUser.fullName ?? returnedUser.name ?? name ?? email.split("@")[0]),
        phone: cleanValue(returnedUser.phone ?? returnedUser.mobile ?? returnedUser.phone_number ?? ""),
        country: cleanValue(returnedUser.country ?? returnedUser.location ?? ""),
        profilePicture: cleanValue(returnedUser.profilePicture ?? returnedUser.avatar_url ?? returnedUser.profile_picture ?? null),
        avatar_url: cleanValue(returnedUser.avatar_url ?? returnedUser.profilePicture ?? null),
        subscriptionTier: cleanValue(returnedUser.subscriptionTier ?? "Basic"),
      };

      localStorage.setItem("userSession", JSON.stringify(userPayload));

      try {
        sessionStorage.setItem("yanRavelArrival", authMode);
      } catch {
        // sessionStorage unavailable
      }

      router.prefetch("/landing");
      setRedirectName(userPayload.name);
      setIsRedirecting(true);
    } catch (error: unknown) {
      console.error("Auth request failed:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-zinc-950">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
      >
        <source src={`${basePath}/travel.mp4`} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      <div className="relative z-10 w-full max-w-md p-4">
        <main className="w-full p-8 md:p-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {authMode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-300 text-sm">
              {authMode === "signin"
                ? "Sign in to continue planning your journey."
                : "Sign up to start planning your journey."}
            </p>
          </div>

          <div className="flex mb-8 bg-black/30 rounded-full p-1 border border-white/10">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${authMode === "signin"
                ? "bg-white text-black shadow-md"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${authMode === "signup"
                ? "bg-white text-black shadow-md"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Sign Up
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-500/30 backdrop-blur-md">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 backdrop-blur-md">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === "signup" && (
              <div className="relative group">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={authData.name}
                  onChange={handleAuthChange}
                  className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                  placeholder="John Doe"
                  autoComplete="name"
                />
                <label
                  htmlFor="name"
                  className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
                >
                  Full Name
                </label>
              </div>
            )}

            <div className="relative group">
              <input
                type="email"
                id="email"
                name="email"
                required
                value={authData.email}
                onChange={handleAuthChange}
                className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                placeholder="email@example.com"
                autoComplete="email"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
              >
                Email
              </label>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                minLength={6}
                value={authData.password}
                onChange={handleAuthChange}
                className="peer w-full px-4 pt-6 pb-2 pr-12 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                placeholder="••••••••"
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {authMode === "signup" && (
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={6}
                  value={authData.confirmPassword}
                  onChange={handleAuthChange}
                  className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
                >
                  Confirm Password
                </label>
              </div>
            )}

            {authMode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/recover-account")}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 mt-2 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] text-base font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting
                ? "Please wait..."
                : authMode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>


          <div className="mt-8">
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-gray-400 tracking-wide uppercase">or continue with</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-3 rounded-2xl bg-black/30 border border-white/10 hover:bg-black/50 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" className="fill-current text-white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Google
              </button>
            </div>
          </div>
        </main>
      </div>

      <TravelLoader
        visible={isRedirecting}
        mode={authMode}
        userName={redirectName}
        onComplete={() => router.push("/landing")}
      />
      <StartupLoader />
    </div>
  );
}