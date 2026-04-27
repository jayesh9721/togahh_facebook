# 🚀 Togahh Facebook & Marketing Automation Dashboard

![Dashboard Preview](file:///C:/Users/ASUS/.gemini/antigravity/brain/a439425b-c070-4314-9df3-b3ef2845bcc5/dashboard_preview_1777131280887.png)

A premium, all-in-one marketing automation suite built with **Next.js 15+**, designed for high-velocity ad creation, campaign management, and market analysis. This platform bridges the gap between AI-driven creative generation and live Meta Ads execution.

> [!TIP]
> This repository houses three distinct sub-applications designed to work in synergy to dominate the digital marketing landscape.


## 🏗️ System Architecture

The project is structured as a multi-layered ecosystem, combining legacy powerhouse components with modern, modular sub-apps.

### 1. Main Automation Hub (`/`)
A high-performance, single-page client interface that centralizes 10 core marketing functions. It uses a custom inline-styling system for maximum portability and real-time responsiveness.

### 2. Workflow Management Dashboard (`/dashboard`)
A modular Next.js App Router implementation focused on structured workflow execution, analytics, and service management.
*   **Tech**: Server Components, Prisma ORM, Tailwind CSS, Radix UI.

### 3. AI Newsletter Engine (`/newsletter`)
A dedicated subsystem for automated content generation and history management.
*   **Tech**: Four-layer React Context state management, LocalStorage persistence.

---

## 🌟 Key Features

### 📊 Ads Analysis & Market Intelligence
*   **AI Competitor Analysis**: Deep-dive into competitor strategies and gap identification.
*   **Market Insights**: Automated extraction of hook patterns and executive summaries.
*   **Budget Recommendations**: Data-driven suggestions for campaign scaling.

### 🎬 Creative Generation (Video & Image)
*   **Automated Video Ads**: Generate high-converting video scripts and assets with customizable durations (20s-40s).
*   **Multi-Style Rendering**: Choose from Cinematic, Neon, Minimal, or Dark & Moody aesthetics.
*   **Voiceover Integration**: Integrated with ElevenLabs (Markmont, John, Adhalina, Clara) for premium audio.

### 🚀 Meta Ads Execution
*   **Live Campaign Management**: Real-time monitoring of active Meta campaigns via Graph API.
*   **Instant Updates**: Modify budgets, targeting (age, gender, geo), and status directly from the dashboard.
*   **Automated Approval Queue**: Manage the lifecycle of ads from generation to live deployment.

### 📧 Marketing Outreach
*   **Newsletter Automation**: End-to-end generation, service management, and campaign history.
*   **Outreach Manager**: Unified interface for social and email outreach workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15+ (React 19), TypeScript |
| **State Management** | Zustand, React Context, TanStack Query |
| **Database & ORM** | Prisma, PostgreSQL (Supabase) |
| **Styling** | Tailwind CSS + Radix UI (New), Custom CSS Variables (Legacy) |
| **Backend Automation** | n8n (Multiple Cloud Instances) |
| **Authentication** | NextAuth (JWT Strategy), Supabase Auth |
| **Visualizations** | Recharts, Lucide Icons |

---

## 📁 Project Structure

```bash
src/
├── app/
│   ├── api/             # Next.js API Routes (Meta, n8n proxy, Auth)
│   ├── dashboard/       # Workflow Management & Analytics
│   ├── newsletter/      # Newsletter Sub-application
│   ├── components.js    # Main Dash UI Primitives
│   └── page.js          # Main Automation Hub (3800+ lines of logic)
├── components/
│   ├── ui/              # Radix UI + Tailwind Shared Components
│   ├── dashboard/       # Dashboard-specific modules
│   └── newsletter/      # Newsletter engine components
├── lib/
│   ├── prisma.ts        # Database client
│   ├── supabase.js      # Supabase integration (Main)
│   └── socialSupabase.js # Supabase integration (SocialDash)
└── prisma/              # Database Schema & Migrations
```

---

## 🚦 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   Docker (Optional, for local PostgreSQL)
*   Supabase Account (x2 Projects)
*   n8n Instances (x2 Instances)

### 2. Installation
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Start Development Server
npm run dev
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```ini
# Database
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."

# Supabase (Project A - Main)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Supabase (Project B - SocialDash)
NEXT_PUBLIC_SOCIAL_DASH_SUPABASE_URL="..."
NEXT_PUBLIC_SOCIAL_DASH_SUPABASE_ANON_KEY="..."

# Meta API
META_ACCESS_TOKEN="..."
META_AD_ACCOUNT_ID="..."

# n8n Webhooks
N8N_WEBHOOK_URL="..."
```

---

## 🛡️ Data Safety & Coding Standards

> [!IMPORTANT]
> **Optional Chaining is MANDATORY**: Always use `?.` for object access and `(data?.field || []).map()` for array iterations.

### Styling Boundary Rules
*   **Main Dash (`/`)**: Use **inline styles only** with CSS variables from `globals.css`. Do NOT use Tailwind classes here.
*   **Sub-Apps**: Use **Tailwind CSS** only. Do NOT use inline styles here.

### n8n Data Schema
Expected fields from AI analysis webhooks (do not rename):
*   `executive_summary`
*   `competitor_analysis`
*   `gap_opportunities`
*   `ready_ad_scripts`
*   `hook_analysis`
*   `market_insights`

---

## 🔗 Internal Documentation
*   [CLAUDE.md](file:///c:/Users/ASUS/OneDrive/Desktop/version/CLAUDE.md) - Detailed developer architecture & commands.
*   [Database Schema](file:///c:/Users/ASUS/OneDrive/Desktop/version/prisma/schema.prisma) - Prisma data models.
