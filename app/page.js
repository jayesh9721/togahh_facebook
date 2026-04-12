"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Badge, 
  Card, 
  MetricCard, 
  SectionTitle, 
  WorkflowStep, 
  EmptyState, 
  Spinner, 
  SecondaryButton 
} from "./components";
import { 
  User, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Settings,
  Bell
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import CampaignSetup from "./CampaignSetup";
import SocialDash from "./SocialDash";
import "./globals.css";
import "./dashboard.css";

// ─── CONSTANTS ───────────────────────────────────────────────
const API_URL = "/api/trigger-n8n";

const TABS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "analysis", label: "Ads Analysis", icon: "◎" },
  { id: "create", label: "Create Ad", icon: "◈" },
  { id: "approval", label: "Approval", icon: "◉" },
  { id: "campaigns", label: "Campaign Setup", icon: "◷" },
  { id: "live_campaigns", label: "Running Campaign", icon: "🚀" },
  { id: "social", label: "Social Posts", icon: "◫" },
  { id: "reports", label: "Reports", icon: "◧" },
  { id: "social-dash", label: "Social-Dash", icon: "🎨" },
];

const TOPICS = [
  "Advanced Orthopedics",
  "Cosmetic Dentistry",
  "Ophthalmic Surgery",
  "Preventative Cardiology",
  "Pediatric Wellness",
  "Clinical Excellence",
  "Patient Care Protocols",
];

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[1]);
  const [user, setUser] = useState(null);

  // Analysis
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  // idle | generating | waiting | done | error
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [pendingAnalysisTopic, setPendingAnalysisTopic] = useState(null);

  // Ad creation
  const [adStatus, setAdStatus] = useState("idle");
  // idle | generating | waiting | done | error
  const [adData, setAdData] = useState(null);

  // Approval & launch
  const [approved, setApproved] = useState(false);
  const [budget, setBudget] = useState(50);
  const [duration, setDuration] = useState(7);
  const [launchStatus, setLaunchStatus] = useState("idle");
  // idle | launching | live | error

  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [stoppedIds, setStoppedIds] = useState([]);
  const [stopStatus, setStopStatus] = useState("idle");
  // idle | stopping | stopped | error

  // Report
  const [reportStatus, setReportStatus] = useState("idle");
  // idle | generating | done | error

  // Social
  const [socialStatus, setSocialStatus] = useState("idle");
  // idle | generating | done | error
  const [socialActiveEvt, setSocialActiveEvt] = useState(null);

  // Shared error
  const [webhookError, setWebhookError] = useState("");

  // Approval queue
  const [scheduledAds, setScheduledAds] = useState([]);
  const [approvedAds, setApprovedAds] = useState([]);
  const [rejectedAds, setRejectedAds] = useState([]);
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [adCardStatuses, setAdCardStatuses] = useState({});
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(null);
  const [scheduleDates, setScheduleDates] = useState({});

  // ── Ad Videos state ──
  const [adVideosRefreshKey, setAdVideosRefreshKey] = useState(Date.now());
  const [adVideosLoading, setAdVideosLoading] = useState(false);

  // ── Supabase reports state ──
  const [sbRows, setSbRows] = useState([]);
  const [sbLoading, setSbLoading] = useState(true);
  const [sbTriggeringId, setSbTriggeringId] = useState(null);
  const [sbSessionTriggered, setSbSessionTriggered] = useState(new Set());
  const [sbToasts, setSbToasts] = useState([]);
  const [sbExpandedInsights, setSbExpandedInsights] = useState({});
  const [sbAdsConfigOpen, setSbAdsConfigOpen] = useState({});
  const [sbAdsConfigs, setSbAdsConfigs] = useState({});
  const [sbModalReport, setSbModalReport] = useState(null);
  const [sbModalTab, setSbModalTab] = useState("competitors");
  const [sbSortField, setSbSortField] = useState("score");
  const [sbSortDir, setSbSortDir] = useState("desc");

  const [createTabAdsConfig, setCreateTabAdsConfig] = useState({
    totalAds: 1,
    videoCount: 1,
    imageCount: 0,
    items: [
      { id: Date.now(), type: "video", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", idea: "" }
    ]
  });
  const [createTabConfigOpen, setCreateTabConfigOpen] = useState(false);
  const [adTableLinks, setAdTableLinks] = useState({}); // Stores { "1": { text: "...", format: "Video", Approved: bool }, ... }
  const [allApprovedAds, setAllApprovedAds] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [selectedAdForDetails, setSelectedAdForDetails] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [isStatusPolling, setIsStatusPolling] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [editingAdData, setEditingAdData] = useState({});
  const [isSavingAd, setIsSavingAd] = useState(false);
  const [isRetryingAd, setIsRetryingAd] = useState(false);
  const [retryPrompt, setRetryPrompt] = useState("");
  const [isRetryingSubmit, setIsRetryingSubmit] = useState(false);
  const [selectedMetaCampaign, setSelectedMetaCampaign] = useState(null);
  const [launchAdCandidate, setLaunchAdCandidate] = useState(null);

  // Live Campaigns State
  const [liveCampaigns, setLiveCampaigns] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [expandedCampaigns, setExpandedCampaigns] = useState(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState(new Set());
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const addSbToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setSbToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setSbToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchAdTableLinks = useCallback(async () => {
    setAdVideosLoading(true);
    const { data, error } = await supabase
      .from("your_table_name")
      .select("id, text, time, format, Approved, \"json data\"")
      .order("time", { ascending: false });

    if (error) {
      console.error("Ad links error:", error);
    } else {
      const latest = {};
      const approvedList = [];
      (data || []).forEach(row => {
        const isUrl = String(row.text || "").startsWith("http");
        if (!latest[row.id] && isUrl) {
          latest[row.id] = row;
        }
        if (row.Approved && isUrl) {
          approvedList.push(row);
        }
      });
      setAdTableLinks(latest);
      setAllApprovedAds(approvedList);
    }
    setAdVideosLoading(false);
    setAdVideosRefreshKey(Date.now());
  }, [addSbToast]);

  const fetchLiveCampaigns = useCallback(async () => {
    setLiveLoading(true);
    setLiveError("");
    try {
      const res = await fetch("/api/meta/campaigns");
      const data = await res.json();
      if (res.ok) {
        setLiveCampaigns(data || []);
      } else {
        setLiveError(data.error || "Failed to fetch live campaigns");
      }
    } catch (e) {
      setLiveError("Failed to connect to API");
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (id, type, status, action) => {
    if (action === "delete" && !confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;

    setUpdatingStatusId(id);
    try {
      const res = await fetch("/api/meta/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, action }),
      });
      const data = await res.json();
      if (res.ok) {
        addSbToast(`${type} ${action === "delete" ? "deleted" : "updated"} successfully!`);
        fetchLiveCampaigns(); // Refresh
      } else {
        addSbToast(data.error || `Failed to update ${type}`, "error");
      }
    } catch (e) {
      addSbToast("Network error", "error");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase
        .from("reports_json")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        addSbToast("Failed to fetch reports", "error");
      }
      setSbRows(data || []);
      setSbLoading(false);
    }
    fetchReports();
    fetchAdTableLinks();

    // Realtime: auto-fetch new/updated/deleted rows
    const channel = supabase
      .channel("reports_json_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports_json" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSbRows((prev) => [payload.new, ...prev]);
            addSbToast("New report received!");

            // Link to active analysis if topic matches
            const newReport = parseSbReport(payload.new);
            setPendingAnalysisTopic(currentTopic => {
              if (currentTopic && newReport.topic === currentTopic) {
                setAnalysisData({ ...newReport, id: payload.new.id });
                setAnalysisStatus("done");
                addSbToast("Analysis completed and loaded!");
                return null; // Reset pending topic
              }
              return currentTopic;
            });
          } else if (payload.eventType === "UPDATE") {
            setSbRows((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
          } else if (payload.eventType === "DELETE") {
            setSbRows((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addSbToast]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      addSbToast(error.message, "error");
    } else {
      addSbToast("Signed out successfully");
      router.push("/login");
    }
  };

  useEffect(() => {
    if (tab === "live_campaigns") {
      fetchLiveCampaigns();
    }
  }, [tab, fetchLiveCampaigns]);

  // ── Polling workflow status from Supabase status_table (id: 1) ──
  useEffect(() => {
    let interval;
    if (isStatusPolling || adStatus === "waiting") {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from("status_table")
          .select("status")
          .eq("id", 1)
          .single();

        if (error) {
          console.error("Status polling error:", error);
          return;
        }

        if (data) {
          setWorkflowStatus(data.status);
          // If the status is "Completed", refresh the ad previews and stop polling
          if (data.status === "Completed") {
            setIsStatusPolling(false);
            setAdStatus("idle");
            fetchAdTableLinks(); // Refresh the grid
            addSbToast("Ads generation completed!", "success");
          }
        }
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isStatusPolling, adStatus, fetchAdTableLinks, addSbToast]);

  function parseSbReport(row) {
    let rd = row.report_data;
    try {
      if (typeof rd === "string") rd = JSON.parse(rd);
      // Handle array-wrapped format: [{...}] → {...}
      if (Array.isArray(rd)) rd = rd[0] || {};
      return rd || {};
    } catch { return {}; }
  }

  const sbReports = sbRows.map((row) => ({ row, report: parseSbReport(row) }));
  const sbTotalReports = sbRows.length;
  const sbTotalCompetitors = sbReports.reduce((s, { report }) => s + (report.competitors_table || []).length, 0);
  const sbHighThreats = sbReports.reduce((s, { report }) => s + (report.competitors_table || []).filter((c) => c.threat === "high").length, 0);
  const sbPendingAds = sbRows.filter((r) => !r.ads_workflow_triggered).length;

  // ── Ads config helpers ──
  const VIDEO_TYPES = ["Reel", "Story", "Feed Post", "Carousel"];
  const DURATIONS = ["20 seconds", "28 seconds", "32 seconds", "36 seconds", "40 seconds"];
  const AUDIO_STYLES = ["Background Music", "Voiceover Only", "Music + Voiceover", "No Audio"];
  const VIDEO_STYLES = ["Bold & Colorful", "Cinematic", "Minimal & Clean", "Dark & Moody", "Neon / Glow", "Hand-drawn / Sketch"];

  function getAdsConfig(reportId) {
    return sbAdsConfigs[reportId] || { numAds: 1, videos: [{ videoType: "Reel", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", videoIdea: "" }] };
  }

  function updateAdsConfig(reportId, updater) {
    setSbAdsConfigs((prev) => {
      const current = prev[reportId] || { numAds: 1, videos: [{ videoType: "Reel", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", videoIdea: "" }] };
      return { ...prev, [reportId]: updater(current) };
    });
  }

  function setNumAds(reportId, num) {
    updateAdsConfig(reportId, (cfg) => {
      const n = Math.max(1, Math.min(5, num));
      const videos = [...cfg.videos];
      while (videos.length < n) videos.push({ videoType: "Reel", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", videoIdea: "" });
      return { ...cfg, numAds: n, videos: videos.slice(0, n) };
    });
  }

  function updateVideoConfig(reportId, idx, field, value) {
    updateAdsConfig(reportId, (cfg) => {
      const videos = [...cfg.videos];
      videos[idx] = { ...videos[idx], [field]: value };
      return { ...cfg, videos };
    });
  }

  function updateCreateTabTotalAds(num) {
    if (num > 5) {
      addSbToast("Maximum of 5 total ads allowed", "error");
      return;
    }
    const n = Math.max(1, num);
    setCreateTabAdsConfig((prev) => {
      const currentTotal = prev.items.length;
      let newItems = [...prev.items];

      if (n > currentTotal) {
        for (let i = 0; i < n - currentTotal; i++) {
          // Default to video if space allows, else image
          const vCount = newItems.filter(x => x.type === "video").length;
          const type = vCount < 3 ? "video" : "image";

          if (type === "video") {
            newItems.push({ id: Date.now() + i, type: "video", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", idea: "" });
          } else {
            // Check if we can add image
            const iCount = newItems.filter(x => x.type === "image").length;
            if (iCount < 2) {
              newItems.push({ id: Date.now() + i, type: "image", imageStyle: "Bold & Colorful", idea: "" });
            } else {
              // If we reach 3V and 2I, we can't add more anyway due to n=5 limit
              break;
            }
          }
        }
      } else {
        newItems = newItems.slice(0, n);
      }

      const vCount = newItems.filter(x => x.type === "video").length;
      const iCount = newItems.filter(x => x.type === "image").length;
      return { totalAds: newItems.length, videoCount: vCount, imageCount: iCount, items: newItems };
    });
  }

  function setCreateTabItemType(idx, type) {
    setCreateTabAdsConfig((prev) => {
      const currentItem = prev.items[idx];
      if (currentItem.type === type) return prev;

      if (type === "video" && prev.videoCount >= 3) {
        addSbToast("Maximum of 3 Videos allowed", "error");
        return prev;
      }
      if (type === "image" && prev.imageCount >= 2) {
        addSbToast("Maximum of 2 Images allowed", "error");
        return prev;
      }

      const newItems = [...prev.items];
      if (type === "video") {
        newItems[idx] = { id: newItems[idx].id, type: "video", duration: "28 seconds", audioStyle: "Background Music", videoStyle: "Bold & Colorful", idea: "" };
      } else {
        newItems[idx] = { id: newItems[idx].id, type: "image", imageStyle: "Bold & Colorful", idea: "" };
      }
      const vCount = newItems.filter(x => x.type === "video").length;
      const iCount = newItems.filter(x => x.type === "image").length;
      return { ...prev, videoCount: vCount, imageCount: iCount, items: newItems };
    });
  }

  function updateCreateTabItemField(idx, field, value) {
    setCreateTabAdsConfig((prev) => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      return { ...prev, items: newItems };
    });
  }


  async function handleApproveAd(row) {
    if (!row) return;
    setApprovingId(row.id + "_" + row.time);
    const { error } = await supabase
      .from("your_table_name")
      .update({ Approved: true })
      .match({ id: row.id, time: row.time });

    if (error) {
      console.error("Approval error:", error);
      addSbToast("Failed to approve ad", "error");
    } else {
      addSbToast("Ad approved successfully!");
      await fetchAdTableLinks();
    }
    setApprovingId(null);
  }

  async function handleSaveEdits(ad) {
    if (!ad) return;
    setIsSavingAd(true);

    const oldJson = typeof ad["json data"] === "string" ? JSON.parse(ad["json data"]) : (ad["json data"] || {});

    // Construct the new schema
    const updatedJsonData = {
      campaign: {
        name: editingAdData.campaignName || (oldJson.campaign?.name || "Untitled Campaign")
      },
      ad: {
        id: oldJson.ad?.id || oldJson.ads?.[0]?.id || Date.now(),
        name: editingAdData.adName || (oldJson.ad?.name || oldJson.ads?.[0]?.name || "Untitled Ad"),
        type: oldJson.ad?.type || oldJson.ads?.[0]?.type || "video",
        headline: editingAdData.headline || (oldJson.ad?.headline || oldJson.ads?.[0]?.headline || "No headline provided."),
        call_to_action_type: editingAdData.ctaType || (oldJson.ad?.call_to_action_type || oldJson.ads?.[0]?.call_to_action_type || "WATCH_MORE")
      },
      link_data: editingAdData.linkData || (oldJson.link_data || ad.text || "")
    };

    const { error } = await supabase
      .from("your_table_name")
      .update({ "json data": JSON.stringify(updatedJsonData) })
      .match({ id: ad.id, time: ad.time });

    if (error) {
      console.error("Save error:", error);
      addSbToast("Failed to save changes", "error");
    } else {
      addSbToast("Changes saved successfully!");
      setIsEditingAd(false);
      await fetchAdTableLinks();
    }
    setIsSavingAd(false);
  }

  async function handleRetryAdSubmit(ad) {
    if (!ad || !retryPrompt) return;
    setIsRetryingSubmit(true);

    const adData = typeof ad["json data"] === "string" ? JSON.parse(ad["json data"]) : (ad["json data"] || {});

    try {
      const res = await fetch("https://n8n.srv881198.hstgr.cloud/webhook/3ba2e5c5-b680-48b8-a905-6386b74a28d9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: retryPrompt,
          ad_id: ad.id,
          original_data: adData,
          media_url: ad.text,
          timestamp: new Date().toISOString()
        }),
      });

      if (res.ok) {
        addSbToast("Retry request sent successfully!");
        setIsRetryingAd(false);
        setRetryPrompt("");
      } else {
        addSbToast("Failed to send retry request", "error");
      }
    } catch (e) {
      console.error("Retry error:", e);
      addSbToast("Failed to reach retry webhook", "error");
    }
    setIsRetryingSubmit(false);
  }

  async function handleRefreshAdVideos() {
    await fetchAdTableLinks();
  }

  async function handleTriggerAds(reportId, reportData) {
    const config = getAdsConfig(reportId);
    setSbTriggeringId(reportId);
    try {
      const res = await fetch("/api/trigger-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, report_data: reportData, ads_config: config }),
      });
      const result = await res.json();
      if (result.success) {
        setSbSessionTriggered((prev) => new Set([...prev, reportId]));
        addSbToast("Ads workflow triggered successfully!");
      } else {
        addSbToast("Failed to trigger. Try again.", "error");
      }
    } catch {
      addSbToast("Failed to trigger. Try again.", "error");
    }
    setSbTriggeringId(null);
  }

  async function handleCreateTabTriggerAds() {
    if (!analysisData) {
      addSbToast("No analysis data available. Run Ads Analysis first.", "error");
      return;
    }
    const config = createTabAdsConfig;
    setAdStatus("generating");
    setWebhookError("");
    try {
      const res = await fetch("/api/trigger-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: analysisData?.id || crypto.randomUUID(),
          report_data: analysisData,
          ads_config: config
        }),
      });
      const result = await res.json();
      if (result.success) {
        addSbToast("Ads workflow triggered successfully!");
        setAdStatus("waiting");
        setIsStatusPolling(true); // Initiate polling
      } else {
        setAdStatus("error");
        setWebhookError(result.error || "Failed to trigger ad generation");
        addSbToast("Failed to trigger generation. Try again.", "error");
      }
    } catch (e) {
      setAdStatus("error");
      setWebhookError(e.message || "Failed to reach API");
      addSbToast("Failed to trigger generation. Try again.", "error");
    }
  }

  function formatSbDate(iso) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return `${day} ${mon} ${d.getFullYear()}`;
  }

  function truncateSb(str, len = 200) {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "..." : str;
  }

  function toggleSbSort(field) {
    if (sbSortField === field) setSbSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSbSortField(field); setSbSortDir("desc"); }
  }

  // ── Reusable webhook caller ──
  async function callWebhook(payload, setStatus) {
    setStatus("generating");
    setWebhookError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-action": payload.action || ""
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({ ok: true }));
      const resultData = Array.isArray(data) ? data[0] : data;
      const isValid =
        resultData &&
        typeof resultData === "object" &&
        !resultData.rawResponse &&
        Object.keys(resultData).length > 0;
      return isValid ? resultData : null;
    } catch (e) {
      setStatus("error");
      setWebhookError(e.message || "Could not reach n8n");
      console.error("Webhook error:", e);
      return null;
    }
  }

  // ── Action 1: Competitor Analysis ──
  async function runCompetitorAnalysis() {
    setAnalysisData(null);
    setAnalysisError("");
    setAnalysisStatus("generating");
    setPendingAnalysisTopic(selectedTopic);
    await new Promise((r) => setTimeout(r, 100));

    const result = await callWebhook({
      action: "competitor_analysis",
      topic: selectedTopic,
      timestamp: new Date().toISOString(),
    }, setAnalysisStatus);

    if (result) {
      if (result.error && result.isTimeout) {
        // If it was a timeout, don't show error, just stay in waiting
        setAnalysisStatus("waiting");
        addSbToast("Trigger successful, waiting for results...");
      } else {
        setAnalysisData(result);
        setAnalysisStatus("done");
        setPendingAnalysisTopic(null);
      }
    } else if (analysisStatus !== "error") {
      setAnalysisStatus("waiting");
    }
  }

  // ── Action 2: Generate Ad ──
  async function createAdFromAnalysis() {
    setAdData(null);
    const result = await callWebhook({
      action: "generate_ad",
      topic: selectedTopic,
      executive_summary: analysisData?.executive_summary || "",
      top_hooks: analysisData?.hooks_table || [],
      competitors: (analysisData?.competitors_table || []).slice(0, 5),
      gaps: analysisData?.gaps_table || [],
      timestamp: new Date().toISOString(),
    }, setAdStatus);
    if (result) {
      console.log("n8n ad response:", result);
      setAdData(result);
      setAdStatus("done");
    } else if (adStatus !== "error") {
      setAdStatus("waiting");
    }
  }

  // ── Action 3: Launch Meta Ad ──
  async function launchMetaAd() {
    const result = await callWebhook({
      action: "launch_meta_ad",
      adData: adData,
      budget: budget,
      duration: duration,
      timestamp: new Date().toISOString(),
    }, setLaunchStatus);
    // Optimistic: add to campaigns list regardless of n8n response
    setCampaigns(prev => [...prev, {
      id: `C${Date.now()}`,
      name: adData?.topic || "New Campaign",
      platform: "Meta",
      budget: `€${budget}/day`,
      duration: `${duration} days`,
      status: "launching",
      spend: "€0",
      ctr: "—",
      clicks: 0,
      leads: 0,
    }]);
    if (result) setLaunchStatus("live");
    setTab("campaigns");
  }

  // ── Action 4: Stop Campaign ──
  async function stopCampaign(campaignId, campaignName) {
    setStoppedIds(prev => [...prev, campaignId]); // optimistic
    await callWebhook({
      action: "stop_campaign",
      campaignId: campaignId,
      campaignName: campaignName,
      timestamp: new Date().toISOString(),
    }, setStopStatus);
  }

  // ── Action 5: Generate Report ──
  async function generateReport() {
    const result = await callWebhook({
      action: "generate_report",
      period: "manual",
      timestamp: new Date().toISOString(),
    }, setReportStatus);
    if (result) setReportStatus("done");
  }

  // ── Action 6: Generate Social Post ──
  async function generateSocialPost(eventName) {
    setSocialActiveEvt(eventName);
    const result = await callWebhook({
      action: "generate_social_post",
      event: eventName,
      platforms: ["ig", "tiktok", "fb", "snapchat"],
      timestamp: new Date().toISOString(),
    }, setSocialStatus);
    if (result) setSocialStatus("done");
  }

  // ── Receive n8n result ──
  function receiveAnalysisResult(data) {
    setAnalysisData(data);
    setAnalysisStatus("done");
  }

  // ── DEV: simulate n8n response ──
  function simulateAnalysisResponse() {
    receiveAnalysisResult({
      success: true,
      executive_summary: "Clinical excellence and patient-centric care are the primary drivers for local healthcare providers. Digital presence is currently under-utilized, offering a significant opportunity to capture high-intent search traffic through specialized service campaigns.",
      competitors_table: [
        { name: "Global Health Clinic", ads: 14, score: 72, threat: "High", angle: "Surgical precision", hook: "JCI accredited care you can trust" },
        { name: "Wellness Prime", ads: 9, score: 85, threat: "High", angle: "Preventative focus", hook: "Your health journey, optimized" },
      ],
      hooks_table: [
        { pattern: "Treatment results", example: "Before treatment → Patient recovery", reason: "Visual results validate clinical efficacy", score: "8.1" },
      ],
      market_insights_table: [
        { field: "Dominant platform", value: "Meta (Instagram Reels)" },
        { field: "Average CPC", value: "€1.20" },
        { field: "Top ad format", value: "Video reel — 28 sec" },
        { field: "Trending style", value: "Anime & illustrative (+3×)" },
        { field: "Peak booking time", value: "Thu–Sat, 6–10 pm" },
        { field: "Avg. competitor spend", value: "€60/day" },
      ],
      gaps_table: [
        { gap: "Quality vs price", opportunity: "Counter discount-led ads with award proof", priority: "High", impact: "High CTR, lower CPA" },
        { gap: "Orthopedic specialization", opportunity: "Target 'hip replacement surgery' keywords", priority: "Medium", impact: "High-intent patient traffic" },
        { gap: "Seasonal hooks missing", opportunity: "Halloween piercing + costume combo campaign", priority: "Medium", impact: "Timely spike in bookings" },
        { gap: "Diagnostic Focus", opportunity: "Target 'MRI and diagnostic imaging' keywords", priority: "Medium", impact: "High-intent service volume" },
        { gap: "Patient Transparency", opportunity: "Virtual facility tour & specialist profiles", priority: "Low", impact: "Clinical trust & patient retention" },
      ],
    });
  }

  // ── Approval helpers ──
  function getAdStatus(adId) {
    return adCardStatuses[adId] || "pending";
  }

  function approveAd(ad) {
    setAdCardStatuses(prev => ({ ...prev, [ad.id]: "approved" }));
    setApprovedAds(prev => [...prev.filter(a => a.id !== ad.id), ad]);
    setSchedulePickerOpen(null);
  }

  function rejectAd(adId) {
    setAdCardStatuses(prev => ({ ...prev, [adId]: "rejected" }));
    setApprovedAds(prev => prev.filter(a => a.id !== adId));
    setScheduledAds(prev => prev.filter(a => a.id !== adId));
    setSchedulePickerOpen(null);
  }

  function scheduleAd(ad) {
    const dateInfo = scheduleDates[ad.id];
    if (!dateInfo?.date) return;
    const scheduledAt = `${dateInfo.date} ${dateInfo.time || "09:00"}`;
    setAdCardStatuses(prev => ({ ...prev, [ad.id]: "scheduled" }));
    setScheduledAds(prev => [
      ...prev.filter(a => a.id !== ad.id),
      { ...ad, scheduledAt },
    ]);
    setSchedulePickerOpen(null);
  }

  function undoAction(adId) {
    setAdCardStatuses(prev => ({ ...prev, [adId]: "pending" }));
    setApprovedAds(prev => prev.filter(a => a.id !== adId));
    setScheduledAds(prev => prev.filter(a => a.id !== adId));
    setRejectedAds(prev => prev.filter(a => a.id !== adId));
  }

  function approveAllPending() {
    (adData?.ad_scripts || [])
      .filter(a => getAdStatus(a.id) === "pending")
      .forEach(ad => approveAd(ad));
  }

  function rejectAllPending() {
    (adData?.ad_scripts || [])
      .filter(a => getAdStatus(a.id) === "pending")
      .forEach(ad => rejectAd(ad.id));
  }

  function countByStatus(status) {
    return (adData?.ad_scripts || []).filter(a => getAdStatus(a.id) === status).length;
  }

  function simulateAdResponse() {
    setAdData({
      topic: selectedTopic,
      headline: "Where Anime Meets Skin — Your Story, Inked Forever",
      body: "Our award-winning artists bring your favourite anime characters to life. Bold lines, vivid colour, unmatched detail. Book your consultation today.",
      cta: "Book Now",
      format: "Video reel — 28 sec",
      platform: "Meta (FB + IG)",
    });
    setAdStatus("done");
  }

  // ─── STYLES ───
  const tabStyle = (id) => ({
    padding: "12px 24px",
    borderRadius: "var(--radius-pill)",
    fontSize: 15,
    cursor: "pointer",
    border:
      tab === id
        ? "1.5px solid var(--text)"
        : "1px solid var(--border)",
    background: tab === id ? "var(--surface)" : "transparent",
    color: tab === id ? "var(--text)" : "var(--text-muted)",
    fontWeight: tab === id ? 700 : 500,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    letterSpacing: "0.01em",
  });

  const topicBtnStyle = (t) => ({
    fontSize: 12,
    padding: "6px 14px",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    border:
      selectedTopic === t
        ? "1.5px solid var(--primary)"
        : "1px solid var(--border)",
    background:
      selectedTopic === t ? "var(--primary-light)" : "transparent",
    color:
      selectedTopic === t ? "var(--primary)" : "var(--text-muted)",
    fontWeight: selectedTopic === t ? 500 : 400,
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  });

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
        color: "var(--text)",
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 20px 3rem",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "24px 0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-light)",
          marginBottom: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 800,
              boxShadow: "0 8px 16px rgba(2, 132, 199, 0.2)",
            }}
          >
            H
          </div>
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                lineHeight: 1.1
              }}
            >
              HealPoint AI
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>
              Clinical Ads Management
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Status Indicators */}
          <div style={{ display: "none", alignItems: "center", gap: 8 }}>
            <Badge text="n8n connected" color="var(--green)" bg="var(--green-light)" />
          </div>

          {/* Collaborative Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderRight: "1px solid var(--border-light)" }}>
             <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Bell size={20} /></button>
             <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Settings size={20} /></button>
          </div>

          {/* User Profile / Auth Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right", display: "none", md: "block" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Administrator</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.email}</div>
                </div>
                <div style={{ 
                  width: 36, height: 36, 
                  borderRadius: "var(--radius-pill)", 
                  background: "var(--surface)", 
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)"
                }}>
                  <User size={20} />
                </div>
                <button 
                  onClick={handleSignOut}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "white",
                    color: "var(--red)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => router.push("/login")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)"
                }}
              >
                <LogIn size={18} /> Personnel Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: "16px",
          background: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 26,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            style={tabStyle(t.id)}
            onClick={() => setTab(t.id)}
          >
            <span style={{ fontSize: 16, opacity: 0.8 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          OVERVIEW
      ═══════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="animate-fade-in">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <MetricCard
              label="Live campaigns"
              value={campaigns.length || "0"}
              sub="Meta + Google"
              color="var(--primary)"
              bg="var(--primary-light)"
            />
            <MetricCard
              label="Analysis status"
              value={
                analysisStatus === "done" ? "Ready" : "Idle"
              }
              sub="Competitor intel"
              color="var(--green)"
              bg="var(--green-light)"
            />
            <MetricCard
              label="Pending approval"
              value={adData && !approved ? "1" : "0"}
              sub={
                adData && !approved
                  ? "Action needed"
                  : "All clear"
              }
              color="var(--amber)"
              bg="var(--amber-light)"
              dot={!!(adData && !approved)}
            />
            <MetricCard
              label="Stopped"
              value={stoppedIds.length}
              sub="This session"
              color="var(--blue)"
              bg="var(--blue-light)"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Card>
              <SectionTitle>n8n Integration</SectionTitle>
              {[
                [
                  "Webhook URL",
                  "/api/trigger-n8n → n8n",
                  "var(--blue)",
                  "var(--blue-light)",
                ],
                [
                  "Analysis",
                  analysisStatus,
                  "var(--green)",
                  "var(--green-light)",
                ],
                [
                  "Ad generation",
                  adStatus,
                  "var(--green)",
                  "var(--green-light)",
                ],
                [
                  "Campaigns live",
                  campaigns.length.toString(),
                  "var(--primary)",
                  "var(--primary-light)",
                ],
              ].map(([k, v, c, bg], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom:
                      i < 3
                        ? "0.5px solid var(--border-light)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {k}
                  </span>
                  <Badge text={v} color={c} bg={bg} />
                </div>
              ))}
            </Card>

            <Card>
              <SectionTitle>Quick Actions</SectionTitle>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  ["Run competitor analysis", () => setTab("analysis"), "◎"],
                  ["Create new ad", () => setTab("create"), "◈"],
                  ["Review approvals", () => setTab("approval"), "◉"],
                  ["Live campaigns", () => setTab("campaigns"), "◷"],
                  ["Social posts", () => setTab("social"), "◫"],
                  ["Reports", () => setTab("reports"), "◧"],
                ].map(([label, fn, icon], i) => (
                  <button
                    key={i}
                    onClick={fn}
                    style={{
                      fontSize: 12,
                      padding: "9px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      background: "var(--card-bg)",
                      color: "var(--text)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition:
                        "background 0.15s, border-color 0.15s, transform 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--primary-light)";
                      e.currentTarget.style.borderColor =
                        "var(--primary)";
                      e.currentTarget.style.color =
                        "var(--primary)";
                      e.currentTarget.style.transform =
                        "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "var(--card-bg)";
                      e.currentTarget.style.borderColor =
                        "var(--border)";
                      e.currentTarget.style.color = "var(--text)";
                      e.currentTarget.style.transform =
                        "translateX(0)";
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ opacity: 0.5, fontSize: 11 }}>{icon}</span>
                      {label}
                    </span>
                    <span style={{ opacity: 0.4 }}>→</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ADS ANALYSIS
      ═══════════════════════════════════════════════════════ */}
      {tab === "analysis" && (
        <div className="animate-fade-in" style={{ display: "flex", gap: 20 }}>
          {/* History Sidebar */}
          <div style={{
            width: 250, flexShrink: 0,
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 14,
            height: "fit-content", position: "sticky", top: 20, boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", borderBottom: "1px solid var(--border)", paddingBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📜</span> Analysis History
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
              {[...sbRows].reverse().map((row) => {
                const report = parseSbReport(row);
                return (
                  <div key={row.id} style={{
                    padding: 12, borderRadius: "var(--radius-md)", border: "0.5px solid var(--border-light)",
                    background: "var(--surface)", transition: "transform 0.15s, border-color 0.15s"
                  }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-light)"}>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 11, marginBottom: 2 }}>{report.topic || "Untitled Run"}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>📅</span> {formatSbDate(row.created_at)}
                    </div>
                    <button
                      onClick={() => {
                        setAnalysisData({ ...report, id: row.id });
                        setAnalysisStatus("done");
                        setSelectedTopic(report.topic || TOPICS[1]);
                        addSbToast("Loaded history: " + report.topic);
                      }}
                      style={{
                        width: "100%", padding: "6px 0", borderRadius: "var(--radius-sm)", border: "none",
                        background: "var(--primary-light)", color: "var(--primary)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary-light)"; e.currentTarget.style.color = "var(--primary)"; }}
                    >
                      Use Result
                    </button>
                  </div>
                );
              })}
              {sbRows.length === 0 && <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 20 }}>No previous runs found</div>}
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1 }}>
            <Card style={{ marginBottom: 14 }}>
              <SectionTitle>Topic for analysis</SectionTitle>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    style={topicBtnStyle(t)}
                    onClick={() => setSelectedTopic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <SectionTitle>n8n Workflow Steps</SectionTitle>
              <WorkflowStep
                step="1"
                label="Trigger webhook"
                sub={`POST → ${API_URL}/competitor_analysis`}
                active={analysisStatus === "idle"}
                done={analysisStatus !== "idle" || !!analysisData}
              />
              <WorkflowStep
                step="2"
                label="n8n receives & scrapes competitors"
                sub="Apify actor — IG, FB, Google local studios"
                active={analysisStatus === "generating" || analysisStatus === "waiting"}
                done={analysisStatus === "done" || !!analysisData}
              />
              <WorkflowStep
                step="3"
                label="Claude analyzes patterns in n8n"
                sub="CTR, creative type, offers, copy angles"
                active={analysisStatus === "waiting"}
                done={analysisStatus === "done" || !!analysisData}
              />
              <WorkflowStep
                step="4"
                label="n8n POSTs results back to dashboard"
                sub="Results appear below"
                active={false}
                done={analysisStatus === "done" || !!analysisData}
              />

              {/* TRIGGER BUTTON — shown when idle, error, or done (allow re-run) */}
              {(analysisStatus === "idle" || analysisStatus === "done" || analysisStatus === "error") && (
                <div>
                  <button
                    onClick={runCompetitorAnalysis}
                    disabled={false}
                    style={{
                      width: "100%",
                      padding: "11px 18px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "var(--primary)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.2s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#3D35A0"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {analysisStatus === "done"
                      ? "Re-run competitor analysis"
                      : "Trigger n8n webhook — run competitor analysis"}
                  </button>
                  {analysisStatus === "error" && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--red-strong)" }}>
                      Could not reach n8n: {analysisError || webhookError}. Please try again.
                    </div>
                  )}
                </div>
              )}

              {/* GENERATING */}
              {analysisStatus === "generating" && (
                <div
                  className="animate-slide-up"
                  style={{ background: "var(--primary-light)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
                    <Spinner size={14} />
                    <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 500 }}>
                      Sending to n8n...
                    </span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--purple-dark)" }}>
                    POST {API_URL}
                  </div>
                </div>
              )}

              {/* WAITING */}
              {analysisStatus === "waiting" && (
                <div className="animate-slide-up">
                  <div
                    style={{
                      background: "var(--amber-light)",
                      border: "0.5px solid var(--amber)",
                      borderRadius: "var(--radius-md)",
                      padding: 14,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--amber)",
                        fontWeight: 500,
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Spinner size={12} color="var(--amber)" />
                      Webhook triggered — waiting for n8n response
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--amber-dark)",
                        lineHeight: 1.6,
                      }}
                    >
                      n8n scraping + analyzing competitors. When
                      done, n8n must POST results back here.
                      <br />
                      <strong>
                        Add a &ldquo;Respond to Webhook&rdquo; node
                        in n8n
                      </strong>{" "}
                      with the JSON format below.
                    </div>
                  </div>

                  {/* Expected response format */}
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Expected n8n response format
                    </div>
                    <pre
                      style={{
                        fontSize: 11,
                        color: "var(--text)",
                        margin: 0,
                        lineHeight: 1.7,
                        overflow: "auto",
                      }}
                    >
                      {`{
  "success": true,
  "executive_summary": "...",
  "competitors_table": [
    { "name": "...", "ads": 0, "score": 0,
      "threat": "...", "angle": "...", "hook": "..." }
  ],
  "hooks_table": [
    { "pattern": "...", "example": "...",
      "reason": "...", "score": "..." }
  ],
  "market_insights_table": [
    { "field": "...", "value": "..." }
  ],
  "gaps_table": [
    { "gap": "...", "opportunity": "...",
      "priority": "...", "impact": "..." }
  ]
}`}
                    </pre>
                  </div>

                  <SecondaryButton onClick={simulateAnalysisResponse}>
                    ⚙ Simulate n8n response — UI testing only
                  </SecondaryButton>
                </div>
              )}

              {/* ERROR */}
              {analysisStatus === "error" && (
                <div className="animate-slide-up">
                  <div
                    style={{
                      background: "var(--red-error-bg)",
                      border: "0.5px solid var(--red-error)",
                      borderRadius: "var(--radius-md)",
                      padding: 14,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--red-strong)",
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      Webhook trigger failed
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--red-dark)",
                      }}
                    >
                      {analysisError}
                    </div>
                  </div>
                  <SecondaryButton
                    onClick={() => setAnalysisStatus("idle")}
                  >
                    Reset
                  </SecondaryButton>
                </div>
              )}

            </Card>

            {/* ── RESULTS ── */}
            {analysisStatus === "done" && analysisData && (
              <div className="animate-slide-up">

                {/* 1. Executive Summary */}
                {analysisData?.executive_summary && (
                  <Card style={{ marginBottom: 14 }}>
                    <SectionTitle>Executive Summary</SectionTitle>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-body)" }}>
                      {analysisData.executive_summary}
                    </div>
                  </Card>
                )}

                {/* 2. Competitor Ads Table */}
                {(analysisData?.competitors_table?.length > 0) && (
                  <Card style={{ marginBottom: 14 }}>
                    <SectionTitle>Competitor Ads</SectionTitle>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "var(--surface)" }}>
                            {["Name", "Ads", "Score", "Threat", "Angle", "Hook"].map((h) => (
                              <th key={h} style={{
                                padding: "9px 12px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                borderBottom: "1px solid var(--border)",
                                whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.competitors_table.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "0.5px solid var(--border-light)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--text)" }}>{row?.name}</td>
                              <td style={{ padding: "10px 12px", color: "var(--text-body)" }}>{row?.ads}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-pill)",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: row?.score >= 75 ? "var(--green-light)" : row?.score >= 50 ? "var(--amber-light)" : "var(--red-error-bg)",
                                  color: row?.score >= 75 ? "var(--green)" : row?.score >= 50 ? "var(--amber)" : "var(--red-dark)",
                                }}>{row?.score}</span>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <Badge
                                  text={row?.threat}
                                  color={row?.threat === "High" ? "var(--red-dark)" : row?.threat === "Medium" ? "var(--amber)" : "var(--green)"}
                                  bg={row?.threat === "High" ? "var(--red-error-bg)" : row?.threat === "Medium" ? "var(--amber-light)" : "var(--green-light)"}
                                />
                              </td>
                              <td style={{ padding: "10px 12px", color: "var(--text-body)" }}>{row?.angle}</td>
                              <td style={{ padding: "10px 12px", color: "var(--primary)", fontStyle: "italic" }}>&ldquo;{row?.hook}&rdquo;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* 3. Top Hook Patterns Table */}
                {(analysisData?.hooks_table?.length > 0) && (
                  <Card style={{ marginBottom: 14 }}>
                    <SectionTitle>Top Hook Patterns</SectionTitle>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "var(--surface)" }}>
                            {["Pattern", "Example", "Reason", "Score"].map((h) => (
                              <th key={h} style={{
                                padding: "9px 12px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                borderBottom: "1px solid var(--border)",
                                whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.hooks_table.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "0.5px solid var(--border-light)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap" }}>{row?.pattern}</td>
                              <td style={{ padding: "10px 12px", color: "var(--primary)", fontStyle: "italic" }}>&ldquo;{row?.example}&rdquo;</td>
                              <td style={{ padding: "10px 12px", color: "var(--text-body)", lineHeight: 1.5 }}>{row?.reason}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-pill)",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "var(--primary-light)",
                                  color: "var(--primary)",
                                }}>{row?.score}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* 4 + 5. Market Insights & Gap Opportunities — side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

                  {/* 4. Market Insights Table */}
                  {(analysisData?.market_insights_table?.length > 0) && (
                    <Card>
                      <SectionTitle>Market Insights</SectionTitle>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "var(--surface)" }}>
                            {["Field", "Value"].map((h) => (
                              <th key={h} style={{
                                padding: "8px 10px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                borderBottom: "1px solid var(--border)",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.market_insights_table.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "0.5px solid var(--border-light)" }}>
                              <td style={{ padding: "9px 10px", fontWeight: 500, color: "var(--text-muted)", fontSize: 11 }}>{row?.field}</td>
                              <td style={{ padding: "9px 10px", fontWeight: 500, color: "var(--text)" }}>{row?.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}

                  {/* 5. Gap Opportunities Table */}
                  {(analysisData?.gaps_table?.length > 0) && (
                    <Card>
                      <SectionTitle>Gap Opportunities</SectionTitle>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "var(--surface)" }}>
                            {["Gap", "Opportunity", "Priority", "Impact"].map((h) => (
                              <th key={h} style={{
                                padding: "8px 10px",
                                textAlign: "left",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                borderBottom: "1px solid var(--border)",
                                whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysisData.gaps_table.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "0.5px solid var(--border-light)" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "9px 10px", fontWeight: 500, color: "var(--text)" }}>{row?.gap}</td>
                              <td style={{ padding: "9px 10px", color: "var(--text-body)", lineHeight: 1.5 }}>{row?.opportunity}</td>
                              <td style={{ padding: "9px 10px" }}>
                                <Badge
                                  text={row?.priority}
                                  color={row?.priority === "High" ? "var(--red-dark)" : row?.priority === "Medium" ? "var(--amber)" : "var(--green)"}
                                  bg={row?.priority === "High" ? "var(--red-error-bg)" : row?.priority === "Medium" ? "var(--amber-light)" : "var(--green-light)"}
                                />
                              </td>
                              <td style={{ padding: "9px 10px", color: "var(--blue)", fontSize: 11 }}>{row?.impact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </div>

                {/* Raw response fallback — shown when none of the expected tables are present */}
                {(!analysisData?.competitors_table?.length &&
                  !analysisData?.hooks_table?.length &&
                  !analysisData?.market_insights_table?.length &&
                  !analysisData?.gaps_table?.length &&
                  !analysisData?.message?.toLowerCase().includes("workflow")) && (
                    <Card style={{ marginBottom: 14 }}>
                      <SectionTitle>n8n Raw Response</SectionTitle>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                        n8n responded but no table data was found. Raw output:
                      </div>
                      <pre style={{
                        fontSize: 11,
                        background: "var(--surface)",
                        borderRadius: "var(--radius-md)",
                        padding: 12,
                        overflow: "auto",
                        maxHeight: 300,
                        margin: 0,
                        color: "var(--text)",
                        lineHeight: 1.6,
                      }}>
                        {JSON.stringify(analysisData, null, 2)}
                      </pre>
                    </Card>
                  )}

                {analysisData && (
                  <div>
                    <button
                      onClick={() => { setTab("create"); setCreateTabConfigOpen(true); }}
                      disabled={adStatus === "generating" || adStatus === "waiting"}
                      style={{
                        padding: "11px 18px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background: (adStatus === "generating" || adStatus === "waiting") ? "var(--primary-light)" : "var(--primary)",
                        color: (adStatus === "generating" || adStatus === "waiting") ? "var(--primary)" : "#fff",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: (adStatus === "generating" || adStatus === "waiting") ? "not-allowed" : "pointer",
                        opacity: (adStatus === "generating" || adStatus === "waiting") ? 0.7 : 1,
                        fontFamily: "inherit",
                        display: "center",
                        alignItems: "center",
                        gap: 8,
                        transition: "background 0.2s",
                      }}
                    >
                      {adStatus === "generating" ? <><Spinner size={12} color="var(--primary)" /> Sending to n8n...</> :
                        adStatus === "waiting" ? <><Spinner size={12} color="var(--primary)" /> Generating ad...</> :
                          "Create ad based on this analysis →"}
                    </button>
                    {adStatus === "waiting" && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--amber)" }}>
                        n8n is generating your ad using the analysis data. Results will appear in the Create Ad tab when ready.
                      </div>
                    )}
                    {adStatus === "error" && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--red-strong)" }}>
                        Could not reach n8n: {webhookError}. Please try again.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CREATE AD
      ═══════════════════════════════════════════════════════ */}
      {tab === "create" && (
        <div className="animate-fade-in">
          {!analysisData && (
            <div
              style={{
                background: "var(--amber-light)",
                border: "0.5px solid var(--amber)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--amber)",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                No competitor analysis yet
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--amber-dark)",
                }}
              >
                Run competitor analysis first so AI can create a
                better ad based on real data.
              </div>
            </div>
          )}

          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Select topic</SectionTitle>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 20,
              }}
            >
              {TOPICS.map((t) => (
                <button
                  key={t}
                  style={topicBtnStyle(t)}
                  onClick={() => setSelectedTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <SectionTitle>n8n Workflow Steps</SectionTitle>
            <WorkflowStep
              step="1"
              label="Topic + analysis data sent to n8n"
              sub="Competitor brief + topic = better ad"
              active={adStatus === "idle"}
              done={adStatus !== "idle"}
            />
            <WorkflowStep
              step="2"
              label="Claude generates ad copy"
              sub="Using top hook patterns and ready templates"
              active={adStatus === "waiting"}
              done={adStatus === "done"}
            />
            <WorkflowStep
              step="3"
              label="Runway ML video / DALL-E image"
              sub="28-sec reel or static visual"
              active={adStatus === "waiting"}
              done={adStatus === "done"}
            />
            <WorkflowStep
              step="4"
              label="Ready ad sent to Approval tab"
              sub="You confirm budget & launch"
              active={false}
              done={adStatus === "done"}
            />

            <div>
              {/* Toggle configuration panel */}
              {!createTabConfigOpen ? (
                <button
                  onClick={() => setCreateTabConfigOpen(true)}
                  disabled={adStatus === "generating" || adStatus === "waiting" || !analysisData}
                  style={{
                    width: "100%",
                    padding: "11px 18px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "var(--surface)" : "var(--primary)",
                    color: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "var(--primary)" : "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "not-allowed" : "pointer",
                    opacity: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? 0.7 : 1,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.2s",
                  }}
                >
                  {adStatus === "generating" ? <><Spinner size={12} color="var(--primary)" /> Sending to n8n...</> :
                    adStatus === "waiting" ? <><Spinner size={12} color="var(--primary)" /> Generating ad...</> :
                      "Generate ad — trigger n8n"}
                </button>
              ) : (
                <div className="animate-fade-in" style={{
                  padding: 18, borderRadius: "var(--radius-md)",
                  background: "var(--surface)", border: "0.5px solid var(--border-light)",
                }}>
                  {/* Cancel button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button
                      onClick={() => setCreateTabConfigOpen(false)}
                      style={{
                        padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                        background: "var(--card-bg)", color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* ── PHASE 1: TOTAL QUANTITY ── */}
                  <div style={{
                    padding: 24, borderRadius: "var(--radius-lg)",
                    background: "var(--surface)", border: "0.5px solid var(--border-light)",
                    marginBottom: 20, position: "relative", overflow: "hidden"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                          STEP 1: HOW MANY ADS?
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                          Pick the total number of creatives you want to generate.
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => updateCreateTabTotalAds(n)}
                            type="button"
                            style={{
                              width: 38, height: 38, borderRadius: "var(--radius-md)",
                              border: createTabAdsConfig.totalAds === n ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                              background: createTabAdsConfig.totalAds === n ? "var(--primary-light)" : "var(--card-bg)",
                              color: createTabAdsConfig.totalAds === n ? "var(--primary)" : "var(--text)",
                              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                              fontFamily: "inherit"
                            }}
                          >
                            {n}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={createTabAdsConfig.totalAds}
                          onChange={(e) => updateCreateTabTotalAds(parseInt(e.target.value) || 1)}
                          style={{
                            width: 50, padding: "8px 0", textAlign: "center", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)", background: "var(--card-bg)",
                            color: "var(--text)", fontSize: 13, fontWeight: 600, outline: "none",
                            fontFamily: "inherit"
                          }}
                        />
                      </div>
                    </div>

                    {/* ── PHASE 2: ALLOCATION ── */}
                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                              STEP 2: ALLOCATE TYPES
                            </div>
                            <div style={{
                              fontSize: 10, padding: "2px 6px", borderRadius: 4,
                              background: "var(--amber-light)", color: "var(--amber)", fontWeight: 700,
                              border: "0.5px solid var(--amber)"
                            }}>
                              LIMIT: 3V / 2I
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                            Divide your {createTabAdsConfig.totalAds} ads into Videos and Images.
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card-bg)", padding: 4, borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                          <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: createTabAdsConfig.videoCount >= 3 ? "var(--primary)" : "var(--text)" }}>
                            🎬 {createTabAdsConfig.videoCount}/3
                          </div>
                          <div style={{ width: 1, height: 16, background: "var(--border)" }} />
                          <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: createTabAdsConfig.imageCount >= 2 ? "var(--amber)" : "var(--text)" }}>
                            🖼️ {createTabAdsConfig.imageCount}/2
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {createTabAdsConfig.items.map((item, idx) => {
                          const videoDisabled = item.type !== "video" && createTabAdsConfig.videoCount >= 3;
                          const imageDisabled = item.type !== "image" && createTabAdsConfig.imageCount >= 2;

                          return (
                            <div key={item.id} style={{
                              flex: "1 1 120px", display: "flex", flexDirection: "column", gap: 6
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginLeft: 2 }}>AD {idx + 1}</div>
                              <div style={{
                                display: "flex", borderRadius: "var(--radius-md)", overflow: "hidden",
                                border: "1px solid var(--border)", background: "var(--card-bg)"
                              }}>
                                <button
                                  onClick={() => setCreateTabItemType(idx, "video")}
                                  type="button"
                                  style={{
                                    flex: 1, padding: "10px 0", border: "none", cursor: videoDisabled ? "not-allowed" : "pointer",
                                    background: item.type === "video" ? "var(--primary-light)" : "transparent",
                                    color: item.type === "video" ? "var(--primary)" : "var(--text-dim)",
                                    fontSize: 14, transition: "all 0.15s",
                                    opacity: videoDisabled ? 0.3 : 1
                                  }}
                                  title={videoDisabled ? "3 Video maximum reached" : "Video"}
                                >
                                  🎬
                                </button>
                                <button
                                  onClick={() => setCreateTabItemType(idx, "image")}
                                  type="button"
                                  style={{
                                    flex: 1, padding: "10px 0", border: "none", cursor: imageDisabled ? "not-allowed" : "pointer",
                                    background: item.type === "image" ? "var(--amber-light)" : "transparent",
                                    color: item.type === "image" ? "var(--amber)" : "var(--text-dim)",
                                    fontSize: 14, transition: "all 0.15s",
                                    opacity: imageDisabled ? 0.3 : 1
                                  }}
                                  title={imageDisabled ? "2 Image maximum reached" : "Image"}
                                >
                                  🖼️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── PHASE 3: DETAILED CONFIG ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    {createTabAdsConfig.items.map((item, idx) => {
                      const isVideo = item.type === "video";
                      return (
                        <div key={item.id} style={{
                          padding: 20, borderRadius: "var(--radius-lg)",
                          background: isVideo ? "linear-gradient(to bottom, var(--card-bg), var(--surface))" : "linear-gradient(to bottom, var(--card-bg), var(--amber-light))",
                          border: `1.5px solid ${isVideo ? "var(--primary-light)" : "var(--amber-light)"}`,
                          boxShadow: "var(--shadow-sm)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                            <span style={{ fontSize: 20 }}>{isVideo ? "🎬" : "🖼️"}</span>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                              {isVideo ? "Video" : "Image"} {idx + 1} Configuration
                            </div>
                          </div>

                          {isVideo ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Duration</div>
                                  <select
                                    value={item.duration}
                                    onChange={(e) => updateCreateTabItemField(idx, "duration", e.target.value)}
                                    style={{
                                      width: "100%", padding: "10px", borderRadius: "var(--radius-md)",
                                      border: "1px solid var(--border)", background: "var(--card-bg)",
                                      fontSize: 12, outline: "none", color: "var(--text)", fontFamily: "inherit"
                                    }}
                                  >
                                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Audio Style</div>
                                  <select
                                    value={item.audioStyle}
                                    onChange={(e) => updateCreateTabItemField(idx, "audioStyle", e.target.value)}
                                    style={{
                                      width: "100%", padding: "10px", borderRadius: "var(--radius-md)",
                                      border: "1px solid var(--border)", background: "var(--card-bg)",
                                      fontSize: 12, outline: "none", color: "var(--text)", fontFamily: "inherit"
                                    }}
                                  >
                                    {AUDIO_STYLES.map(a => <option key={a} value={a}>{a}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Visual Style</div>
                                <select
                                  value={item.videoStyle}
                                  onChange={(e) => updateCreateTabItemField(idx, "videoStyle", e.target.value)}
                                  style={{
                                    width: "100%", padding: "10px", borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)", background: "var(--card-bg)",
                                    fontSize: 12, outline: "none", color: "var(--text)", fontFamily: "inherit"
                                  }}
                                >
                                  {VIDEO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Script / Storyboard Idea</div>
                                <textarea
                                  placeholder="e.g. generate a video with offer and sales ads..."
                                  value={item.idea}
                                  onChange={(e) => updateCreateTabItemField(idx, "idea", e.target.value)}
                                  style={{
                                    width: "100%", minHeight: 80, padding: "12px", borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)", background: "var(--card-bg)",
                                    fontSize: 12, outline: "none", color: "var(--text)", resize: "vertical", fontFamily: "inherit"
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Visual Style</div>
                                <select
                                  value={item.imageStyle || "Bold & Colorful"}
                                  onChange={(e) => updateCreateTabItemField(idx, "imageStyle", e.target.value)}
                                  style={{
                                    width: "100%", padding: "10px", borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)", background: "var(--card-bg)",
                                    fontSize: 12, outline: "none", color: "var(--text)", fontFamily: "inherit"
                                  }}
                                >
                                  {VIDEO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Image Description / Prompt</div>
                                <textarea
                                  placeholder="Describe the aesthetic, colors, and subject of the image..."
                                  value={item.idea}
                                  onChange={(e) => updateCreateTabItemField(idx, "idea", e.target.value)}
                                  style={{
                                    width: "100%", minHeight: 80, padding: "12px", borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)", background: "var(--card-bg)",
                                    fontSize: 12, outline: "none", color: "var(--text)", resize: "vertical", fontFamily: "inherit"
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit / Status Area */}
                  <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: "var(--radius-lg)", background: "var(--surface)", border: "1px solid var(--border-light)" }}>
                    {(isStatusPolling || adStatus === "waiting") ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ position: "relative", height: 2, background: "var(--primary-light)", borderRadius: 1, overflow: "hidden", marginBottom: 12 }}>
                          <div className="animate-pulse" style={{
                            position: "absolute", top: 0, left: 0, height: "100%", width: "30%",
                            background: "var(--primary)", borderRadius: 1,
                            animation: "scan 2s linear infinite"
                          }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="animate-pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)" }} />
                            <SectionTitle style={{ marginBottom: 0 }}>Workflow in Progress</SectionTitle>
                          </div>
                          <Badge text="RUNNING" color="var(--primary)" bg="var(--primary-light)" />
                        </div>

                        <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--card-bg)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Current Status</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
                            <Spinner size={14} color="var(--primary)" />
                            {workflowStatus || "Video is Generating..."}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic" }}>
                            n8n is orchestrating Claude 3.5 and Runway ML. Ad previews will refresh automatically upon completion.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15 }}>🚀</span>
                          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                            <b>{createTabAdsConfig.totalAds} Ads</b> ready ({createTabAdsConfig.videoCount}V / {createTabAdsConfig.imageCount}I)
                          </div>
                        </div>
                        <button
                          onClick={handleCreateTabTriggerAds}
                          disabled={adStatus === "generating" || adStatus === "waiting" || !analysisData}
                          type="button"
                          style={{
                            padding: "12px 30px", borderRadius: "var(--radius-lg)", border: "none",
                            background: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "var(--primary-light)" : "linear-gradient(135deg, #f97316, #ec4899)",
                            color: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "var(--primary)" : "#fff",
                            fontSize: 13, fontWeight: 700, cursor: (adStatus === "generating" || !analysisData) ? "not-allowed" : "pointer",
                            fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8,
                            opacity: (adStatus === "generating" || !analysisData) ? 0.7 : 1, transition: "transform 0.15s, box-shadow 0.15s",
                            boxShadow: (adStatus === "generating" || adStatus === "waiting" || !analysisData) ? "none" : "0 4px 12px rgba(236, 72, 153, 0.3)"
                          }}
                          onMouseEnter={(e) => { if (adStatus !== "generating") e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          {adStatus === "generating" ? <><Spinner size={14} /> Triggering...</> : "Confirm & Generate Ads →"}
                        </button>
                      </div>
                    )}

                    {adStatus === "error" && (
                      <div style={{ marginTop: 12, padding: 10, borderRadius: "var(--radius-sm)", background: "var(--red-light)", color: "var(--red-strong)", fontSize: 12, border: "0.5px solid var(--red)" }}>
                        <b>Error:</b> {webhookError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>


          {/* Top hook patterns reference — shown when analysis data available */}
          {adStatus === "idle" && analysisData?.hooks_table?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <SectionTitle>Top Hook Patterns from Analysis</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(analysisData.hooks_table || []).map((row, idx) => (
                  <div key={idx} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--radius-md)", fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: 3 }}>{row?.pattern}</div>
                    <div style={{ color: "var(--text-body)", fontStyle: "italic" }}>&ldquo;{row?.example}&rdquo;</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── AD PREVIEWS ── */}
          {(() => {
            const adIds = [1, 2, 3, 4, 5]; // Mapping to Ad 1-3, Image 1-2
            return (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <SectionTitle style={{ marginBottom: 0 }}>Ad Previews — Dynamic Table</SectionTitle>
                  <button
                    onClick={handleRefreshAdVideos}
                    disabled={adVideosLoading}
                    type="button"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 24px", borderRadius: "var(--radius-md)",
                      border: "0.5px solid var(--border)", background: "var(--surface)",
                      color: "var(--text)", fontSize: 13, fontWeight: 600,
                      cursor: adVideosLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit", opacity: adVideosLoading ? 0.6 : 1,
                      transition: "all 0.2s",
                      boxShadow: "var(--shadow-sm)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}
                  >
                    <span style={{
                      display: "inline-block",
                      fontSize: 16,
                      animation: adVideosLoading ? "spin 1s linear infinite" : "none"
                    }}>↻</span>
                    {adVideosLoading ? "Refreshing..." : "Refresh Previews"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* HELPER FOR RENDERING CARDS */}
                  {(() => {
                    const renderCard = (id) => {
                      const latestEntry = adTableLinks[id];
                      const url = latestEntry?.text || "";
                      const isVideo = (latestEntry?.format || "").toLowerCase() === "video";
                      let label = `Ad ${id}`;
                      if (id === 4) label = "Ad 4 (Image 1)";
                      if (id === 5) label = "Ad 5 (Image 2)";

                      return (
                        <Card key={id} style={{ padding: 12, height: "100%" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {label}
                          </div>
                          <div style={{ 
                            background: "#000", 
                            borderRadius: "var(--radius-md)", 
                            aspectRatio: "9/16", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            overflow: "hidden",
                            boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)"
                          }}>
                            {latestEntry?.Approved ? (
                              <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, textAlign: "center", padding: 20 }}>
                                NO data to preview
                              </div>
                            ) : !url ? (
                              <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 10 }}>
                                Waiting for {label} link...
                              </div>
                            ) : isVideo ? (
                              <video
                                key={url}
                                src={url}
                                controls
                                autoPlay={false}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            ) : (
                              <img
                                key={url}
                                src={url}
                                alt={label}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            )}
                          </div>

                          {url && !latestEntry?.Approved && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                              <button
                                onClick={() => setSelectedAdForDetails(latestEntry)}
                                style={{
                                  flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                                  gap: 6, padding: "8px 0", borderRadius: "var(--radius-md)",
                                  border: "1px solid var(--border)", background: "var(--surface)",
                                  color: "var(--text)", fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                                  cursor: "pointer", fontFamily: "inherit"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}
                              >
                                ↗ Full View
                              </button>
                              <button
                                onClick={() => handleApproveAd(latestEntry)}
                                disabled={latestEntry?.Approved || approvingId === (latestEntry?.id + "_" + latestEntry?.time)}
                                style={{
                                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                  gap: 6, padding: "8px 0", borderRadius: "var(--radius-md)",
                                  border: "none",
                                  background: latestEntry?.Approved ? "var(--green-light)" : "var(--primary)",
                                  color: latestEntry?.Approved ? "var(--green)" : "#fff",
                                  fontSize: 11, fontWeight: 600,
                                  cursor: latestEntry?.Approved ? "default" : "pointer",
                                  opacity: approvingId === (latestEntry?.id + "_" + latestEntry?.time) ? 0.7 : 1,
                                  transition: "all 0.15s"
                                }}
                              >
                                {approvingId === (latestEntry?.id + "_" + latestEntry?.time) ? (
                                  <Spinner size={10} />
                                ) : latestEntry?.Approved ? (
                                  "✓ Approved"
                                ) : (
                                  "✓ Approve"
                                )}
                              </button>
                            </div>
                          )}
                        </Card>
                      );
                    };

                    return (
                      <div style={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        justifyContent: "center", 
                        gap: "32px", 
                        padding: "0 20px",
                        maxWidth: "960px", // Increased from 780px
                        margin: "0 auto"
                      }}>
                        {[1, 2, 3, 4, 5].map(id => (
                          <div key={id} style={{ width: "260px" }}>
                            {renderCard(id)}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          APPROVAL
      ═══════════════════════════════════════════════════════ */}
      {tab === "approval" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ paddingBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <SectionTitle style={{ marginBottom: 4 }}>Ad Approval Queue</SectionTitle>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Review and launch your final approved creatives from the database.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                background: "var(--green-light)", padding: "8px 16px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--green)", display: "flex", alignItems: "center", gap: 8
              }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase" }}>Approved</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{allApprovedAds.length}</div>
                </div>
              </div>
            </div>
          </div>

          {allApprovedAds.length === 0 ? (
            <EmptyState
              title="No ads approved yet"
              description="Go to the 'Create Ad' tab to preview and approve your generated creatives. Once approved, they will appear here for final launch."
            />
          ) : (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "32px", 
              padding: "0 40px",
              maxWidth: "1200px",
              margin: "0 auto"
            }}>
              {[...allApprovedAds]
                .sort((a, b) => Number(a.id) - Number(b.id))
                .map((ad) => {
                const isVid = (ad.format || "").toLowerCase() === "video";
                return (
                  <Card key={`${ad.id}_${ad.time}`} style={{ padding: 12, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge
                          text={isVid ? "Video" : "Image"}
                          color={isVid ? "var(--primary)" : "var(--amber)"}
                          bg={isVid ? "var(--primary-light)" : "var(--amber-light)"}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                          AD {ad.id}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 500 }}>
                        {new Date(ad.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div style={{
                      background: "#000", 
                      borderRadius: "var(--radius-md)", 
                      border: "1px solid var(--border-light)",
                      aspectRatio: "9/16", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      overflow: "hidden", 
                      marginBottom: 16, 
                      boxShadow: "var(--shadow-sm)"
                    }}>
                      {isVid ? (
                        <video src={ad.text} controls autoPlay={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <img src={ad.text} alt={`Approved Ad ${ad.id}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      )}
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => setSelectedAdForDetails(ad)}
                        style={{
                          textDecoration: "none", textAlign: "center", fontSize: 11, fontWeight: 700,
                          padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                          color: "var(--text)", background: "var(--surface)", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          cursor: "pointer", fontFamily: "inherit"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}
                      >
                        ↗ Full View & Details
                      </button>
                      <button
                        onClick={() => {
                          setLaunchAdCandidate(ad);
                          setTab("campaigns");
                        }}
                        style={{
                          border: "none", borderRadius: "var(--radius-md)", padding: "10px",
                          background: "linear-gradient(135deg, var(--primary), #6366f1)",
                          color: "#fff", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                          transition: "transform 0.1s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        Launch to Facebook Ads Manager →
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CAMPAIGN SETUP
      ═══════════════════════════════════════════════════════ */}
      {tab === "campaigns" && (
        <CampaignSetup
          selectedId={selectedMetaCampaign?.id}
          selectedAd={launchAdCandidate}
          onSelect={(campaign) => setSelectedMetaCampaign(campaign)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          RUNNING CAMPAIGNS (LIVE META)
      ═══════════════════════════════════════════════════════ */}
      {tab === "live_campaigns" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <SectionTitle style={{ marginBottom: 4 }}>Running Campaigns</SectionTitle>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Monitor and control your live Meta Ads. Run, pause, or delete individual ads.
              </div>
            </div>
            <button
              onClick={fetchLiveCampaigns}
              disabled={liveLoading}
              style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border)", background: "#fff", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
            >
              {liveLoading ? <Spinner size={12} /> : "↻"} Refresh Data
            </button>
          </div>

          {liveError && (
            <Card style={{ background: "var(--red-light)", border: "1px solid var(--red-strong)" }}>
              <div style={{ color: "var(--red-strong)", fontSize: 14 }}>{liveError}</div>
            </Card>
          )}

          {!liveLoading && liveCampaigns.length === 0 && !liveError && (
            <Card>
              <EmptyState title="No campaigns found" sub="Start a new campaign in the 'Campaign Setup' tab." />
            </Card>
          )}

          {liveCampaigns.map(campaign => (
            <Card key={campaign.id} style={{ padding: 0, overflow: "hidden" }}>
              {/* Campaign Header */}
              <div
                onClick={() => setExpandedCampaigns(prev => {
                  const next = new Set(prev);
                  if (next.has(campaign.id)) next.delete(campaign.id);
                  else next.add(campaign.id);
                  return next;
                })}
                style={{ padding: "16px 20px", background: "var(--surface)", borderBottom: expandedCampaigns.has(campaign.id) ? "1px solid var(--border-light)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, color: "var(--primary)", transition: "transform 0.2s", transform: expandedCampaigns.has(campaign.id) ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{campaign.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ID: {campaign.id} • {campaign.objective}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge
                    text={campaign.effective_status}
                    color={campaign.effective_status === "ACTIVE" ? "var(--green)" : "var(--amber)"}
                    bg={campaign.effective_status === "ACTIVE" ? "var(--green-light)" : "var(--amber-light)"}
                  />
                </div>
              </div>

              {/* Campaign Body (Ad Sets) */}
              {expandedCampaigns.has(campaign.id) && (
                <div style={{ padding: "10px 20px 20px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {campaign.adsets?.data?.length > 0 ? campaign.adsets.data.map(adset => (
                    <div key={adset.id} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                      {/* Ad Set Header */}
                      <div
                        onClick={() => setExpandedAdSets(prev => {
                          const next = new Set(prev);
                          if (next.has(adset.id)) next.delete(adset.id);
                          else next.add(adset.id);
                          return next;
                        })}
                        style={{ padding: "12px 16px", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 13, color: "var(--primary)", transition: "transform 0.2s", transform: expandedAdSets.has(adset.id) ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Set: {adset.name}</span>
                        </div>
                        <Badge
                          text={adset.effective_status}
                          color={adset.effective_status === "ACTIVE" ? "var(--green)" : "var(--amber)"}
                          bg={adset.effective_status === "ACTIVE" ? "var(--green-light)" : "var(--amber-light)"}
                        />
                      </div>

                      {/* Ad Set Body (Ads) */}
                      {expandedAdSets.has(adset.id) && (
                        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, background: "var(--card-bg)" }}>
                          {adset.ads?.data?.length > 0 ? adset.ads.data.map(ad => {
                            const insights = ad.insights?.data?.[0] || {};
                            return (
                              <div key={ad.id} style={{ display: "flex", gap: 16, padding: 12, borderRadius: "var(--radius-sm)", background: "var(--surface)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)" }}>
                                {/* Ad Image/Thumbnail */}
                                <div style={{ width: 80, height: 80, borderRadius: "8px", background: "#000", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-light)" }}>
                                  {ad.creative?.thumbnail_url ? (
                                    <img src={ad.creative.thumbnail_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 20 }}>🎬</div>
                                  )}
                                </div>

                                {/* Ad Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, color: "var(--text)" }}>{ad.name}</div>
                                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {ad.id}</div>
                                    </div>
                                    <Badge
                                      text={ad.effective_status}
                                      color={ad.effective_status === "ACTIVE" ? "var(--green)" : "var(--amber)"}
                                      bg={ad.effective_status === "ACTIVE" ? "var(--green-light)" : "var(--amber-light)"}
                                    />
                                  </div>

                                  {/* Metrics Row */}
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12, background: "var(--card-bg)", padding: "8px 12px", borderRadius: "8px" }}>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Spend</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>${insights.spend || "0.00"}</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>CTR</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{parseFloat(insights.inline_link_click_ctr || 0).toFixed(2)}%</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Clicks</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{insights.clicks || "0"}</span>
                                    </div>
                                  </div>

                                  {/* Controls */}
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                      onClick={() => handleUpdateStatus(ad.id, "Ad", "ACTIVE", "run")}
                                      disabled={ad.effective_status === "ACTIVE" || updatingStatusId === ad.id}
                                      style={{ padding: "6px 16px", borderRadius: "var(--radius- pill)", border: "1.5px solid var(--green)", background: ad.effective_status === "ACTIVE" ? "var(--green-light)" : "transparent", color: "var(--green)", fontSize: 11, fontWeight: 800, cursor: ad.effective_status === "ACTIVE" ? "default" : "pointer", opacity: updatingStatusId === ad.id ? 0.5 : 1, transition: "all 0.2s" }}
                                    >
                                      Run
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(ad.id, "Ad", "PAUSED", "pause")}
                                      disabled={ad.effective_status === "PAUSED" || updatingStatusId === ad.id}
                                      style={{ padding: "6px 16px", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--amber)", background: ad.effective_status === "PAUSED" ? "var(--amber-light)" : "transparent", color: "var(--amber)", fontSize: 11, fontWeight: 800, cursor: ad.effective_status === "PAUSED" ? "default" : "pointer", opacity: updatingStatusId === ad.id ? 0.5 : 1, transition: "all 0.2s" }}
                                    >
                                      Pause
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(ad.id, "Ad", null, "delete")}
                                      disabled={updatingStatusId === ad.id}
                                      style={{ padding: "6px 16px", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--red-strong)", background: "transparent", color: "var(--red-strong)", fontSize: 11, fontWeight: 800, cursor: "pointer", opacity: updatingStatusId === ad.id ? 0.5 : 1, transition: "all 0.2s" }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }) : <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: 10 }}>No ads found in this set.</div>}
                        </div>
                      )}
                    </div>
                  )) : <div style={{ fontSize: 13, color: "var(--text-dim)", padding: 20, textAlign: "center" }}>No ad sets found in this campaign.</div>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SOCIAL POSTS
      ═══════════════════════════════════════════════════════ */}
      {tab === "social" && (
        <div className="animate-fade-in">
          <Card>
            <SectionTitle>
              Upcoming events &amp; special days — auto-detected by n8n
            </SectionTitle>
            {[
              { event: "World Health Day", date: "Mon 7 Apr", type: "Awareness", status: "scheduled" },
              { event: "National Nurses Week", date: "Tue 6 May", type: "Appreciation", status: "scheduled" },
              { event: "Mental Health Month", date: "Thu 1 May", type: "Awareness", status: "draft" },
              { event: "Medical Conference", date: "Sat 15 Nov", type: "Local event", status: "draft" },
            ].map((e, i, arr) => {
              const isActive = socialActiveEvt === e.event && (socialStatus === "generating" || socialStatus === "waiting");
              const isDone = socialActiveEvt === e.event && socialStatus === "done";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: i < arr.length - 1 ? "0.5px solid var(--border-light)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.event}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{e.date} · {e.type}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge
                      text={isDone ? "Posted" : e.status}
                      color={isDone ? "var(--green)" : e.status === "scheduled" ? "var(--green)" : "var(--amber)"}
                      bg={isDone ? "var(--green-light)" : e.status === "scheduled" ? "var(--green-light)" : "var(--amber-light)"}
                    />
                    <button
                      onClick={() => generateSocialPost(e.event)}
                      disabled={isActive || isDone}
                      style={{
                        fontSize: 11,
                        padding: "5px 12px",
                        borderRadius: "var(--radius-pill)",
                        border: "1px solid var(--primary)",
                        background: isActive || isDone ? "var(--primary-light)" : "transparent",
                        color: "var(--primary)",
                        cursor: isActive || isDone ? "not-allowed" : "pointer",
                        opacity: isActive || isDone ? 0.6 : 1,
                        fontWeight: 500,
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "background 0.15s",
                      }}
                    >
                      {isActive ? <><Spinner size={9} color="var(--primary)" /> Generating...</> :
                        isDone ? "✓ Done" :
                          "Generate post"}
                    </button>
                  </div>
                </div>
              );
            })}

            {socialStatus === "error" && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--red-strong)" }}>
                Could not reach n8n: {webhookError}. Please try again.
              </div>
            )}

            {analysisData?.gaps_table?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <SectionTitle>Top Opportunities from Analysis</SectionTitle>
                <div style={{ background: "var(--primary-light)", padding: 14, borderRadius: "var(--radius-md)" }}>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--purple-dark)", lineHeight: 1.6 }}>
                    {(analysisData.gaps_table || []).map((row, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}><strong>{row?.gap}:</strong> {row?.opportunity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          REPORTS — Supabase Intelligence Dashboard
      ═══════════════════════════════════════════════════════ */}
      {tab === "reports" && (
        <div className="animate-fade-in">
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Competitor Ads Intelligence</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "dotPulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Connected to Supabase</span>
              </div>
            </div>
            <div>
              <button
                onClick={generateReport}
                disabled={reportStatus === "generating" || reportStatus === "waiting"}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: reportStatus === "done" ? "var(--green)" : reportStatus === "generating" || reportStatus === "waiting" ? "var(--surface)" : "var(--primary)",
                  color: reportStatus === "generating" || reportStatus === "waiting" ? "var(--primary)" : "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: reportStatus === "generating" || reportStatus === "waiting" ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.2s",
                }}
              >
                {reportStatus === "generating" || reportStatus === "waiting"
                  ? <><Spinner size={12} color="var(--primary)" /> Generating...</>
                  : reportStatus === "done"
                    ? "✓ Report triggered"
                    : "Manual report trigger"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
            <MetricCard label="Total Reports" value={sbTotalReports} sub="From Supabase" color="var(--primary)" bg="var(--primary-light)" />
            <MetricCard label="Competitors Tracked" value={sbTotalCompetitors} sub="All reports" color="var(--blue)" bg="var(--blue-light)" />
            <MetricCard label="High Threats" value={sbHighThreats} sub="Needs attention" color="var(--red)" bg="var(--red-light)" dot={sbHighThreats > 0} />
            <MetricCard label="Pending Ads" value={sbPendingAds} sub="Not yet triggered" color="var(--amber)" bg="var(--amber-light)" dot={sbPendingAds > 0} />
          </div>

          {/* Loading state */}
          {sbLoading && (
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 30 }}>
                <Spinner size={16} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading reports from Supabase...</span>
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!sbLoading && sbReports.length === 0 && (
            <Card>
              <EmptyState
                title="No reports yet"
                sub="Run your n8n workflow to generate one. Reports will appear here automatically."
              />
            </Card>
          )}

          {/* Report cards */}
          {!sbLoading && sbReports.map(({ row, report }) => {
            const competitors = report.competitors_table || [];
            const hooks = report.hooks_table || [];
            const insights = report.market_insights_table || [];
            const gaps = report.gaps_table || [];
            const competitorCount = competitors.length;
            const highCount = competitors.filter((c) => c.threat === "high").length;
            const mediumCount = competitors.filter((c) => c.threat === "medium").length;
            const gapsCount = gaps.length;
            const triggered = sbSessionTriggered.has(row.id);
            const isTriggering = sbTriggeringId === row.id;
            const insightsOpen = sbExpandedInsights[row.id];
            const adsConfigOpen = sbAdsConfigOpen[row.id];
            const adsConfig = getAdsConfig(row.id);

            return (
              <Card key={row.id} style={{ marginBottom: 14 }}>
                {/* Top row: date + status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {formatSbDate(row.created_at)}
                  </span>
                  <Badge
                    text={triggered ? "Ads Created" : "Pending"}
                    color={triggered ? "var(--green)" : "var(--text-muted)"}
                    bg={triggered ? "var(--green-light)" : "var(--surface)"}
                  />
                </div>

                {/* Executive summary */}
                <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.7, marginBottom: 14 }}>
                  {report.executive_summary || "No summary available."}
                </p>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  <Badge text={`${competitorCount} competitors`} color="var(--blue)" bg="var(--blue-light)" />
                  {highCount > 0 && <Badge text={`${highCount} high threat`} color="var(--red)" bg="var(--red-light)" />}
                  {mediumCount > 0 && <Badge text={`${mediumCount} medium threat`} color="var(--amber)" bg="var(--amber-light)" />}
                  <Badge text={`${hooks.length} hooks`} color="var(--primary)" bg="var(--primary-light)" />
                  <Badge text={`${gapsCount} gaps`} color="var(--amber)" bg="var(--amber-light)" />
                </div>

                {/* ── INLINE: Top Competitors (always visible) ── */}
                {competitors.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                      Top Competitors
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {competitors.slice(0, 5).map((c, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", borderRadius: "var(--radius-sm)",
                          background: "var(--surface)", border: "0.5px solid var(--border-light)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, width: 18 }}>{i + 1}</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.ads} ads</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", borderRadius: 2,
                                  width: `${((c.score || 0) / 12) * 100}%`,
                                  background: c.score >= 9 ? "var(--red-error)" : c.score >= 6 ? "var(--amber)" : "var(--green)",
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.score}/12</span>
                            </div>
                            <Badge
                              text={c.threat}
                              color={c.threat === "high" ? "var(--red)" : c.threat === "medium" ? "var(--amber)" : "var(--green)"}
                              bg={c.threat === "high" ? "var(--red-light)" : c.threat === "medium" ? "var(--amber-light)" : "var(--green-light)"}
                            />
                          </div>
                        </div>
                      ))}
                      {competitors.length > 5 && (
                        <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 4 }}>
                          +{competitors.length - 5} more — click &ldquo;View Full Report&rdquo; to see all
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── INLINE: Top Hooks (always visible) ── */}
                {hooks.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                      Top Hooks
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {hooks.slice(0, 4).map((h, i) => (
                        <div key={i} style={{
                          padding: "10px 12px", borderRadius: "var(--radius-sm)",
                          background: "var(--surface)", border: "0.5px solid var(--border-light)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{h.pattern}</span>
                            <Badge
                              text={h.score}
                              color={(h.score || "").toLowerCase() === "strong" ? "var(--green)" : (h.score || "").toLowerCase() === "moderate" ? "var(--amber)" : "var(--text-muted)"}
                              bg={(h.score || "").toLowerCase() === "strong" ? "var(--green-light)" : (h.score || "").toLowerCase() === "moderate" ? "var(--amber-light)" : "var(--surface)"}
                            />
                          </div>
                          <p style={{ fontSize: 11, fontStyle: "italic", color: "var(--amber)", lineHeight: 1.5 }}>
                            &ldquo;{h.example}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── INLINE: Top Gaps (always visible) ── */}
                {gaps.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                      Gaps & Opportunities
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[...gaps].sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
                      }).slice(0, 3).map((g, i) => (
                        <div key={i} style={{
                          padding: "10px 12px", borderRadius: "var(--radius-sm)",
                          background: "var(--surface)", border: "0.5px solid var(--border-light)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Badge
                              text={g.priority?.toUpperCase()}
                              color={g.priority === "high" ? "var(--red)" : g.priority === "medium" ? "var(--amber)" : "var(--green)"}
                              bg={g.priority === "high" ? "var(--red-light)" : g.priority === "medium" ? "var(--amber-light)" : "var(--green-light)"}
                            />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{g.gap}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, paddingLeft: 2 }}>
                            <span style={{ fontSize: 11 }}>💡</span>
                            <p style={{ fontSize: 11, color: "var(--text-body)", lineHeight: 1.5 }}>{g.opportunity}</p>
                          </div>
                        </div>
                      ))}
                      {gaps.length > 3 && (
                        <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", padding: 4 }}>
                          +{gaps.length - 3} more gaps — click &ldquo;View Full Report&rdquo; to see all
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <SecondaryButton
                    onClick={() => setSbExpandedInsights((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                  >
                    {insightsOpen ? "Hide Insights" : "View Insights"}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() => { setSbModalReport({ row, report }); setSbModalTab("competitors"); }}
                  >
                    View Full Report
                  </SecondaryButton>
                  {triggered ? (
                    <span style={{
                      padding: "7px 14px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500,
                      background: "var(--green-light)", color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      Ads Triggered ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => setSbAdsConfigOpen((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                      style={{
                        padding: "7px 16px", borderRadius: "var(--radius-md)", border: "none",
                        background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                        transition: "opacity 0.2s, transform 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      {adsConfigOpen ? "Cancel" : "Generate Ads →"}
                    </button>
                  )}
                </div>

                {/* ── Video Configuration Panel ── */}
                {adsConfigOpen && !triggered && (
                  <div className="animate-slide-down" style={{
                    marginTop: 14, padding: 18, borderRadius: "var(--radius-md)",
                    background: "var(--surface)", border: "0.5px solid var(--border-light)",
                  }}>
                    {/* Number of Ads */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                        Number of Ads to Generate
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={adsConfig.numAds}
                        onChange={(e) => setNumAds(row.id, parseInt(e.target.value) || 1)}
                        style={{
                          width: 70, padding: "8px 10px", borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)", background: "var(--card-bg)",
                          color: "var(--text)", fontSize: 13, fontFamily: "inherit", fontWeight: 500,
                          outline: "none", transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      />
                    </div>

                    {/* Video configs */}
                    {adsConfig.videos.map((video, vIdx) => (
                      <div key={vIdx} style={{
                        padding: 16, borderRadius: "var(--radius-md)", marginBottom: 12,
                        background: "var(--card-bg)", border: "0.5px solid var(--border)",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 15 }}>🎬</span> Video {vIdx + 1} Configuration
                        </div>

                        {/* Row 1: Video Type + Duration */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                              Video Type
                            </div>
                            <select
                              value={video.videoType}
                              onChange={(e) => updateVideoConfig(row.id, vIdx, "videoType", e.target.value)}
                              style={{
                                width: "100%", padding: "9px 10px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)", background: "var(--card-bg)",
                                color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                                outline: "none", cursor: "pointer", appearance: "auto",
                              }}
                            >
                              {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                              Duration
                            </div>
                            <select
                              value={video.duration}
                              onChange={(e) => updateVideoConfig(row.id, vIdx, "duration", e.target.value)}
                              style={{
                                width: "100%", padding: "9px 10px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)", background: "var(--card-bg)",
                                color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                                outline: "none", cursor: "pointer", appearance: "auto",
                              }}
                            >
                              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Audio Style + Video Style */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                              Audio Style
                            </div>
                            <select
                              value={video.audioStyle}
                              onChange={(e) => updateVideoConfig(row.id, vIdx, "audioStyle", e.target.value)}
                              style={{
                                width: "100%", padding: "9px 10px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)", background: "var(--card-bg)",
                                color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                                outline: "none", cursor: "pointer", appearance: "auto",
                              }}
                            >
                              {AUDIO_STYLES.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                              Video Style
                            </div>
                            <select
                              value={video.videoStyle}
                              onChange={(e) => updateVideoConfig(row.id, vIdx, "videoStyle", e.target.value)}
                              style={{
                                width: "100%", padding: "9px 10px", borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)", background: "var(--card-bg)",
                                color: "var(--text)", fontSize: 12, fontFamily: "inherit",
                                outline: "none", cursor: "pointer", appearance: "auto",
                              }}
                            >
                              {VIDEO_STYLES.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Video Idea */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                            Video Idea
                          </div>
                          <textarea
                            placeholder="e.g. generate a video with offer and sales ads, customer review and about service..."
                            value={video.videoIdea}
                            onChange={(e) => updateVideoConfig(row.id, vIdx, "videoIdea", e.target.value)}
                            style={{
                              width: "100%", minHeight: 60, padding: "10px 12px",
                              borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                              background: "var(--card-bg)", color: "var(--text)", fontSize: 12,
                              fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                              outline: "none", transition: "border-color 0.15s",
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Submit */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        {adsConfig.numAds} video{adsConfig.numAds > 1 ? "s" : ""} configured — report data + config will be sent to the ads workflow
                      </span>
                      <button
                        onClick={() => handleTriggerAds(row.id, report)}
                        disabled={isTriggering}
                        style={{
                          padding: "9px 22px", borderRadius: "var(--radius-md)", border: "none",
                          background: "linear-gradient(135deg, #f97316, #ec4899)", color: "#fff",
                          fontSize: 12, fontWeight: 600, cursor: isTriggering ? "not-allowed" : "pointer",
                          fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                          opacity: isTriggering ? 0.7 : 1, transition: "opacity 0.2s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!isTriggering) e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        {isTriggering ? <><Spinner size={12} /> Triggering...</> : "Confirm & Generate Ads →"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Market Insights Panel (toggled) */}
                {insightsOpen && insights.length > 0 && (
                  <div className="animate-slide-down" style={{
                    marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                    background: "var(--surface)", borderRadius: "var(--radius-md)", padding: 14,
                  }}>
                    {insights.map((ins, i) => {
                      const f = (ins.field || "").toLowerCase();
                      const icon = f.includes("format") ? "🎬" : f.includes("angle") ? "🎯" : f.includes("framework") ? "📐" : f.includes("cta") ? "👆" : "📋";
                      return (
                        <div key={i} style={{ padding: "10px 12px", background: "var(--card-bg)", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--border-light)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{icon}</span>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {ins.field}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.5 }}>{ins.value}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}

          {/* ── FULL REPORT MODAL ── */}
          {sbModalReport && (() => {
            const { report } = sbModalReport;
            const competitors = [...(report.competitors_table || [])].sort((a, b) => {
              const av = a[sbSortField], bv = b[sbSortField];
              if (typeof av === "number") return sbSortDir === "desc" ? bv - av : av - bv;
              return sbSortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
            });
            const gaps = [...(report.gaps_table || [])].sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
            });
            const modalTabs = [
              { id: "competitors", label: "Competitors" },
              { id: "hooks", label: "Hooks" },
              { id: "insights", label: "Market Insights" },
              { id: "gaps", label: "Gaps" },
            ];

            return (
              <div
                onClick={() => setSbModalReport(null)}
                style={{
                  position: "fixed", inset: 0, zIndex: 1000,
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 20, animation: "fadeIn 0.2s ease-out",
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-scale-in"
                  style={{
                    width: "100%", maxWidth: 820, maxHeight: "85vh",
                    background: "var(--card-bg)", border: "0.5px solid var(--border)",
                    borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                  }}
                >
                  {/* Modal header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid var(--border)" }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Full Report</div>
                    <button
                      onClick={() => setSbModalReport(null)}
                      style={{
                        width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                        background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 14, color: "var(--text-muted)", fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal tabs */}
                  <div style={{ display: "flex", gap: 4, padding: "12px 20px 0", borderBottom: "0.5px solid var(--border)" }}>
                    {modalTabs.map((mt) => (
                      <button
                        key={mt.id}
                        onClick={() => setSbModalTab(mt.id)}
                        style={{
                          padding: "8px 14px", fontSize: 12, fontWeight: sbModalTab === mt.id ? 600 : 400,
                          borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                          border: "none", cursor: "pointer", fontFamily: "inherit",
                          background: sbModalTab === mt.id ? "var(--primary-light)" : "transparent",
                          color: sbModalTab === mt.id ? "var(--primary)" : "var(--text-muted)",
                          transition: "all 0.15s",
                        }}
                      >
                        {mt.label}
                      </button>
                    ))}
                  </div>

                  {/* Modal content */}
                  <div style={{ flex: 1, overflow: "auto", padding: 20 }}>

                    {/* TAB: Competitors */}
                    {sbModalTab === "competitors" && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
                              <th style={{ padding: "8px 10px" }}>#</th>
                              <th style={{ padding: "8px 10px", cursor: "pointer" }} onClick={() => toggleSbSort("name")}>
                                Name {sbSortField === "name" && (sbSortDir === "desc" ? "↓" : "↑")}
                              </th>
                              <th style={{ padding: "8px 10px", cursor: "pointer" }} onClick={() => toggleSbSort("ads")}>
                                Ads {sbSortField === "ads" && (sbSortDir === "desc" ? "↓" : "↑")}
                              </th>
                              <th style={{ padding: "8px 10px", cursor: "pointer" }} onClick={() => toggleSbSort("score")}>
                                Score {sbSortField === "score" && (sbSortDir === "desc" ? "↓" : "↑")}
                              </th>
                              <th style={{ padding: "8px 10px" }}>Threat</th>
                              <th style={{ padding: "8px 10px" }}>Angle</th>
                              <th style={{ padding: "8px 10px" }}>Hook</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitors.map((c, i) => (
                              <tr key={i} style={{ borderTop: "0.5px solid var(--border-light)", background: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
                                <td style={{ padding: "10px", color: "var(--text-muted)" }}>{i + 1}</td>
                                <td style={{ padding: "10px", fontWeight: 500 }}>{c.name}</td>
                                <td style={{ padding: "10px", color: "var(--text-body)" }}>{c.ads}</td>
                                <td style={{ padding: "10px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 50, height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                                      <div style={{
                                        height: "100%", borderRadius: 3,
                                        width: `${((c.score || 0) / 12) * 100}%`,
                                        background: c.score >= 9 ? "var(--red-error)" : c.score >= 6 ? "var(--amber)" : "var(--green)",
                                      }} />
                                    </div>
                                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.score}/12</span>
                                  </div>
                                </td>
                                <td style={{ padding: "10px" }}>
                                  <Badge
                                    text={c.threat}
                                    color={c.threat === "high" ? "var(--red)" : c.threat === "medium" ? "var(--amber)" : "var(--green)"}
                                    bg={c.threat === "high" ? "var(--red-light)" : c.threat === "medium" ? "var(--amber-light)" : "var(--green-light)"}
                                  />
                                </td>
                                <td style={{ padding: "10px", fontSize: 11, color: "var(--text-body)" }}>{c.angle}</td>
                                <td style={{ padding: "10px", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{c.hook}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {competitors.length === 0 && (
                          <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>No competitors data</div>
                        )}
                      </div>
                    )}

                    {/* TAB: Hooks */}
                    {sbModalTab === "hooks" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {(report.hooks_table || []).map((h, i) => (
                          <div key={i} style={{
                            padding: 16, borderRadius: "var(--radius-md)", background: "var(--surface)",
                            border: "0.5px solid var(--border-light)", transition: "box-shadow 0.15s",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{h.pattern}</span>
                              <Badge
                                text={h.score}
                                color={
                                  (h.score || "").toLowerCase() === "strong" ? "var(--green)" :
                                    (h.score || "").toLowerCase() === "moderate" ? "var(--amber)" : "var(--text-muted)"
                                }
                                bg={
                                  (h.score || "").toLowerCase() === "strong" ? "var(--green-light)" :
                                    (h.score || "").toLowerCase() === "moderate" ? "var(--amber-light)" : "var(--surface)"
                                }
                              />
                            </div>
                            <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--amber)", marginBottom: 6, lineHeight: 1.5 }}>
                              &ldquo;{h.example}&rdquo;
                            </p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{h.reason}</p>
                          </div>
                        ))}
                        {(!report.hooks_table || report.hooks_table.length === 0) && (
                          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>No hooks data</div>
                        )}
                      </div>
                    )}

                    {/* TAB: Market Insights */}
                    {sbModalTab === "insights" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {(report.market_insights_table || []).map((ins, i) => {
                          const f = (ins.field || "").toLowerCase();
                          const icon = f.includes("format") ? "🎬" : f.includes("angle") ? "🎯" : f.includes("framework") ? "📐" : f.includes("cta") ? "👆" : "📋";
                          return (
                            <div key={i} style={{
                              padding: 18, borderRadius: "var(--radius-md)", background: "var(--surface)",
                              border: "0.5px solid var(--border-light)",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 18 }}>{icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{ins.field}</span>
                              </div>
                              <p style={{ fontSize: 12, color: "var(--text-body)", lineHeight: 1.6 }}>{ins.value}</p>
                            </div>
                          );
                        })}
                        {(!report.market_insights_table || report.market_insights_table.length === 0) && (
                          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>No market insights data</div>
                        )}
                      </div>
                    )}

                    {/* TAB: Gaps & Opportunities */}
                    {sbModalTab === "gaps" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {gaps.map((g, i) => (
                          <div key={i} style={{
                            padding: 16, borderRadius: "var(--radius-md)", background: "var(--surface)",
                            border: "0.5px solid var(--border-light)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <Badge
                                text={g.priority?.toUpperCase()}
                                color={g.priority === "high" ? "var(--red)" : g.priority === "medium" ? "var(--amber)" : "var(--green)"}
                                bg={g.priority === "high" ? "var(--red-light)" : g.priority === "medium" ? "var(--amber-light)" : "var(--green-light)"}
                              />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{g.gap}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6, paddingLeft: 2 }}>
                              <span style={{ fontSize: 13 }}>💡</span>
                              <p style={{ fontSize: 12, color: "var(--text-body)", lineHeight: 1.5 }}>{g.opportunity}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, paddingLeft: 2 }}>
                              <span style={{ fontSize: 13 }}>📈</span>
                              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{g.impact}</p>
                            </div>
                          </div>
                        ))}
                        {gaps.length === 0 && (
                          <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13 }}>No gaps data</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Toast notifications */}
          {sbToasts.length > 0 && (
            <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1100, display: "flex", flexDirection: "column", gap: 8 }}>
              {sbToasts.map((t) => (
                <div
                  key={t.id}
                  className="animate-slide-up"
                  onClick={() => setSbToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  style={{
                    padding: "10px 16px", borderRadius: "var(--radius-md)",
                    background: t.type === "success" ? "var(--green)" : "var(--red-error)",
                    color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {t.message}
                </div>
              ))}
            </div>
          )}

          {reportStatus === "error" && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--red-strong)" }}>
              Could not reach n8n: {webhookError}. Please try again.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SOCIAL-DASH — Creator Studio Section
      ═══════════════════════════════════════════════════════ */}
      {tab === "social-dash" && (
        <div className="animate-fade-in" style={{ 
          margin: "-40px", 
          padding: "40px", 
          minHeight: "calc(100vh - 100px)",
          borderRadius: "var(--radius-lg)"
        }}>
          <SocialDash />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          AD DETAILS MODAL (POP-UP)
      ═══════════════════════════════════════════════════════ */}
      {selectedAdForDetails && (() => {
        // Reactive lookup: ensure modal status stays in sync with state updates
        const adId = selectedAdForDetails.id;
        const adTime = selectedAdForDetails.time;

        const currentAdInCreate = adTableLinks[adId];
        const currentAdInApproved = allApprovedAds.find(x => x.id === adId && x.time === adTime);

        // Prioritize live status from state
        const ad = (currentAdInCreate?.time === adTime ? currentAdInCreate : null)
          || currentAdInApproved
          || selectedAdForDetails;

        let jsonData = {};
        try {
          const raw = ad["json data"];
          jsonData = typeof raw === "string" ? JSON.parse(raw) : (raw || {});
        } catch (e) { console.error("JSON parse error:", e); }

        const isVid = (ad.format || "").toLowerCase() === "video";

        return (
          <div
            className="animate-in fade-in duration-300"
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.85)", zIndex: 2000,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
              backdropFilter: "blur(6px)"
            }}
            onClick={() => { setSelectedAdForDetails(null); setIsEditingAd(false); setIsRetryingAd(false); setRetryPrompt(""); }}
          >
            <div
              className="animate-in zoom-in-95 duration-300"
              style={{
                background: "var(--card-bg)", width: "100%", maxWidth: 900,
                borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex",
                flexDirection: "column", maxHeight: "90vh", boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                border: "1px solid var(--border)",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Retry Overlay */}
              {isRetryingAd && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 40
                }}>
                  <div style={{ width: "100%", maxWidth: 500, background: "#fff", padding: 30, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text)" }}>Retry Generation</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                      Provide specific instructions for the AI to improve this creative.
                    </div>
                    <textarea
                      autoFocus
                      placeholder="e.g. Make it more cinematic and focus on the artist's hands..."
                      value={retryPrompt}
                      onChange={(e) => setRetryPrompt(e.target.value)}
                      style={{
                        width: "100%", minHeight: 120, padding: 15, borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)", background: "var(--surface)",
                        fontSize: 14, outline: "none", color: "var(--text)", resize: "none", marginBottom: 20,
                        fontFamily: "inherit"
                      }}
                    />
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={() => setIsRetryingAd(false)}
                        style={{
                          flex: 1, padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                          background: "var(--surface)", color: "var(--text)", fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRetryAdSubmit(ad)}
                        disabled={!retryPrompt || isRetryingSubmit}
                        style={{
                          flex: 1, padding: "12px", borderRadius: "var(--radius-md)", border: "none",
                          background: "var(--primary)", color: "#fff", fontWeight: 700, cursor: (retryPrompt && !isRetryingSubmit) ? "pointer" : "not-allowed",
                          opacity: (retryPrompt && !isRetryingSubmit) ? 1 : 0.6
                        }}
                      >
                        {isRetryingSubmit ? <Spinner size={14} /> : "Submit Retry →"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge
                    text={isVid ? "Video Ads" : "Image Ads"}
                    color={isVid ? "var(--primary)" : "var(--amber)"}
                    bg={isVid ? "var(--primary-light)" : "var(--amber-light)"}
                  />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>AD ID: {ad.id}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!isEditingAd && !isRetryingAd && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditingAd(true);
                          const firstAd = jsonData.ad || jsonData.ads?.[0] || {};
                          setEditingAdData({
                            campaignName: jsonData.campaign?.name || "Untitled Campaign",
                            adName: firstAd.name || "Untitled Ad",
                            headline: firstAd.headline || "No headline provided.",
                            ctaType: firstAd.call_to_action_type || "WATCH_MORE",
                            linkData: jsonData.link_data || ad.text || ""
                          });
                        }}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                          background: "var(--surface)", color: "var(--primary)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => setIsRetryingAd(true)}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
                          background: "var(--surface)", color: "var(--amber-dark)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4
                        }}
                      >
                        ↻ Retry
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedAdForDetails(null); setIsEditingAd(false); setIsRetryingAd(false); setRetryPrompt(""); }}
                    style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-dim)", marginLeft: 8 }}
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Media Column */}
                <div style={{ width: "40%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border-light)" }}>
                  {isVid ? (
                    <video src={ad.text} controls autoPlay={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <img src={ad.text} alt="Ad detail" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  )}
                </div>

                {/* Info Column */}
                <div style={{ width: "60%", padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Campaign Name</label>
                      {isEditingAd ? (
                        <input
                          value={editingAdData.campaignName}
                          onChange={(e) => setEditingAdData({ ...editingAdData, campaignName: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--primary)", background: "var(--card-bg)", fontSize: 14, fontWeight: 600, outline: "none"
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{jsonData.campaign?.name || "Untitled Campaign"}</div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Ad Name</label>
                      {isEditingAd ? (
                        <input
                          value={editingAdData.adName}
                          onChange={(e) => setEditingAdData({ ...editingAdData, adName: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--primary)", background: "var(--card-bg)", fontSize: 14, fontWeight: 600, outline: "none"
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-body)" }}>{jsonData.ad?.name || jsonData.ads?.[0]?.name || "Untitled Ad"}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Ad Headline</label>
                    {isEditingAd ? (
                      <textarea
                        value={editingAdData.headline}
                        onChange={(e) => setEditingAdData({ ...editingAdData, headline: e.target.value })}
                        style={{
                          width: "100%", minHeight: 80, padding: 12, borderRadius: "var(--radius-md)",
                          border: "1px solid var(--primary)", background: "var(--card-bg)", fontSize: 14, lineHeight: 1.6, outline: "none", resize: "vertical"
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", background: "var(--surface)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                        {jsonData.ad?.headline || jsonData.ads?.[0]?.headline || jsonData.description || "No headline provided."}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Call to Action (Type)</label>
                      {isEditingAd ? (
                        <select
                          value={editingAdData.ctaType}
                          onChange={(e) => setEditingAdData({ ...editingAdData, ctaType: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--primary)", background: "var(--card-bg)", fontSize: 13, fontWeight: 600, outline: "none"
                          }}
                        >
                          <option value="WATCH_MORE">WATCH_MORE</option>
                          <option value="LEARN_MORE">LEARN_MORE</option>
                          <option value="BOOK_NOW">BOOK_NOW</option>
                          <option value="SHOP_NOW">SHOP_NOW</option>
                          <option value="SIGN_UP">SIGN_UP</option>
                          <option value="CONTACT_US">CONTACT_US</option>
                          <option value="APPLY_NOW">APPLY_NOW</option>
                          <option value="GET_OFFER">GET_OFFER</option>
                        </select>
                      ) : (
                        <div style={{
                          display: "inline-block", padding: "6px 12px", background: "var(--primary-light)",
                          color: "var(--primary)", borderRadius: "var(--radius-pill)", fontSize: 13, fontWeight: 600
                        }}>
                          {jsonData.ad?.call_to_action_type || jsonData.ads?.[0]?.call_to_action_type || jsonData.cta || "WATCH_MORE"}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Media Link / Link Data</label>
                      {isEditingAd ? (
                        <input
                          value={editingAdData.linkData}
                          onChange={(e) => setEditingAdData({ ...editingAdData, linkData: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--primary)", background: "var(--card-bg)", fontSize: 13, outline: "none"
                          }}
                        />
                      ) : (
                        <a href={jsonData.link_data || jsonData.link || ad.text} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
                          {(jsonData.link_data || jsonData.link || ad.text) ? "View Link ↗" : "N/A"}
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid var(--border-light)", display: "flex", gap: 12 }}>
                    {isEditingAd ? (
                      <>
                        <button
                          onClick={() => setIsEditingAd(false)}
                          style={{
                            flex: 1, padding: "12px", background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)", color: "var(--text)", fontWeight: 600, fontSize: 13, cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdits(ad)}
                          disabled={isSavingAd}
                          style={{
                            flex: 1, padding: "12px", background: "var(--primary)", border: "none",
                            borderRadius: "var(--radius-md)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
                          }}
                        >
                          {isSavingAd ? <Spinner size={12} /> : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={ad.text}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1, textDecoration: "none", textAlign: "center", padding: "12px",
                            background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)", color: "var(--text)", fontWeight: 600, fontSize: 13
                          }}
                        >
                          Download Media
                        </a>
                        <button
                          style={{
                            flex: 1, padding: "12px",
                            background: ad.Approved ? "var(--green-light)" : "var(--primary)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            color: ad.Approved ? "var(--green)" : "#fff",
                            fontWeight: 700, fontSize: 13,
                            cursor: ad.Approved ? "default" : "pointer",
                            opacity: approvingId === (ad.id + "_" + ad.time) ? 0.7 : 1,
                            transition: "all 0.2s"
                          }}
                          disabled={ad.Approved || approvingId === (ad.id + "_" + ad.time)}
                          onClick={async () => {
                            await handleApproveAd(ad);
                          }}
                        >
                          {approvingId === (ad.id + "_" + ad.time) ? (
                            <Spinner size={12} />
                          ) : ad.Approved ? (
                            "✓ Approved"
                          ) : (
                            "✓ Approve Ad"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notifications */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {sbToasts.map((t) => (
          <div key={t.id} className="animate-toast" style={{
            minWidth: 280, padding: "14px 20px", borderRadius: "var(--radius-md)", background: "#fff",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
            border: `1px solid ${t.type === "error" ? "var(--red-error)" : "var(--primary)"}`,
            display: "flex", alignItems: "center", gap: 12, borderLeft: `4px solid ${t.type === "error" ? "var(--red-error)" : "var(--primary)"}`
          }}>
            <span style={{ fontSize: 18 }}>{t.type === "error" ? "⚠️" : "✨"}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {t.type === "error" ? "Error" : "Success"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)" }}>{t.message}</div>
            </div>
            <button
              onClick={() => setSbToasts(prev => prev.filter(toast => toast.id !== t.id))}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16 }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
