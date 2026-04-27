"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  Trash2,
  BarChart3,
  PlusCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "./outreach.css";

import { ScraperForm } from "./scraper/scraper-form";
import { ScraperResults } from "./scraper/scraper-results";
import { CampaignForm } from "./campaigns/campaign-form";
import { CampaignList } from "./campaigns/campaign-list";

const OUTREACH_TABS = [
  { id: "create-campaign", label: "Create Campaign", icon: PlusCircle },
  { id: "campaign-list",   label: "Campaign History", icon: Mail },
  { id: "scraper",         label: "Lead Scraper",     icon: Search },
  { id: "scraper-results", label: "Scraper Results",  icon: History },
  { id: "cleanup",         label: "Cleanup",          icon: Trash2 },
  { id: "analytics",       label: "Analytics",        icon: BarChart3 },
];

export default function OutreachManager() {
  const [activeTab, setActiveTab] = useState("create-campaign");

  return (
    <div className="outreach-root">

      {/* ---- Tab navigation ---- */}
      <nav className="outreach-nav">
        {OUTREACH_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("outreach-tab-btn", isActive && "active")}
            >
              <Icon className="tab-icon" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ---- Main content ---- */}
      <div className="outreach-content">
        <div className="outreach-inner">

          {/* Create Campaign */}
          {activeTab === "create-campaign" && (
            <div className="outreach-form-card">
              <div className="outreach-page-header">
                <h2 className="outreach-page-title">Create New Campaign</h2>
                <p className="outreach-page-desc">
                  Generate personalized AI outreach emails and launch your campaign.
                </p>
              </div>
              <CampaignForm />
            </div>
          )}

          {/* Campaign History */}
          {activeTab === "campaign-list" && (
            <div className="outreach-table-card">
              <div className="outreach-table-header">
                <h2 className="outreach-table-title">Outreach Campaigns</h2>
                <PlusCircle className="outreach-table-icon" />
              </div>
              <CampaignList />
            </div>
          )}

          {/* Lead Scraper */}
          {activeTab === "scraper" && (
            <div className="outreach-form-card">
              <div className="outreach-page-header">
                <h2 className="outreach-page-title">Lead Scraper</h2>
                <p className="outreach-page-desc">
                  Configure your Google Maps lead generation parameters.
                </p>
              </div>
              <ScraperForm />
            </div>
          )}

          {/* Scraper Results */}
          {activeTab === "scraper-results" && (
            <div className="outreach-table-card">
              <div className="outreach-table-header">
                <h2 className="outreach-table-title">Scraper History</h2>
                <History className="outreach-table-icon" />
              </div>
              <ScraperResults />
            </div>
          )}

          {/* Cleanup / Analytics placeholders */}
          {(activeTab === "cleanup" || activeTab === "analytics") && (
            <div className="outreach-placeholder">
              <div className="outreach-placeholder-icon">
                {activeTab === "cleanup"
                  ? <Trash2 />
                  : <BarChart3 />}
              </div>
              <h3 className="outreach-placeholder-title">{activeTab} Section</h3>
              <p className="outreach-placeholder-desc">
                This module is currently being optimized for your dashboard.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
