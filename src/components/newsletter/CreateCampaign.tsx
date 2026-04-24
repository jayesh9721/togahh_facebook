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
    <div className="max-w-7xl mx-auto px-8 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-12 items-start">
        {/* Left: form */}
        <div className="bg-white p-14 shadow-2xl rounded-3xl border border-gray-100">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wider pl-1">
                  Template ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="Paste the generated template ID..."
                  className="w-full border-2 border-gray-100 rounded-2xl text-[15px] font-mono text-gray-800 bg-gray-50/50 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                  style={{ padding: '18px 24px' }}
                />
              </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wider pl-1">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Weekly Health Update..."
                className="w-full border-2 border-gray-100 rounded-2xl text-[15px] text-gray-800 bg-gray-50/50 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                style={{ padding: '18px 24px' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wider pl-1">
                  Subscribers <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={subscribers}
                    onChange={(e) => setSubscribers(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl text-[15px] text-gray-800 bg-gray-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 appearance-none transition-all pr-12"
                    style={{ padding: '18px 24px' }}
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
                <label className="block text-[13px] font-bold text-gray-700 mb-3 uppercase tracking-wider pl-1">
                  Daily Send Limit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full border-2 border-gray-100 rounded-2xl text-[15px] text-gray-800 bg-gray-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 appearance-none transition-all pr-12"
                    style={{ padding: '18px 24px' }}
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

            <button
              onClick={handleCreate}
              disabled={!canSubmit || status === "loading"}
              className={`w-full py-6 mt-4 rounded-2xl text-[16px] font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-md ${
                !canSubmit || status === "loading"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95"
              }`}
            >
              {status === "loading" ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Launching...
                </>
              ) : (
                <><span className="text-2xl">🚀</span> Launch Campaign</>
              )}
            </button>
          </div>

          {status === "success" && (
            <div className="border-4 border-green-600 bg-green-50 p-10 mt-16 shadow-[8px_8px_0px_0px_rgba(22,163,74,1)]">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-12 h-12 bg-green-600 flex items-center justify-center text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-3xl font-black text-green-900">MISSION SUCCESS</p>
              </div>
              {lastCampaignId && (
                <div className="bg-white border-4 border-green-600 p-6 flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-green-700 uppercase tracking-widest mb-2">Campaign Identifier</p>
                    <p className="text-xl font-mono font-black text-black truncate">{lastCampaignId}</p>
                  </div>
                  <button
                    onClick={() => handleCopyId(lastCampaignId)}
                    className="p-4 bg-green-100 border-2 border-green-600 hover:bg-green-200 transition-all"
                  >
                    {copiedId === lastCampaignId ? "COPIED" : "COPY"}
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="border-4 border-red-600 bg-red-50 p-10 mt-16 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
              <p className="text-2xl font-black text-red-900 mb-4 uppercase">Launch Aborted</p>
              <p className="text-lg font-bold text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 flex flex-col h-full min-h-[800px] overflow-hidden">
          <div className="p-12 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-6">
              <span className="text-[26px] font-black uppercase tracking-[0.15em] text-gray-900">Command History</span>
              <span className="bg-indigo-600 text-white px-5 py-1.5 text-lg font-black rounded-lg">{history.length}</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm font-black uppercase hover:text-red-600 underline underline-offset-4"
              >
                Wipe Logs
              </button>
            )}
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <div className="w-32 h-32 border-8 border-black flex items-center justify-center mb-8">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-2xl font-black uppercase">No Data Logs Found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {history.map((c) => (
                  <div
                    key={c.campaignId || c.createdAt}
                    className="border border-gray-100 rounded-2xl p-6 hover:bg-gray-50/50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{formatDate(c.createdAt)}</p>
                        <h4 className="text-2xl font-black text-black truncate uppercase">{c.campaignName}</h4>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 uppercase">{c.subscribers}</span>
                        <span className="text-[10px] font-black bg-black text-white px-3 py-1 uppercase">{c.dailyLimit}/day</span>
                      </div>
                    </div>

                    {c.campaignId && (
                      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">ID:</span>
                        <code className="text-xs font-black truncate flex-1">{c.campaignId}</code>
                        <button
                          onClick={() => handleCopyId(c.campaignId)}
                          className="shrink-0 text-indigo-600 hover:text-black font-black text-xs uppercase"
                        >
                          {copiedId === c.campaignId ? "Copied" : "Copy"}
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
