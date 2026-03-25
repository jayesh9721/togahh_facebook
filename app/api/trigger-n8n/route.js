// ============================================================
// API PROXY — /api/trigger-n8n
// Routes each action to its own n8n webhook URL (fixes CORS)
// ============================================================

const WEBHOOKS = {
  competitor_analysis:  "https://n8n.srv881198.hstgr.cloud/webhook/meta_ads_scraper",
  generate_ad:          "https://n8n.srv881198.hstgr.cloud/webhook/generate_ad",
  launch_meta_ad:       "https://n8n.srv881198.hstgr.cloud/webhook/launch_ad",
  stop_campaign:        "https://n8n.srv881198.hstgr.cloud/webhook/stop_campaign",
  generate_report:      "https://n8n.srv881198.hstgr.cloud/webhook/generate_report",
  generate_social_post: "https://n8n.srv881198.hstgr.cloud/webhook/social_post",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    const url = WEBHOOKS[action];
    if (!url) {
      return Response.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawResponse: text, ok: response.ok };
    }

    return Response.json(data, { status: response.status });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to reach n8n" },
      { status: 500 }
    );
  }
}
