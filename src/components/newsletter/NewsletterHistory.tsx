"use client";

import { useState } from "react";
import { useNewsletterHistory, NewsletterHistoryItem } from "@/context/NewsletterHistoryContext";
import EmailPreview from "./EmailPreview";

const formatDate = (id: string) => {
  try {
    const timestamp = parseInt(id);
    if (isNaN(timestamp)) return "Recently";
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + 
           " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Recently";
  }
};

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

function HistoryItem({ item, onRemove }: { item: NewsletterHistoryItem; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (item.templateId) {
      navigator.clipboard.writeText(item.templateId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center gap-8" style={{ padding: '32px 64px 32px 32px' }}>
        <div className="flex w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center text-indigo-600 flex-shrink-0">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="text-xl font-bold text-gray-900 truncate uppercase tracking-tight">{item.topic}</h4>
            <StatusBadge status={item.status} />
          </div>
          <div className="text-sm text-gray-400 font-medium">
            <span className="uppercase tracking-widest text-[10px] text-gray-300 font-black mr-2">Specialty:</span>
            {item.service}
          </div>
        </div>

        <div className="min-w-[200px]">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Created At</div>
          <div className="text-sm font-bold text-gray-500">
            {formatDate(item.id)}
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {item.templateId && (
            <button
              onClick={handleCopy}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                copied 
                  ? "bg-green-50 text-green-600 border-green-200" 
                  : "bg-white text-indigo-600 border-indigo-50 hover:border-indigo-100"
              }`}
            >
              {copied ? "✓ Copied" : "📋 Template ID"}
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className={`rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              expanded 
                ? "bg-gray-900 text-white" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            }`}
            style={{ padding: '16px 52px' }}
          >
            {expanded ? "Hide" : "View"}
          </button>
          
          <button
            onClick={onRemove}
            className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
            title="Delete Record"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 p-8 animate-fade-in">
          {item.newsletter ? (
            <div className="max-w-4xl mx-auto">
              <EmailPreview data={item.newsletter} />
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 text-gray-800 whitespace-pre-wrap font-serif leading-relaxed text-lg shadow-inner max-w-4xl mx-auto">
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
      <div className="flex items-center gap-4 mb-10 p-2 bg-gray-50 border border-gray-100 rounded-2xl w-fit">
        {["all", "drafts", "sent"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-8 py-3.5 rounded-xl text-[14px] font-black uppercase tracking-widest transition-all duration-300 ${
              filter === f
                ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 scale-105 ring-1 ring-indigo-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
          >
            {f} <span className="ml-2 bg-indigo-50 px-2 py-0.5 rounded-md text-[12px]">{counts[f as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white shadow-2xl rounded-[40px] border border-gray-100 overflow-hidden">
        <div className="p-16 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[28px] font-black uppercase tracking-[0.15em] text-gray-900" style={{ paddingLeft: '2px' }}>Communication History</span>
            <span className="bg-indigo-600 text-white px-6 py-2 text-xl font-black rounded-xl shadow-lg shadow-indigo-100">{counts.all}</span>
          </div>
        </div>
        
        <div className="p-12 space-y-8">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 uppercase tracking-widest">No Records Found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or generate a new newsletter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filtered.map((item) => (
                <HistoryItem 
                  key={item.id} 
                  item={item} 
                  onRemove={() => removeEntry(item.id)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
