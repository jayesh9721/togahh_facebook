"use client";

import { useState } from "react";
import { useNewsletterHistory, NewsletterHistoryItem } from "@/context/NewsletterHistoryContext";
import EmailPreview from "./EmailPreview";

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function StatusBadge({ status }: { status: NewsletterHistoryItem["status"] }) {
  if (status === "proceeded") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-[11px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Delivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
      Draft
    </span>
  );
}

function HistoryCard({ item, onRemove }: { item: NewsletterHistoryItem; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!item.templateId) return;
    navigator.clipboard.writeText(item.templateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300 ${
        expanded ? "shadow-2xl shadow-indigo-100/50 border-indigo-100" : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="p-6 sm:p-8 flex items-start gap-6">
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center text-indigo-600 flex-shrink-0">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h4 className="text-lg font-bold text-gray-900 truncate">{item.topic}</h4>
            <StatusBadge status={item.status} />
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1.5">
              <span className="text-gray-300 font-bold uppercase text-[10px]">Specialty:</span> {item.service}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-gray-300 font-bold uppercase text-[10px]">Created:</span> {formatDate(item.id)}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all flex items-center gap-2"
            >
              {expanded ? "Hide Preview" : "View Preview"}
            </button>
            
            {item.templateId && (
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100"
              >
                {copied ? "✓ Copied ID" : "📋 Copy Template ID"}
              </button>
            )}
            
            <button
              onClick={onRemove}
              className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 ml-auto"
              title="Delete Record"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 p-6 sm:p-8 animate-fade-in">
          {item.newsletter ? (
            <EmailPreview data={item.newsletter} />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-gray-600 whitespace-pre-wrap font-serif leading-relaxed text-base shadow-inner">
              {item.rawFallback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewsletterHistory() {
  const { history, removeEntry } = useNewsletterHistory();
  const [filter, setFilter] = useState<"all" | "drafts" | "sent">("all");

  const counts = {
    all: history.length,
    drafts: history.filter(h => h.status === "generated").length,
    sent: history.filter(h => h.status === "proceeded").length,
  };

  const filtered = history.filter((item) => {
    if (filter === "all") return true;
    if (filter === "drafts") return item.status === "generated";
    if (filter === "sent") return item.status === "proceeded";
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex items-center gap-2 mb-8 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] w-fit">
        {["all", "drafts", "sent"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-5 py-2 rounded-[var(--radius-sm)] text-[12px] font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-white text-[var(--primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {f} <span className="opacity-40 ml-1">{counts[f as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text)' }}>Communication History</span>
        </div>

        <div style={{ padding: '32px' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border-light)] flex items-center justify-center mb-6 text-[var(--text-dim)]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">No records found</h3>
              <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
                Your communication history will appear here once you generate and send newsletters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filtered.map((item) => (
                <HistoryCard key={item.id} item={item} onRemove={() => removeEntry(item.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
