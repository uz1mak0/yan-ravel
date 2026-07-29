"use client";

import { useState } from "react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const webhookUrl = "http://localhost:5678/webhook-test/travel-search";
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
    // subscription: "", 
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

  const handleSelection = (name: string, value: string) => {
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
        stayLengthDays,
        submittedAt: new Date().toISOString(),
        source: "yan-ravel-frontend",
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const body = await res.text();
      if (!res.ok) throw new Error(`n8n ${res.status}: ${body}`);

      setIsModalOpen(false);
    }catch (error) {
      console.error("Webhook send failed:", error);
      alert("Failed to send payload to n8n. Check the logs.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   // if (!formData.subscription) return alert("Please select a subscription tier.");
  //   if (!formData.paymentMethod) return alert("Please select a payment method.");

  //   console.log("Sending payload to n8n:", formData);
  //   alert("Payload ready! Check your browser console to see the JSON data.");
  //   setIsModalOpen(false);
  // };

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
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">1. Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="number" value={formData.number} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" placeholder="+1 234 567 8900" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">2. Flight & Stay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Origin</label>
                    <input type="text" name="origin" value={formData.origin} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 uppercase" placeholder="MNL" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
                    <input type="text" name="destination" value={formData.destination} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 uppercase" placeholder="HND" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Departure</label>
                    <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Return</label>
                    <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange}
                      min={formData.departureDate || undefined}
                      max={formData.departureDate ? addDaysToDateInput(formData.departureDate, MAX_STAY_DAYS) : undefined}
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Adults</label>
                    <input type="text" name="adults" value={formData.adults} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 uppercase" placeholder="1" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Budget</label>
                    <input type="text" name="budget" value={formData.budget} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 uppercase" placeholder="$2500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Travelers</label>
                    <input type="text" name="travelers" value={formData.travelers} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 uppercase" placeholder="1" maxLength={3} />
                  </div>
                </div>
              </div>

              {/*<div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">3. Select AI Generation Tier</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["Tier 1: Low Reasoning", "Tier 2: Medium Reasoning", "Tier 3: High Reasoning"].map((tier, idx) => (
                    <div key={tier}
                      onClick={() => handleSelection("subscription", tier)}
                      className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-200 ${
                        formData.subscription === tier ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{tier.split(": ")[1]}</h4>
                      <p className="text-sm text-gray-600">{(idx + 1) * 10} USD</p>
                    </div>
                  ))}
                </div>
              </div>*/}

              <button type="submit"
                disabled={isSubmitting || !isFormComplete}
                className="w-full py-4 rounded-full shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? "Sending..." : !isFormComplete ? "Fill Out All Fields" : "Submit"}
              </button>
            </form>
          </main>
        </div>
      )}
    </div>
  );
}