"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const basePath = process.env.NODE_ENV === "production" ? "/yan-ravel" : "";

export default function Home() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("Basic");

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  // Populate profile fields from the session saved during sign in / sign up
  useEffect(() => {
    try {
      const stored = localStorage.getItem("userSession");
      if (!stored) return;

      const session = JSON.parse(stored) as {
        email?: string;
        name?: string;
        phone?: string;
        country?: string;
      };

      setProfileData((prev) => ({
        ...prev,
        fullName: session.name ?? prev.fullName,
        email: session.email ?? prev.email,
        phone: session.phone ?? prev.phone,
        country: session.country ?? prev.country,
      }));
    } catch (error) {
      console.error("Failed to load user session:", error);
    }
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

      // Define your profile update webhook URL (similar to your travel request webhook)
      const profileWebhookUrl = `${n8nBaseUrl}${useTestWebhook ? "/webhook-test" : "/webhook"}/auth/update-profile`;

      const payload = {
        email: profileData.email,
        name: profileData.fullName,
        phone: profileData.phone,
        country: profileData.country,
        profilePicture: profilePicture, // Base64 string of the image
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

      // Keep local session in sync
      const stored = localStorage.getItem("userSession");
      const existingSession = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          ...existingSession,
          name: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          country: profileData.country,
        })
      );

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
          <main className="relative w-full max-w-2xl p-8 md:p-12 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Profile Details</h2>
              <p className="text-gray-500 mt-1">Manage your personal settings and info.</p>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 overflow-hidden flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400">👤</span>
                  )}
                </div>
                <input
                  type="file"
                  ref={profilePictureInputRef}
                  onChange={handleProfilePictureChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Upload
                  </button>
                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={profileData.country}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProfileSaving}
                className="w-full py-4 rounded-full text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 transition-all"
              >
                {isProfileSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
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
    </div>
  );
}