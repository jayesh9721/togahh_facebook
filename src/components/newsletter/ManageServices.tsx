"use client";

import { useState } from "react";
import { useServices } from "@/context/ServicesContext";

export default function ManageServices() {
  const { services, addService, removeService } = useServices();
  const [newService, setNewService] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) {
      setError("This service already exists.");
      return;
    }
    addService(trimmed);
    setNewService("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-12 items-start">
        {/* Left: Add form */}
        <div className="bg-white shadow-2xl rounded-[40px] border border-gray-100 overflow-hidden" style={{ padding: '72px' }}>
          <div className="flex flex-col gap-20">
            <div className="w-24 h-24 rounded-[32px] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>

            <div className="flex flex-col gap-12">
              <div className="space-y-8">
                <label className="block text-[18px] font-black text-gray-900 mb-6 uppercase tracking-[0.2em]" style={{ paddingLeft: '4px' }}>
                  New Service Name
                </label>
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Skin Rejuvenation"
                  className="w-full px-10 py-8 border-2 border-gray-100 rounded-[32px] text-[24px] font-bold text-gray-900 bg-gray-50/50 placeholder-gray-300 focus:outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-inner"
                />
              </div>
              
              <button
                onClick={handleAdd}
                className="w-full py-10 rounded-[40px] bg-indigo-600 text-white text-[26px] font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-6 active:scale-95"
              >
                <span className="text-5xl font-light">+</span> ADD SERVICE
              </button>

              {error && (
                <div className="flex items-center gap-4 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-base font-bold">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Current services */}
        <div className="bg-white shadow-2xl rounded-[40px] border border-gray-100 overflow-hidden min-h-[800px] flex flex-col">
          <div className="p-14 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between mb-10">
            <div className="flex items-center gap-6">
              <span className="text-[28px] font-black uppercase tracking-[0.15em] text-gray-900" style={{ paddingLeft: '2px' }}>Available Services</span>
              <span className="bg-indigo-600 text-white px-5 py-1.5 text-lg font-black rounded-lg">{services.length}</span>
            </div>
          </div>

          <div className="p-12 pt-0 space-y-6 overflow-y-auto">
            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-32">
                <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                  <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-gray-900 uppercase tracking-widest">No Services Found</p>
                <p className="text-gray-400 mt-2 text-lg">Your practice hasn't defined any specialties yet.</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between rounded-3xl border-2 border-gray-50 bg-white hover:border-indigo-100 hover:shadow-xl transition-all group"
                  style={{ padding: '32px 40px' }}
                >
                  <div className="flex items-center gap-8">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]" />
                    <span className="text-[22px] font-bold text-gray-900 tracking-tight uppercase" style={{ paddingLeft: '2px' }}>{service}</span>
                  </div>
                  <button
                    onClick={() => removeService(service)}
                    className="p-4 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
