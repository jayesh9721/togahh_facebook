"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Clapperboard,
  Image as ImageIcon,
  Share2,
  Play,
  Zap,
  Settings,
  Loader2,
  CheckCircle2
} from 'lucide-react';

import { useN8nStatus } from '@/hooks/useN8nStatus';

export default function Dashboard() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const status = useN8nStatus();

  // Initialize video URL with cache busting on mount
  useEffect(() => {
    const baseUrl = "https://cdssxtquayzijmbnlqmt.supabase.co/storage/v1/object/public/n8n/finalbefore2.mp3";
    const timestamp = new Date().getTime();
    setVideoUrl(`${baseUrl}?t=${timestamp}`);
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerWebhook = async (url: string, label: string, successMessage: string) => {
    setLoading(label);
    try {
      await fetch(url);
      showToast(successMessage, 'success');
    } catch (error) {
      console.error("Webhook failed", error);
      showToast("Trigger failed check console", 'info');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateImages = () => {
    triggerWebhook(
      "https://n8n.srv1208919.hstgr.cloud/webhook/1703fb64-ec58-4e56-9ce7-bd9e16e15220",
      "images",
      "Images will be generated soon!"
    );
  };

  const handleManualTrigger = () => {
    triggerWebhook(
      "https://n8n.srv1208919.hstgr.cloud/webhook/289d4090-ac38-4c90-9876-5ca765e46211",
      "manual",
      "Video processing started. Check email!"
    );
  };

  const handleDynamicTrigger = () => {
    // Open the external n8n form for dynamic configuration
    window.open("https://n8n.srv1208919.hstgr.cloud/form/9d706a5b-d90f-42a8-8e6b-cf75ac0bf902", "_blank");
    showToast("Opening configuration form...", "info");
  };

  const handlePostVideo = () => {
    triggerWebhook(
      "https://n8n.srv1208919.hstgr.cloud/webhook/8f91f8e3-d06f-4e73-a545-e18065750416",
      "post",
      "Video posted to social media!"
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 text-white border-l-4 border-l-purple-500">
            {toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <Zap size={20} className="text-yellow-400" />}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
            Creator Studio
          </h1>
          <p className="text-white/60 mt-2 text-lg">Manage your content generation pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <div className="flex items-center gap-3 px-4 py-2 glass-panel rounded-full text-sm font-medium text-white/80">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Status: {status}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2 glass-panel rounded-full text-sm font-medium text-white/80">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Operational
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-6">

          {/* Image Generation Card */}
          <section className="glass-panel rounded-3xl p-8 transition-all hover:bg-white/[0.02]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300">
                <ImageIcon size={28} />
              </div>
              <h2 className="text-2xl font-semibold">Generate Images</h2>
            </div>
            <p className="text-white/60 mb-8 leading-relaxed">
              Create stunning visuals for your campaigns. Automatically uploads to Instagram & Facebook.
            </p>
            <button
              onClick={handleGenerateImages}
              disabled={loading === 'images'}
              className="w-full glass-button py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 text-white group"
            >
              {loading === 'images' ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Zap size={20} className="group-hover:text-yellow-300 transition-colors" />
                  <span>Start Generation</span>
                </>
              )}
            </button>
          </section>

          {/* Video Generation Card */}
          <section className="glass-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="p-3 rounded-2xl bg-pink-500/20 text-pink-300">
                <Clapperboard size={28} />
              </div>
              <h2 className="text-2xl font-semibold">Generate Videos</h2>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg">Blog Post Video</h3>
                  <span className="text-xs uppercase tracking-wider text-pink-300/80 font-bold bg-pink-500/10 px-2 py-1 rounded">Fast</span>
                </div>
                <p className="text-sm text-white/50 mb-4">Quick generation with default settings.</p>
                <button
                  onClick={handleManualTrigger}
                  disabled={loading === 'manual'}
                  className="w-full glass-button py-3 rounded-lg font-medium text-white/90 hover:text-white flex items-center justify-center gap-2"
                >
                  {loading === 'manual' ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} strokeWidth={2.5} />}
                  Run Process
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg">Dynamic Trigger</h3>
                  <span className="text-xs uppercase tracking-wider text-blue-300/80 font-bold bg-blue-500/10 px-2 py-1 rounded">Custom</span>
                </div>
                <p className="text-sm text-white/50 mb-4">Open configuration for tailored content.</p>
                <button
                  onClick={handleDynamicTrigger}
                  disabled={loading === 'dynamic'}
                  className="w-full glass-button py-3 rounded-lg font-medium text-white/90 hover:text-white flex items-center justify-center gap-2"
                >
                  {loading === 'dynamic' ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                  Configure & Run
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <section className="glass-panel rounded-3xl p-2 flex-grow flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Preview
              </h2>
              <span className="text-sm text-white/40">Latest Output</span>
            </div>

            <div className="flex-grow bg-black/40 rounded-2xl relative overflow-hidden group mx-4 mb-4">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={48} className="animate-spin text-white/20" />
                </div>
              )}
            </div>

            <div className="p-6 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white/90">Ready to Publish?</h3>
                  <p className="text-sm text-white/50">Push this content to your connected active channels.</p>
                </div>
                <button
                  onClick={handlePostVideo}
                  disabled={loading === 'post'}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                >
                  {loading === 'post' ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Share2 size={20} />
                      Post Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
