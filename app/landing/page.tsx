"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import TravelLoader, { type TravelLoaderMode } from "../Components/TravelLoader";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper function to strip literal '=' signs from string values
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

export default function Home() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Loader state
  const [isArriving, setIsArriving] = useState(true);
  const [arrivalMode, setArrivalMode] = useState<TravelLoaderMode>("signin");
  const [arrivalName, setArrivalName] = useState("");

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("Basic");

  // Profile Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Change Password states (inside Profile Modal)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    country: "",
    address: "",
    bio: "",
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  // Read session safely from localStorage
  const readSession = () => {
    try {
      const stored = localStorage.getItem("userSession");
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  // Hydrate state directly on initial load
  useEffect(() => {
    const session = readSession();
    if (session) {
      setProfileData((prev) => ({
        ...prev,
        fullName: cleanValue(session.fullName || session.name || prev.fullName),
        email: cleanValue(session.email || prev.email),
        phone: cleanValue(session.phone || prev.phone),
        country: cleanValue(session.country || prev.country),
      }));

      const pic = session.profilePicture || session.avatar_url;
      if (pic) setProfilePicture(cleanValue(pic));
      setMustChangePassword(session.mustChangePassword === true);
    }
  }, []);

  // Sync profile data when Profile Modal opens
  useEffect(() => {
    async function syncProfile() {
      if (!isProfileModalOpen) return;

      const session = readSession();

      const targetEmail = cleanValue(session?.email || profileData.email);
      const initialName = cleanValue(session?.fullName || session?.name || profileData.fullName);
      const initialPhone = cleanValue(session?.phone || profileData.phone);
      const initialCountry = cleanValue(session?.country || profileData.country);
      const initialPic = cleanValue(session?.profilePicture || session?.avatar_url || profilePicture);

      // Apply cleaned values to UI
      setProfileData((prev) => ({
        ...prev,
        fullName: initialName || prev.fullName,
        email: targetEmail || prev.email,
        phone: initialPhone || prev.phone,
        country: initialCountry || prev.country,
      }));

      if (initialPic) setProfilePicture(initialPic);

      if (!supabase || !targetEmail) return;

      try {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("email", targetEmail)
          .maybeSingle();

        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", targetEmail)
          .maybeSingle();

        const record = userData || profData;

        if (record) {
          const finalName = cleanValue(record.name || record.full_name || record.fullName || initialName);
          const finalEmail = cleanValue(record.email || targetEmail);
          const finalPhone = cleanValue(record.phone || record.mobile || record.phone_number || initialPhone);
          const finalCountry = cleanValue(record.country || record.location || initialCountry);
          const finalPic = cleanValue(record.avatar_url || record.profile_picture || record.profilePicture || initialPic);

          setProfileData((prev) => ({
            ...prev,
            fullName: finalName,
            email: finalEmail,
            phone: finalPhone,
            country: finalCountry,
          }));

          if (finalPic) setProfilePicture(finalPic);

          localStorage.setItem(
            "userSession",
            JSON.stringify({
              ...session,
              name: finalName,
              fullName: finalName,
              email: finalEmail,
              phone: finalPhone,
              country: finalCountry,
              profilePicture: finalPic,
              avatar_url: finalPic,
            })
          );
        }
      } catch (err) {
        console.error("Error syncing profile from Supabase:", err);
      }
    }

    syncProfile();
  }, [isProfileModalOpen]);

  useEffect(() => {
    let mode: string | null = null;
    try {
      mode = sessionStorage.getItem("yanRavelArrival");
    } catch {
      // ignore
    }

    if (mode !== "signin" && mode !== "signup") {
      setIsArriving(false);
      return;
    }

    try {
      const stored = localStorage.getItem("userSession");
      if (stored) setArrivalName(cleanValue(JSON.parse(stored)?.name ?? ""));
    } catch {
      // ignore
    }
    setArrivalMode(mode as TravelLoaderMode);

    const timer = setTimeout(() => {
      try {
        sessionStorage.removeItem("yanRavelArrival");
      } catch {
        // ignore
      }
      setIsArriving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    if (profilePictureInputRef.current) profilePictureInputRef.current.value = "";
  };

  const resetPasswordForm = () => {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setShowPasswords(false);
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError("");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPasswordError("Please fill in all fields.");
    }
    if (newPassword.length < 6) {
      return setPasswordError("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError("New password and confirmation do not match.");
    }
    if (newPassword === currentPassword) {
      return setPasswordError("New password must be different from the current one.");
    }

    const session = readSession();
    const email = cleanValue(session?.email || profileData.email);
    if (!email) return setPasswordError("Could not determine your account. Please sign in again.");

    try {
      setIsPasswordSaving(true);

      const base = (
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678"
      ).replace(/\/$/, "");
      const testMode = process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === "true";
      const url = `${base}${testMode ? "/webhook-test" : "/webhook"}/auth/change-password`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET!,
        },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);

      localStorage.setItem(
        "userSession",
        JSON.stringify({ ...(session || {}), mustChangePassword: false })
      );
      setMustChangePassword(false);

      resetPasswordForm();
      setIsChangingPassword(false);
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Password change failed:", error);
      setPasswordError(
        error instanceof Error && error.message
          ? error.message
          : "Failed to update password. Please try again."
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProfileSaving(true);

      const cleanedName = cleanValue(profileData.fullName);
      const cleanedEmail = cleanValue(profileData.email);
      const cleanedPhone = cleanValue(profileData.phone);
      const cleanedCountry = cleanValue(profileData.country);
      const cleanedPic = cleanValue(profilePicture);

      if (supabase && cleanedEmail) {
        try {
          await supabase.from("users").upsert(
            {
              email: cleanedEmail,
              name: cleanedName,
              phone: cleanedPhone,
              country: cleanedCountry,
              avatar_url: cleanedPic,
            },
            { onConflict: "email" }
          );

          await supabase.from("profiles").upsert(
            {
              email: cleanedEmail,
              full_name: cleanedName,
              phone: cleanedPhone,
              country: cleanedCountry,
              profile_picture: cleanedPic,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        } catch (spErr) {
          console.warn("Direct Supabase save warning:", spErr);
        }
      }

      const n8nBaseUrl = (
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678"
      ).replace(/\/$/, "");
      const useTestWebhook = process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === "true";
      const profileWebhookUrl = `${n8nBaseUrl}${useTestWebhook ? "/webhook-test" : "/webhook"}/auth/update-profile`;

      const payload = {
        email: cleanedEmail,
        name: cleanedName,
        phone: cleanedPhone,
        country: cleanedCountry,
        profilePicture: cleanedPic,
      };

      const res = await fetch(profileWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET!,
        },
        body: JSON.stringify(payload),
      });

      const resBody = await res.text();
      if (!res.ok) throw new Error(`n8n ${res.status}: ${resBody}`);

      const session = readSession() || {};
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          ...session,
          name: cleanedName,
          fullName: cleanedName,
          email: cleanedEmail,
          phone: cleanedPhone,
          country: cleanedCountry,
          profilePicture: cleanedPic,
          avatar_url: cleanedPic,
        })
      );

      setIsEditingProfile(false);
      setIsProfileModalOpen(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const n8nBaseUrl = (
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "http://localhost:5678"
  ).replace(/\/$/, "");
  const useTestWebhook = process.env.NEXT_PUBLIC_N8N_USE_TEST_WEBHOOK === "true";
  const webhookUrl = `${n8nBaseUrl}${useTestWebhook ? "/webhook-test" : "/webhook"}/travel-request`;
  const MAX_STAY_DAYS = 90;
  const MS_IN_DAY = 1000 * 60 * 60 * 24;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    budget: "",
    travelers: "",
    adults: "",
  });

  const requiredFields: (keyof typeof formData)[] = [
    "name",
    "email",
    "number",
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "budget",
    "travelers",
    "adults",
  ];

  const isFormComplete = requiredFields.every((field) => formData[field].trim() !== "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseDateInput = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const addDaysToDateInput = (value: string, days: number) => {
    const date = parseDateInput(value);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormComplete) return alert("Please fill out all fields before submitting.");
    if (!webhookUrl) return alert("Missing WEBHOOK_URL");
    if (!formData.departureDate || !formData.returnDate) {
      return alert("Please select both departure and return dates.");
    }

    const departure = parseDateInput(formData.departureDate);
    const returnDate = parseDateInput(formData.returnDate);
    const stayLengthDays = Math.round((returnDate.getTime() - departure.getTime()) / MS_IN_DAY);

    if (Number.isNaN(departure.getTime()) || Number.isNaN(returnDate.getTime())) {
      return alert("Invalid date input. Please re-check your travel dates.");
    }
    if (stayLengthDays < 1) {
      return alert("Return date must be at least 1 day after departure date.");
    }
    if (stayLengthDays > MAX_STAY_DAYS) {
      return alert(`Return date must be within ${MAX_STAY_DAYS} days of departure for hotel search.`);
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        subscriptionTier: selectedTier || "Basic",
        stayLengthDays,
        submittedAt: new Date().toISOString(),
        source: "yan-ravel-frontend",
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": process.env.NEXT_PUBLIC_N8N_WEBHOOK_SECRET!,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.text();
      if (!res.ok) throw new Error(`n8n ${res.status}: ${body}`);

      setIsModalOpen(false);
    } catch (error) {
      console.error("Webhook send failed:", error);
      alert("Failed to send payload to n8n. Check the logs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-zinc-950">
      <button
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open menu"
        className="fixed top-6 right-6 z-40 p-3 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Glassmorphic Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-black/40 backdrop-blur-3xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white tracking-tight">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-2">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 font-medium hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>

          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsSubscriptionModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 font-medium hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Subscription
          </button>

          {/* <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-200 font-medium hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button> */}

          <div className="my-2 border-t border-white/10" />

          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsLogoutModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 font-medium hover:bg-rose-500/10 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      <video autoPlay loop muted playsInline className="absolute inset-0 z-0 w-full h-full object-cover scale-105">
        <source src={`${basePath}/travel.mp4`} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
          Discover the World
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl drop-shadow-md">
          Your personalized itinerary is just a few clicks away. Let AI handle the planning so you can handle the exploring.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-white text-black rounded-full font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:bg-gray-200 active:scale-95 transition-all duration-300 ease-in-out"
        >
          Start Your Journey
        </button>
      </div>

      {/* Main Itinerary Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-4xl p-8 md:p-12 bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                Plan Your Amazing Journey
              </h2>
              <p className="text-gray-300">Provide your details to generate your itinerary.</p>
              <span className="inline-block mt-4 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
                Selected Plan: {selectedTier || "Basic"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-white/10 pb-2 text-gray-200">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative group">
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="John Doe" />
                    <label htmlFor="name" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Full Name</label>
                  </div>
                  <div className="relative group">
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="email@example.com" />
                    <label htmlFor="email" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Email</label>
                  </div>
                  <div className="relative group">
                    <input type="tel" id="number" name="number" value={formData.number} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="+1 234 567 8900" />
                    <label htmlFor="number" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Mobile Number</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-white/10 pb-2 text-gray-200">Flight & Stay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative group">
                    <input type="text" id="origin" name="origin" value={formData.origin} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Origin" />
                    <label htmlFor="origin" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Origin City/Country</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="destination" name="destination" value={formData.destination} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Destination" />
                    <label htmlFor="destination" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Destination City/Country</label>
                  </div>
                  <div className="relative group">
                    <input type="date" id="departureDate" name="departureDate" value={formData.departureDate} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    <label htmlFor="departureDate" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-focus:text-blue-400 cursor-text">Departure</label>
                  </div>
                  <div className="relative group">
                    <input type="date" id="returnDate" name="returnDate" value={formData.returnDate} onChange={handleChange}
                      min={formData.departureDate || undefined}
                      max={formData.departureDate ? addDaysToDateInput(formData.departureDate, MAX_STAY_DAYS) : undefined}
                      required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                    <label htmlFor="returnDate" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-focus:text-blue-400 cursor-text">Return</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="adults" name="adults" value={formData.adults} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="1" maxLength={3} />
                    <label htmlFor="adults" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Adults</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="budget" name="budget" value={formData.budget} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="$2500" />
                    <label htmlFor="budget" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Budget</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="travelers" name="travelers" value={formData.travelers} onChange={handleChange} required
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="1" maxLength={3} />
                    <label htmlFor="travelers" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Travelers</label>
                  </div>
                </div>
              </div>

              <button type="submit"
                disabled={isSubmitting || !isFormComplete}
                className="w-full py-4 mt-4 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                {isSubmitting ? "Sending..." : !isFormComplete ? "Fill Out All Fields" : "Submit Itinerary"}
              </button>
            </form>
          </main>
        </div>
      )}

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-2xl p-8 md:p-12 bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Choose Your Plan</h2>
              <p className="text-gray-300 mt-2">Pick the tier that fits how you travel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {["Basic", "Plus", "Pro"].map((tier, idx) => (
                <div
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-200 ${selectedTier === tier
                    ? "border-blue-400 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "border-white/20 bg-black/20 hover:border-blue-400/50 hover:bg-white/5"
                    }`}
                >
                  <h4 className="font-bold text-white text-lg mb-1">{tier}</h4>
                  <p className="text-sm text-gray-400">${(idx + 1) * 10}/mo</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedTier}
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="w-full py-4 rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {selectedTier ? `Select ${selectedTier}` : "Select a Plan"}
            </button>
          </main>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-xl p-8 md:p-10 bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsEditingProfile(false);
                setIsChangingPassword(false);
                resetPasswordForm();
              }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Profile Details</h2>
              <p className="text-gray-300 mt-1 text-sm font-medium">
                {isChangingPassword
                  ? "Choose a new password for your account."
                  : isEditingProfile
                    ? "Edit your personal info."
                    : "Your updated profile information."}
              </p>
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePasswordSave} className="space-y-6">
                {mustChangePassword && (
                  <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                    You signed in with a temporary password. Please set a new one now.
                  </p>
                )}

                {([
                  { id: "currentPassword", label: "Current or Temporary Password", auto: "current-password" },
                  { id: "newPassword", label: "New Password", auto: "new-password" },
                  { id: "confirmPassword", label: "Confirm New Password", auto: "new-password" },
                ] as const).map((f) => (
                  <div key={f.id} className="relative group">
                    <input
                      type={showPasswords ? "text" : "password"}
                      id={f.id}
                      name={f.id}
                      value={passwordData[f.id]}
                      onChange={handlePasswordInputChange}
                      autoComplete={f.auto}
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent"
                      placeholder={f.label}
                    />
                    <label
                      htmlFor={f.id}
                      className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text"
                    >
                      {f.label}
                    </label>
                  </div>
                ))}

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="accent-white"
                  />
                  Show passwords
                </label>

                {passwordError && (
                  <p
                    role="alert"
                    className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3"
                  >
                    {passwordError}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={isPasswordSaving}
                    className="flex-1 py-4 rounded-2xl text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    {isPasswordSaving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      resetPasswordForm();
                    }}
                    className="py-4 px-6 rounded-2xl text-lg font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : !isEditingProfile ? (
              <div className="space-y-6">
                {mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full text-left text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 hover:bg-amber-500/20 transition-colors"
                  >
                    You&apos;re using a temporary password. Tap here to set a new one.
                  </button>
                )}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/20 overflow-hidden flex items-center justify-center shadow-inner">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full">
                    Verified Account
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-base font-bold text-white">{profileData.fullName || "—"}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-base font-bold text-white break-all">{profileData.email || "—"}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-base font-bold text-white">{profileData.phone || "—"}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Country</p>
                    <p className="text-base font-bold text-white">{profileData.country || "—"}</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex-1 py-4 rounded-2xl text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="py-4 px-5 rounded-2xl text-lg font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="py-4 px-6 rounded-2xl text-lg font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-20 h-20 rounded-full bg-black/40 border border-white/20 overflow-hidden flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <input type="file" ref={profilePictureInputRef} onChange={handleProfilePictureChange} accept="image/*" className="hidden" />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => profilePictureInputRef.current?.click()} className="text-sm text-gray-300 hover:text-white font-medium underline">
                      Upload
                    </button>
                    {profilePicture && (
                      <button type="button" onClick={handleRemoveProfilePicture} className="text-sm text-rose-400 hover:text-rose-500 font-medium underline">
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="relative group">
                    <input type="text" id="editFullName" name="fullName" value={profileData.fullName} onChange={handleProfileChange}
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Name" />
                    <label htmlFor="editFullName" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Full Name</label>
                  </div>
                  <div className="relative group">
                    <input type="email" id="editEmail" name="email" value={profileData.email} onChange={handleProfileChange}
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Email" />
                    <label htmlFor="editEmail" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Email</label>
                  </div>
                  <div className="relative group">
                    <input type="tel" id="editPhone" name="phone" value={profileData.phone} onChange={handleProfileChange}
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Phone" />
                    <label htmlFor="editPhone" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Phone</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="editCountry" name="country" value={profileData.country} onChange={handleProfileChange}
                      className="peer w-full px-4 pt-6 pb-2 rounded-2xl bg-black/20 border border-white/20 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all placeholder-transparent" placeholder="Country" />
                    <label htmlFor="editCountry" className="absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-400 cursor-text">Country</label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="submit" disabled={isProfileSaving}
                    className="flex-1 py-4 rounded-2xl text-lg font-bold text-black bg-white hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {isProfileSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)}
                    className="py-4 px-6 rounded-2xl text-lg font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      )}

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-md p-8 bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 text-center">
            <h3 className="text-2xl font-bold mb-2">Log Out</h3>
            <p className="text-gray-300 mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-4 rounded-2xl text-white bg-white/10 border border-white/20 hover:bg-white/20 font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  router.push("/");
                }}
                className="flex-1 py-4 rounded-2xl text-white bg-rose-600 hover:bg-rose-700 shadow-[0_0_15px_rgba(225,29,72,0.4)] font-bold active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </main>
        </div>
      )}

      <TravelLoader
        visible={isArriving}
        startAt={100}
        mode={arrivalMode}
        userName={arrivalName}
      />
    </div>
  );
}