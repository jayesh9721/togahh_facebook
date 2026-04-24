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
        <div 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
            expanded ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {item.service}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight truncate">{item.topic}</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(item.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`p-3 rounded-xl transition-all ${
              expanded ? "bg-indigo-100 text-indigo-700" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            aria-label="Remove"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 sm:p-8">
            {item.templateId && (
              <div className="mb-8 bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Template Reference</p>
                  <p className="text-sm font-mono text-indigo-600 truncate">{item.templateId}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                >
                  {copied ? "Copied!" : "Copy Reference"}
                </button>
              </div>
            )}
            
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-center">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="overflow-x-auto">
                {item.newsletter ? (
                  <EmailPreview data={item.newsletter} />
                ) : item.rawFallback ? (
                  <div className="p-8">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{item.rawFallback}</pre>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-300 italic">
                    <p>No content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsletterHistory() {
  const { history, removeEntry, clearHistory } = useNewsletterHistory();
  const [filter, setFilter] = useState<"all" | "generated" | "proceeded">("all");

  const filtered = history.filter((item) => filter === "all" || item.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Newsletter History
        </h1>
        <p className="text-slate-500 mt-3 text-lg sm:text-xl max-w-3xl">
          Review and manage all clinical communication archives and generated drafts.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          {(["all", "generated", "proceeded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                filter === f 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f === "generated" ? "Drafts" : "Sent"}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold ${
                filter === f ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {f === "all" ? history.length : history.filter(h => h.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-all flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-xl uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear History
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-500">No records found</p>
          <p className="text-sm text-gray-400 mt-1">Your communication history will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((item) => (
            <HistoryCard key={item.id} item={item} onRemove={() => removeEntry(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
