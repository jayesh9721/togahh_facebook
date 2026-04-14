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
  CheckCircle2,
  Activity
} from 'lucide-react';

import {
  Card,
  Badge,
  Spinner,
  PrimaryButton,
  SecondaryButton,
  SectionTitle
} from './components';

import { socialSupabase } from '../lib/socialSupabase';

export default function SocialDash() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const videoRef = useRef(null);

  // Colors
  const medicalBlue = "#0284c7";
  const medicalTeal = "#0d9488";

  // Live status from Supabase
  const [status, setStatus] = useState("Connecting...");

  // Initialize video URL and real-time status
  useEffect(() => {
    const sampleUrl = "https://cdssxtquayzijmbnlqmt.supabase.co/storage/v1/object/public/n8n/finalbefore2.mp3";
    const timestamp = Date.now();
    setVideoUrl(`${sampleUrl}?t=${timestamp}`);

    // 1. Fetch initial status from n8n table
    const fetchStatus = async () => {
      try {
        const { data, error } = await socialSupabase
          .from('n8n')
          .select('status')
          .order('id', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching initial status:', error);
          setStatus("Status Unavailable");
        } else if (data && data.length > 0) {
          setStatus(data[0].status);
        } else {
          setStatus("Operational");
        }
      } catch (err) {
        console.error('Unexpected error fetching status:', err);
        setStatus("Status Error");
      }
    };

    fetchStatus();

    // 2. Subscribe to real-time status updates
    const channel = socialSupabase
      .channel('n8n-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'n8n' },
        (payload) => {
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      socialSupabase.removeChannel(channel);
    };
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerWebhook = async (url, label, successMessage) => {
    setLoading(label);
    try {
      const response = await fetch(url);
      if (response.ok) {
        showToast(successMessage, 'success');
      } else {
        showToast(`Trigger failed: ${response.statusText}`, 'info');
      }
    } catch (error) {
      console.error("Webhook failed", error);
      showToast("Trigger failed. Check console for details.", 'info');
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
    <div key="social-dash-v4-final" className="flex flex-col gap-8 max-w-6xl mx-auto py-8 text-slate-700 px-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-toast">
          <div 
            className="px-6 py-4 rounded-xl flex items-center gap-3 bg-white shadow-xl border border-slate-100 border-l-4"
            style={{ borderLeftColor: medicalBlue }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} style={{ color: "var(--green)" }} />
            ) : (
              <Activity size={20} style={{ color: medicalBlue }} />
            )}
            <p className="font-semibold text-slate-800">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Creator Studio
          </h1>
          <p className="text-slate-500 mt-2 text-base sm:text-lg">Manage your social media content generation pipeline</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge 
            text="v2.0 Connected" 
            color={medicalBlue} 
            bg="var(--primary-light)" 
          />
          <Badge 
            text={status} 
            color="var(--green)" 
            bg="var(--green-light)" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Controls */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-10">

          {/* Image Generation Card */}
          <Card className="hover:border-sky-200 transition-all" style={{ padding: "var(--card-padding, 40px)" }}>
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="p-4 rounded-2xl bg-sky-50"
                style={{ color: medicalBlue }}
              >
                <ImageIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Social Image Creator</h2>
            </div>
            
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition-all">
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                Create professional social media visuals. Assets are automatically scaled for Instagram, Facebook, and LinkedIn.
              </p>
              <PrimaryButton
                onClick={handleGenerateImages}
                disabled={loading === 'images'}
                style={{ background: medicalBlue, padding: "14px" }}
              >
                {loading === 'images' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size={16} color="white" /> Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Zap size={16} />
                    Generate Social Images
                  </div>
                )}
              </PrimaryButton>
            </div>
          </Card>

          {/* Automated Video Card */}
          <Card className="hover:border-teal-200 transition-all" style={{ padding: "var(--card-padding, 40px)" }}>
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="p-4 rounded-2xl bg-teal-50"
                style={{ color: medicalTeal }}
              >
                <Clapperboard size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Automated Reels</h2>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition-all">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">AI Generation</h3>
                <Badge text="Fast" color="var(--blue)" bg="var(--blue-light)" />
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">Transform blog posts and patient stories into engaging vertical videos for social channels.</p>
              <SecondaryButton
                onClick={handleManualTrigger}
                disabled={loading === 'manual'}
                style={{ padding: "12px" }}
              >
                {loading === 'manual' ? (
                  <Spinner size={14} />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Play size={14} fill="currentColor" /> Launch Video AI
                  </div>
                )}
              </SecondaryButton>
            </div>
          </Card>

          {/* Manual Input Card */}
          <Card className="hover:border-amber-200 transition-all" style={{ padding: "var(--card-padding, 40px)" }}>
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="p-4 rounded-2xl bg-amber-50"
                style={{ color: "var(--amber)" }}
              >
                <Settings size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Custom Spotlight</h2>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition-all">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Manual Control</h3>
                <Badge text="Custom" color="var(--amber)" bg="var(--amber-light)" />
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">Manually input custom scripts, tones, and visual scenes for total creative control.</p>
              <SecondaryButton
                onClick={handleDynamicTrigger}
                disabled={loading === 'dynamic'}
                style={{ padding: "12px" }}
              >
                <div className="flex items-center justify-center gap-2 text-slate-600">
                  <Settings size={16} /> Dynamic Inputs
                </div>
              </SecondaryButton>
            </div>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-full">
          <Card className="flex-grow flex flex-col h-full min-h-[50px] p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-bottom border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <SectionTitle style={{ marginBottom: 0 }}>System Preview Output</SectionTitle>
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Feed</span>
            </div>

            <div className="flex-grow bg-slate-900 relative group min-h-[350px] lg:min-h-[500px]">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                  <Loader2 size={48} className="animate-spin text-slate-700" />
                  <p className="text-slate-500 font-medium">Loading preview stream...</p>
                </div>
              )}
            </div>

            <div className="p-6 lg:p-10 bg-slate-50 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="text-center sm:text-left">
                  <h3 className="font-extrabold text-xl text-slate-800">Final Creative Approval</h3>
                  <p className="text-sm text-slate-500 mt-1">Ready to push this content to your active social channels?</p>
                </div>
                <div className="w-full sm:w-auto">
                  <PrimaryButton
                    onClick={handlePostVideo}
                    disabled={loading === 'post'}
                    style={{ 
                      padding: "16px 36px", 
                      fontSize: 15, 
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${medicalBlue}, ${medicalTeal})` 
                    }}
                  >
                    {loading === 'post' ? (
                      <Spinner color="white" />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Share2 size={20} />
                        Post Now
                      </div>
                    )}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
