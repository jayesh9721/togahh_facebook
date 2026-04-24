"use client";

import { useState } from "react";
import { useServices } from "@/context/ServicesContext";
import { useNewsletter, NewsletterData } from "@/context/NewsletterContext";
import { useNewsletterHistory } from "@/context/NewsletterHistoryContext";
import EmailPreview from "./EmailPreview";

const SECTIONS: { key: keyof NewsletterData; label: string }[] = [
  { key: "subjectLine",    label: "Subject Line"    },
  { key: "preheader",      label: "Preheader"       },
  { key: "headerTitle",    label: "Header Title"    },
  { key: "intro",          label: "Introduction"    },
  { key: "mainStory",      label: "Main Story"      },
  { key: "keyInsights",    label: "Key Insights"    },
  { key: "industryUpdate", label: "Industry Update" },
  { key: "proTip",         label: "Pro Tip"         },
  { key: "callToAction",   label: "Call to Action"  },
  { key: "closing",        label: "Closing"         },
  { key: "footerNote",     label: "Footer Note"     },
];

function formatText(text: string) {
  return text.replace(/\\n/g, "\n").trim();
}

function parseResponse(raw: unknown): NewsletterData | null {
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data || typeof data !== "object") return null;
  const hasStructuredFields = SECTIONS.some(({ key }) => key in (data as object));
  return hasStructuredFields ? (data as NewsletterData) : null;
}

export default function GenerateNewsletter() {
  const { services } = useServices();
  const {
    selectedService, setSelectedService,
    topic, setTopic,
    status, setStatus,
    newsletter, setNewsletter,
    rawFallback, setRawFallback,
    errorMessage, setErrorMessage,
    retryPrompt, setRetryPrompt,
    templateId, setTemplateId,
    reset,
  } = useNewsletter();

  const { addEntry } = useNewsletterHistory();
  const [copied, setCopied] = useState(false);

  const applyResponse = (raw: unknown) => {
    const structured = parseResponse(raw);
    if (structured) {
      setNewsletter(structured);
      setRawFallback("");
    } else {
      const data = Array.isArray(raw) ? raw[0] : raw as NewsletterData;
      const fallback = data?.output || data?.content || data?.newsletter;
      setRawFallback(fallback ? formatText(fallback) : JSON.stringify(raw, null, 2));
      setNewsletter(null);
    }
  };

  const saveToHistory = (nl: NewsletterData | null, rb: string, tid: string, st: "generated" | "proceeded") => {
    addEntry({
      id: Date.now().toString(),
      service: selectedService,
      topic: topic.trim(),
      newsletter: nl,
      rawFallback: rb,
      templateId: tid,
      status: st,
    });
  };

  const handleGenerate = async () => {
    if (!selectedService || !topic.trim()) return;
    setStatus("loading");
    setNewsletter(null);
    setRawFallback("");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_GENERATE_WEBHOOK_URL || "";

      if (!webhookUrl) {
        await new Promise((r) => setTimeout(r, 1200));
        const mock: NewsletterData = {
          subjectLine: `Why Is Turkey the Top ${selectedService} Destination?`,
          preheader: `Discover what makes Turkey a premier choice for ${selectedService}.`,
          headerTitle: `Turkey: The Premier ${selectedService} Destination`,
          intro: `Hello, dear reader!\n\nAre you considering ${selectedService}? Today, we'll explore why Turkey stands out as the leading destination for this life-changing procedure.`,
          mainStory: `Title: The Science Behind Turkey's Popularity\n\nTurkey is home to over 48 JCI-accredited hospitals. Each year, thousands flock to Turkey for ${selectedService}, drawn by advanced techniques and experienced surgeons.`,
          keyInsights: `→ Comprehensive Care: Clinics provide consultations and post-treatment check-ups.\n→ Advanced Technology: Cutting-edge tools minimise recovery times.\n→ Competitive Pricing: World-class results at accessible prices.`,
          proTip: `💡 Pro Tip:\n\nResearch potential clinics thoroughly. Look for patient reviews and before-and-after photos.`,
          callToAction: `Get expert guidance for your ${selectedService} journey`,
          closing: `Thank you for reading.\n\nWarm regards,\nThe Team`,
          footerNote: `You're receiving this because you subscribed to our Health & Wellness Newsletter.`,
        };
        setNewsletter(mock);
        saveToHistory(mock, "", "", "generated");
        setStatus("success");
        return;
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: selectedService, topic: topic.trim() }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);
      const raw = await res.json();
      applyResponse(raw);
      const structured = parseResponse(raw);
      saveToHistory(structured, structured ? "" : JSON.stringify(raw, null, 2), "", "generated");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleRegenerate = async () => {
    if (!retryPrompt.trim()) return;
    setStatus("regenerating");
    setErrorMessage("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_REGENERATE_WEBHOOK_URL || "";

      if (!webhookUrl) {
        await new Promise((r) => setTimeout(r, 1200));
        setNewsletter({ ...newsletter, intro: `[Regenerated based on: "${retryPrompt}"]\n\n` + (newsletter?.intro || "") } as NewsletterData);
        setRetryPrompt("");
        setStatus("success");
        return;
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService,
          topic: topic.trim(),
          retryPrompt: retryPrompt.trim(),
          previousContent: newsletter,
        }),
      });

      if (!res.ok) throw new Error(`Regeneration failed: ${res.statusText}`);
      const raw = await res.json();
      applyResponse(raw);
      setRetryPrompt("");
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Regeneration failed");
      setStatus("error");
    }
  };

  const handleProceed = async () => {
    setStatus("proceeding");
    setErrorMessage("");
    setTemplateId("");

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_HTML_WEBHOOK_URL || "";
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newsletter, service: selectedService, topic: topic.trim() }),
        });
        if (!res.ok) throw new Error(`Failed to send: ${res.statusText}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw[0] : raw;
        const tid: string = data?.["template id"] || data?.templateId || data?.template_id || "";
        setTemplateId(tid);
        saveToHistory(newsletter, rawFallback, tid, "proceeded");
      }
      setStatus("proceeded");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send newsletter");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    const text = newsletter
      ? SECTIONS.filter(({ key }) => newsletter[key])
          .map(({ label, key }) => `[${label.toUpperCase()}]\n${formatText(newsletter[key]!)}`)
          .join("\n\n---\n\n")
      : rawFallback;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = status === "loading" || status === "regenerating" || status === "proceeding";
  const hasContent = (status === "success" || status === "rejected") && (newsletter || rawFallback);

  return (
    <div className="max-w-7xl mx-auto px-8 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* Left: inputs */}
        <div className="sticky top-24 space-y-6">
          <div 
            className="section-card" 
            style={{ 
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px'
            }}
          >
            <div>
              <label className="block text-[14px] font-black text-gray-900 mb-6 uppercase tracking-[0.2em] pl-1">
                Step 1: Select Specialty
              </label>
              <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    style={{
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderWidth: '2px'
                    }}
                    className={`w-full text-left px-8 py-6 rounded-2xl text-[18px] font-bold flex items-center justify-between group transition-all duration-300 ${
                      selectedService === service
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xl shadow-indigo-100"
                        : "border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className="flex items-center gap-6">
                      <span 
                        className={`w-4 h-4 rounded-full transition-all duration-500 ${
                          selectedService === service ? "bg-indigo-600 scale-150 shadow-[0_0_20px_rgba(79,70,229,0.7)]" : "bg-gray-300"
                        }`} 
                      />
                      {service}
                    </span>
                    {selectedService === service && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-black text-gray-900 mb-6 uppercase tracking-[0.2em] pl-1">
                Step 2: Define Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Advantages of advanced Hair Transplant..."
                className="w-full h-40 px-8 py-6 border-2 border-gray-100 rounded-2xl text-[16px] text-gray-900 bg-gray-50/50 placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all resize-none shadow-sm"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !selectedService || !topic.trim()}
              className={`w-full py-8 rounded-3xl text-[20px] font-black flex items-center justify-center gap-4 transition-all duration-300 ${
                isLoading || !selectedService || !topic.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95"
              }`}
            >
              {isLoading ? (
                <><div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> CRAFTING...</>
              ) : (
                <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> GENERATE NOW</>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="section-card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column', background: 'var(--surface-light)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isLoading ? 'var(--amber)' : (newsletter ? '#10b981' : 'var(--border-mid)'), boxShadow: newsletter ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none' }} />
              <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text)' }}>AI Masterpiece</span>
            </div>
            {hasContent && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleCopy}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '100px', 
                    border: '1px solid var(--border)', 
                    background: '#fff', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  {copied ? "Copied!" : "Copy Raw"}
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {!isLoading && !hasContent && !errorMessage && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-[var(--primary-light)] flex items-center justify-center mb-6 text-[var(--primary)]">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 4v4h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3">Awaiting Input...</h3>
                <p className="text-[var(--text-muted)] text-sm max-w-sm">
                  Select your specialty and define the focus to begin generation.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center py-24 px-12 text-center">
                <div className="relative mb-16 scale-[2]">
                  <div className="w-16 h-16 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-indigo-600 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-[0.1em] animate-pulse">
                  {status === "regenerating" ? "OPTIMIZING..." : status === "proceeding" ? "FINALIZING..." : "SYNTHESIZING..."}
                </p>
                <div className="mt-8 flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full bg-indigo-600 animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="h-full flex flex-col items-center justify-center py-24 px-10 text-center">
                <div className="w-20 h-20 rounded-[32px] bg-red-50 flex items-center justify-center mb-8 rotate-12 shadow-xl shadow-red-100">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">Generation Interrupted</p>
                <p className="text-gray-400 mt-4 text-sm font-bold uppercase tracking-widest max-w-sm">{errorMessage}</p>
                <button 
                  onClick={handleGenerate} 
                  className="mt-10 px-10 py-5 bg-gray-900 text-white rounded-[24px] font-black tracking-widest hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200"
                >
                  RETRY GENERATION
                </button>
              </div>
            )}

            {hasContent && (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                {newsletter && <EmailPreview data={newsletter} />}
                {rawFallback && (
                  <div className="bg-gray-50/80 rounded-[40px] p-12 border-2 border-gray-100">
                    <pre className="whitespace-pre-wrap text-base text-gray-800 leading-relaxed font-black font-sans">{rawFallback}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {status === "proceeded" && (
            <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-10 duration-700 p-8">
              <div 
                className="bg-green-50/80 border-2 border-green-100 rounded-[48px] p-10 flex items-start gap-8"
                style={{ boxShadow: '0 30px 60px -15px rgba(34, 197, 94, 0.25)' }}
              >
                <div className="w-16 h-16 rounded-[28px] bg-green-500 flex items-center justify-center shrink-0 shadow-xl shadow-green-200">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-3xl font-black text-green-900 tracking-tight">Transmission Complete</p>
                  <p className="text-xs font-black text-green-700/60 mt-2 uppercase tracking-[0.2em]">Validated by n8n Core Engine</p>
                  {templateId && (
                    <div className="mt-8 bg-white/80 border-2 border-green-200 rounded-[28px] px-6 py-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">Internal UUID</p>
                        <p className="text-sm font-mono font-black text-gray-900 truncate">{templateId}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(templateId); }}
                        className="shrink-0 p-3 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-2xl transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={reset} 
                className="w-full py-6 text-lg font-black text-indigo-600 bg-white border-2 border-indigo-100 rounded-[32px] hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-100/20"
              >
                START NEW SESSION
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="mt-12 flex gap-6 animate-in slide-in-from-bottom-10 duration-700 p-8">
              <button
                onClick={handleProceed}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)'
                }}
                className="flex-1 py-7 text-white text-xl font-bold rounded-[32px] hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-4"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                AUTHORIZE & SEND
              </button>
              <button
                onClick={() => setStatus("rejected")}
                className="flex-1 py-7 bg-white text-gray-400 border-2 border-gray-100 text-xl font-bold rounded-[32px] hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.97] flex items-center justify-center gap-4"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                REVISE CONTENT
              </button>
            </div>
          )}

          {status === "rejected" && (
            <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-10 duration-700 p-8">
              <div className="flex items-center gap-6 px-4">
                <div className="w-14 h-14 rounded-[22px] bg-indigo-50 flex items-center justify-center shadow-lg shadow-indigo-100/50">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">AI REFINEMENT</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Specify changes for next iteration</p>
                </div>
              </div>
              <textarea
                value={retryPrompt}
                onChange={(e) => setRetryPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Enhance the medical tone, focus on hair density..."
                className="w-full px-8 py-7 bg-gray-50/80 border-2 border-gray-100 rounded-[40px] text-lg font-black text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-8 focus:ring-indigo-100/30 focus:border-indigo-500 transition-all resize-none"
              />
              <div className="flex gap-6">
                <button
                  onClick={handleRegenerate}
                  disabled={!retryPrompt.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)'
                  }}
                  className="flex-1 py-6 text-white text-lg font-black rounded-[32px] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-20 disabled:scale-100 transition-all flex items-center justify-center gap-4"
                >
                  RE-GENERATE
                </button>
                <button
                  onClick={() => setStatus("success")}
                  className="px-10 py-6 text-lg font-black text-gray-400 bg-white border-2 border-gray-100 rounded-[32px] hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  DISCARD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
