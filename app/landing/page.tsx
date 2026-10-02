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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans bg-zinc-900">
      <button
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open menu"
        className="fixed top-6 right-6 z-40 p-3 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-800 font-medium hover:bg-gray-100 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>

          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsSubscriptionModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-800 font-medium hover:bg-gray-100 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Subscription
          </button>

          <button
            onClick={() => {
              setIsSidebarOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-800 font-medium hover:bg-gray-100 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>

          <div className="my-2 border-t border-gray-200" />

          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsLogoutModalOpen(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </nav>
      </aside>

      <video autoPlay loop muted playsInline className="absolute inset-0 z-0 w-full h-full object-cover">
        <source src={`${basePath}/travel.mp4`} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-0 bg-black/40"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
          Discover the World
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl drop-shadow-md">
          Your personalized itinerary is just a few clicks away. Let AI handle the planning so you can handle the exploring.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:bg-gray-100 transition-all duration-300 ease-in-out"
        >
          Start Your Journey
        </button>
      </div>

      {/* Main Itinerary Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-4xl p-8 md:p-12 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                Plan Your Amazing Journey
              </h2>
              <p className="text-gray-600">Provide your details to generate your itinerary.</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                Selected Plan: {selectedTier || "Basic"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">1. Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="number" value={formData.number} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="+1 234 567 8900" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">2. Flight & Stay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Origin City/Country</label>
                    <input type="text" name="origin" value={formData.origin} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="Manila, Philippines" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Destination City/Country</label>
                    <input type="text" name="destination" value={formData.destination} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="Tokyo, Japan" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Departure</label>
                    <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Return</label>
                    <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange}
                      min={formData.departureDate || undefined}
                      max={formData.departureDate ? addDaysToDateInput(formData.departureDate, MAX_STAY_DAYS) : undefined}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Adults</label>
                    <input type="text" name="adults" value={formData.adults} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="1" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Budget</label>
                    <input type="text" name="budget" value={formData.budget} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="$2500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Travelers</label>
                    <input type="text" name="travelers" value={formData.travelers} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="1" maxLength={3} />
                  </div>
                </div>
              </div>

              <button type="submit"
                disabled={isSubmitting || !isFormComplete}
                className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? "Sending..." : !isFormComplete ? "Fill Out All Fields" : "Submit"}
              </button>
            </form>
          </main>
        </div>
      )}

      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-2xl p-8 md:p-12 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Choose Your Plan</h2>
              <p className="text-gray-500 mt-2">Pick the tier that fits how you travel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {["Basic", "Plus", "Pro"].map((tier, idx) => (
                <div
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-200 ${selectedTier === tier ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-1">{tier}</h4>
                  <p className="text-sm text-gray-600">${(idx + 1) * 10}/mo</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedTier}
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {selectedTier ? `Select ${selectedTier}` : "Select a Plan"}
            </button>
          </main>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-xl p-8 md:p-10 bg-[#fdf4e3] rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsEditingProfile(false);
              }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Profile Details</h2>
              <p className="text-gray-500 mt-1 text-sm font-medium">
                {isEditingProfile ? "Edit your personal info." : "Your updated profile information."}
              </p>
            </div>

            {!isEditingProfile ? (
              /* VIEW MODE */
              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-24 h-24 rounded-full bg-[#EFE8DD] border-2 border-amber-200/60 overflow-hidden flex items-center justify-center shadow-inner">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
                    Verified Account
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 rounded-2xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-base font-bold text-gray-900">{profileData.fullName || "—"}</p>
                  </div>

                  <div className="p-4 bg-white/60 rounded-2xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-base font-bold text-gray-900 break-all">{profileData.email || "—"}</p>
                  </div>

                  <div className="p-4 bg-white/60 rounded-2xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-base font-bold text-gray-900">{profileData.phone || "—"}</p>
                  </div>

                  <div className="p-4 bg-white/60 rounded-2xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Country</p>
                    <p className="text-base font-bold text-gray-900">{profileData.country || "—"}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex-1 py-4 rounded-full text-lg font-bold text-white bg-black hover:bg-gray-800 transition-all shadow-md"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="py-4 px-6 rounded-full text-lg font-bold text-gray-700 bg-gray-200/70 hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="flex flex-col items-center gap-2 mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#EFE8DD] border border-gray-300 overflow-hidden flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={profilePictureInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => profilePictureInputRef.current?.click()}
                      className="text-sm text-gray-700 hover:text-black font-medium underline"
                    >
                      Upload
                    </button>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="text-sm text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-black outline-none text-gray-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-black outline-none text-gray-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-black outline-none text-gray-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={profileData.country}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-black outline-none text-gray-900 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="flex-1 py-4 rounded-full text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
                  >
                    {isProfileSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="py-4 px-6 rounded-full text-lg font-bold text-gray-700 bg-gray-200/70 hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <main className="relative w-full max-w-md p-8 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Log Out</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  router.push("/");
                }}
                className="flex-1 py-3 rounded-full text-white bg-red-600 hover:bg-red-700 font-bold transition-all"
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