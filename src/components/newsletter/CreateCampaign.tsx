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
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
        {/* Left: form */}
        <div className="section-card sticky top-8" style={{ padding: '28px' }}>
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                Template ID <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Paste the generated template ID..."
                className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] text-[14px] font-mono text-[var(--text)] bg-white placeholder-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                Campaign Name <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Weekly Health Update..."
                className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] text-[14px] text-[var(--text)] bg-white placeholder-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] transition-all shadow-sm"
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
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-[var(--radius-md)] text-[14px] text-[var(--text)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] appearance-none transition-all pr-10 shadow-sm"
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
              className={`w-full py-3.5 mt-8 rounded-[var(--radius-md)] text-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg ${
                !canSubmit || status === "loading"
                  ? "bg-[var(--border)] text-[var(--text-dim)] cursor-not-allowed"
                  : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
              }`}
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Launching Campaign...
                </>
              ) : "🚀 Launch Campaign"}
            </button>

          {status === "success" && (
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-6 mt-6 shadow-sm shadow-green-50">
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
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 text-center mt-6">
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

        {/* Right: History */}
        <div className="section-card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text)' }}>Recent Campaigns</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{history.length} Total</span>
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
          
          <div style={{ flex: 1, padding: '24px' }}>
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mb-4 text-[var(--text-dim)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-[var(--text)] mb-1">No active campaigns</h4>
                <p className="text-sm text-[var(--text-muted)] max-w-[240px]">Configure the form on the left to start.</p>
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
