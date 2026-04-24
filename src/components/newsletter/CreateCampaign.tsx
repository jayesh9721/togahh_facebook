"use client";

import { useState } from "react";
import { useCampaigns, Campaign } from "@/context/CampaignContext";

const SUBSCRIBER_OPTIONS = ["50", "150", "200", "All Subscribers"];
const DAILY_LIMIT_OPTIONS = [30, 40, 50, 60, 70, 80, 90, 100];

type Status = "idle" | "loading" | "success" | "error";

export default function CreateCampaign() {
  const { history, addCampaign, clearHistory } = useCampaigns();

  const [templateId, setTemplateId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastCampaignId, setLastCampaignId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const canSubmit =
    templateId.trim() && campaignName.trim() && subscribers && dailyLimit !== "";

  const handleCreate = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_CAMPAIGN_WEBHOOK_URL || "";

      let campaignId = "";

      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: templateId.trim(),
            campaignName: campaignName.trim(),
            subscribers,
            dailyLimit,
          }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw[0] : raw;
        campaignId =
          data?.["campaign id"] ||
          data?.campaignId ||
          data?.campaign_id ||
          data?.id ||
          "";
      }

      const campaign: Campaign = {
        campaignId,
        campaignName: campaignName.trim(),
        templateId: templateId.trim(),
        subscribers,
        dailyLimit: dailyLimit as number,
        createdAt: new Date().toISOString(),
      };

      addCampaign(campaign);
      setLastCampaignId(campaignId);
      setStatus("success");

      setTemplateId("");
      setCampaignName("");
      setSubscribers("");
      setDailyLimit("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mb-12 text-center lg:text-left">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Create Campaign</h1>
        <p className="text-slate-500 mt-3 text-lg sm:text-xl max-w-3xl">
          Configure and launch your newsletter campaign with modern audience and send controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-12 items-start">
        {/* Left: form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8 flex flex-col gap-8 sticky top-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">
                Template ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Paste the generated template ID..."
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl text-base font-mono text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Weekly Health Update — May 2026"
                className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">
                  Subscribers <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={subscribers}
                    onChange={(e) => setSubscribers(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl text-base text-gray-900 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 appearance-none transition-all pr-12"
                  >
                    <option value="" disabled>Select group</option>
                    {SUBSCRIBER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt === "All Subscribers" ? "All Subscribers" : `${opt} Subscribers`}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">
                  Daily Send Limit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl text-base text-gray-900 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 appearance-none transition-all pr-12"
                  >
                    <option value="" disabled>Select limit</option>
                    {DAILY_LIMIT_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n} emails / day</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canSubmit || status === "loading"}
            className="w-full py-4 px-6 bg-indigo-600 text-white text-base font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-3 transform active:scale-[0.98]"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Launching Campaign...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Launch Campaign
              </>
            )}
          </button>

          {status === "success" && (
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-6 shadow-sm shadow-green-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-800">Campaign Launched!</p>
              </div>
              {lastCampaignId && (
                <div className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Campaign ID</p>
                    <p className="text-sm font-mono font-bold text-gray-900 truncate">{lastCampaignId}</p>
                  </div>
                  <button
                    onClick={() => handleCopyId(lastCampaignId)}
                    className="shrink-0 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    {copiedId === lastCampaignId ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-base font-bold text-red-800">Launch Failed</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-200 p-8 flex flex-col gap-6 min-h-[520px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">Recent Campaigns</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                {history.length} Total
              </span>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-24">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-500">No active campaigns</p>
                <p className="text-sm text-gray-400 mt-1">Configure the form on the left to start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {history.map((c, i) => (
                  <div key={i} className="group bg-white border-2 border-gray-50 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-lg hover:shadow-gray-50 transition-all duration-300">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.campaignName}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">{formatDate(c.createdAt)}</p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-5">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-bold text-gray-600">
                          {c.subscribers === "All Subscribers" ? "All" : c.subscribers} Subs
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs font-bold text-gray-600">{c.dailyLimit} / day</span>
                      </div>
                    </div>

                    {c.campaignId && (
                      <div className="bg-gray-50/50 rounded-xl px-3 py-2 flex items-center justify-between gap-3 border border-gray-100">
                        <p className="text-[10px] font-mono font-bold text-gray-400 truncate">{c.campaignId}</p>
                        <button
                          onClick={() => handleCopyId(c.campaignId)}
                          className="shrink-0 p-1.5 text-gray-300 hover:text-indigo-600 transition-colors"
                        >
                          {copiedId === c.campaignId ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
