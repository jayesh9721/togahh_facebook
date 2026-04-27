# 📖 Detailed Feature Documentation

This document provides a deep dive into the specific functionalities and sections of the Togahh Marketing Automation platform.

---

## 1. Main Dashboard (`/`)

The core mission control for all automation tasks. It is divided into several tabs, each serving a specific stage of the marketing funnel.

### ▦ Overview
*   **Real-time Metrics**: Displays spend, impressions, reach, and link clicks pulled from Meta Insights.
*   **Recent Executions**: A live feed of n8n workflows and their current status (Pending, Completed, Failed).
*   **System Health**: Monitoring the connection to Supabase and n8n instances.

### ◎ Ads Analysis
*   **Input**: Define a topic (e.g., "Cosmetic Dentistry", "Advanced Orthopedics").
*   **AI Engine**: Triggers an n8n workflow that performs market research and competitor scraping.
*   **Output**: Returns an `analysisData` object containing:
    *   **Executive Summary**: High-level market overview.
    *   **Competitor Analysis**: Detailed breakdown of what others are doing.
    *   **Gap Opportunities**: Identifying underserved areas in the market.
    *   **Hook Analysis**: Successful patterns for grabbing attention.

### ◈ Create Ad
*   **Creative Config**: Define the number of ads, media type (Video/Image), and style.
*   **Video Options**: Custom duration, background music, and AI voiceovers via ElevenLabs.
*   **Image Options**: Style selection for AI-generated banners.
*   **Workflow**: Once configured, it triggers the `trigger-ads` API which notifies n8n to start the heavy lifting of asset generation.

### ◉ Approval Queue
*   **Review Process**: All AI-generated ads must be approved by a human before going live.
*   **Preview**: Watch generated videos or view images directly in the dashboard.
*   **Edits**: Modify headlines, CTAs, and campaign names before approval.
*   **Retry**: If an ad isn't perfect, send it back to n8n with a specific prompt for adjustments.

### ◷ Campaign Setup & 🚀 Running Campaigns
*   **Setup**: Select from approved ads and define budget/duration.
*   **Live View**: A real-time table of active Meta Campaigns, Ad Sets, and Ads.
*   **Management**: Pause, Delete, or Edit targeting (Age, Gender, Location) on the fly.

---

## 2. Newsletter Sub-App (`/newsletter`)

A specialized environment for high-volume content distribution.

*   **Generation**: AI-powered drafting of newsletters based on selected services or topics.
*   **Service Management**: Persist service definitions (pricing, descriptions, key selling points) to LocalStorage and Supabase.
*   **History**: A searchable log of all previously sent or generated newsletters.

---

## 3. Workflow & Data Section (`/dashboard`)

Built for structural data management and structured automation.

*   **Scraper**: Define niches and locations to scrape leads or competitor data. Links results to Google Sheets.
*   **Analytics**: Advanced visualization of long-term trends beyond the Meta-only data in the main hub.
*   **Cleanup**: Managed database cleanup and maintenance logs.

---

## 4. Technical Workflows

### The n8n ↔ Supabase Bridge
1.  **Trigger**: Frontend calls `/api/trigger-n8n`.
2.  **Processing**: n8n runs complex logic (LLM analysis, media generation, scraping).
3.  **Persistence**: n8n writes results directly to Supabase (`reports_json`, `status_table`, or `your_table_name`).
4.  **Feedback**: Frontend listens to Supabase Realtime changes and updates the UI instantly without polling (in most cases).

---

## 5. Security & Authentication

*   **Authentication**: Managed by NextAuth and Supabase Auth.
*   **Authorization**: Roles defined in the `User` table (Admin, Client).
*   **Proxying**: sensitive API calls to n8n are proxied through Next.js API routes to hide API keys and handle CORS.
