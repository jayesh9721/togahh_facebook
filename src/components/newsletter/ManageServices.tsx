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
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Left: Add form */}
        <div className="section-card" style={{ padding: '28px' }}>
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center mb-6 shadow-lg shadow-[var(--primary-light)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                New Service Name
              </label>
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Skin Rejuvenation"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] text-[14px] text-[var(--text)] bg-white placeholder-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] transition-all shadow-sm"
              />
            </div>
            
            <button
              onClick={handleAdd}
              className="w-full py-3.5 rounded-[var(--radius-md)] bg-[var(--primary)] text-white text-[14px] font-bold hover:bg-[var(--primary-dark)] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> Add Service
            </button>

            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Current services */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 min-h-[500px] flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">Available Services</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                {services.length} Total
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-24">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-500">No services added</p>
                <p className="text-sm text-gray-400 mt-1">Add your first service on the left.</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between px-6 py-4 rounded-2xl border-2 border-gray-50 bg-white hover:border-indigo-100 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-sm" />
                    <span className="text-base font-semibold text-gray-800">{service}</span>
                  </div>
                  <button
                    onClick={() => removeService(service)}
                    className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
