
export async function POST(request) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return Response.json({ error: "Missing Meta credentials" }, { status: 500 });
  }

  try {
    const { schema, campaignId: existingCampaignId } = await request.json();

    if (!schema) {
      return Response.json({ error: "Missing schema payload" }, { status: 400 });
    }

    const { campaign, ad_set, ad, link_data } = schema;

    if (!link_data) {
      return Response.json({ error: "Missing link_data (media URL)" }, { status: 400 });
    }

    const isVideo =
      (ad?.media_type || "").toLowerCase() === "video" ||
      (ad?.type || "").toLowerCase() === "video";

    // ── Resolve config values ──────────────────────────────────────────────
    const objective       = campaign?.objective        || "OUTCOME_SALES";
    const campaignName    = campaign?.name             || `[DRAFT] ${objective}_${Date.now()}`;
    const specialAdCats   = campaign?.special_ad_categories || ["NONE"];
    const isCbo           = campaign?.is_adset_budget_sharing_enabled || false;
    
    // Budget & Schedule
    const budgetType      = ad_set?.budget_type       || "DAILY";
    const dailyBudget     = ad_set?.daily_budget       || 5000;
    const lifetimeBudget  = ad_set?.lifetime_budget    || 50000;
    const startTime       = ad_set?.start_time         || null;
    const stopTime        = ad_set?.has_end_date ? ad_set?.stop_time : null;

    const adSetName       = ad_set?.name              || "Ad Set";
    const ageMin          = ad_set?.age_min            || 18;
    const ageMax          = ad_set?.age_max            || 65;
    const gender          = ad_set?.gender             ?? 0; // 0=all,1=male,2=female
    const geoCountries    = ad_set?.geo_targeting      || ["US"];
    const dsaBeneficiary  = ad_set?.dsa_beneficiary   || "Advertiser";
    const dsaPayor        = ad_set?.dsa_payor          || "Advertiser";
    const adName          = ad?.name                  || "Ad";
    const headline        = ad?.headline              || "";
    const primaryText     = ad?.primary_text          || "";
    const websiteUrl      = ad?.website_url           || "https://togahh.com";
    const ctaType         = ad?.call_to_action_type   || "LEARN_MORE";

    // ── Geo targeting object (country codes) ──────────────────────────────
    const geoLocations = {
      countries: geoCountries,
      location_types: ["home", "recent"],
    };

    // ── Targeting spec ────────────────────────────────────────────────────
    const targeting = {
      geo_locations: geoLocations,
      age_min: ageMin,
      age_max: ageMax,
      ...(gender !== 0 ? { genders: [gender] } : {}),
      targeting_automation: {
        advantage_audience: 0,
      },
    };

    // ── Helper to parse JSON with fallback ──
    async function fetchMetaJson(res) {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error(`Meta API returned non-JSON. Status: ${res.status}. Body: ${text.slice(0, 200)}...`);
      }
    }

    // ── STEP 1: Upload media to Meta ───────────────────────────────────────
    let mediaPayload = {};

    if (isVideo) {
      // Fetch the video file
      const mediaRes = await fetch(link_data);
      if (!mediaRes.ok) throw new Error(`Failed to fetch video from URL: ${link_data}`);
      const videoBuffer = await mediaRes.arrayBuffer();
      const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

      const uploadForm = new FormData();
      uploadForm.append("source", videoBlob, "ad_video.mp4");
      uploadForm.append("access_token", accessToken);

      const uploadRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${adAccountId}/advideos`,
        { method: "POST", body: uploadForm }
      );
      const uploadData = await fetchMetaJson(uploadRes);

      if (!uploadData.id) {
        throw new Error("Failed to upload video to Meta: " + JSON.stringify(uploadData));
      }

      // Video creative uses video_data
      mediaPayload = { video_id: uploadData.id };
    } else {
      // Image upload
      const mediaRes = await fetch(link_data);
      if (!mediaRes.ok) throw new Error(`Failed to fetch image from URL: ${link_data}`);
      const imgBuffer = await mediaRes.arrayBuffer();
      const imgBlob = new Blob([imgBuffer]);

      const uploadForm = new FormData();
      uploadForm.append("source", imgBlob, "ad_image.jpg");
      uploadForm.append("access_token", accessToken);

      const uploadRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${adAccountId}/adimages`,
        { method: "POST", body: uploadForm }
      );
      const uploadData = await fetchMetaJson(uploadRes);
      const imageHash = uploadData.images?.["ad_image.jpg"]?.hash;

      if (!imageHash) {
        throw new Error("Failed to upload image to Meta: " + JSON.stringify(uploadData));
      }

      mediaPayload = { image_hash: imageHash };
    }

    // ── STEP 2: Campaign ─────────────────────────────────────────────────
    let campaignId = existingCampaignId;

    if (!campaignId) {
      const campaignRes = await fetch(
        `https://graph.facebook.com/v21.0/act_${adAccountId}/campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: campaignName,
            objective,
            status: "PAUSED",
            special_ad_categories: specialAdCats,
            is_adset_budget_sharing_enabled: isCbo,
            ...(isCbo ? (budgetType === "DAILY" ? { daily_budget: dailyBudget } : { lifetime_budget: lifetimeBudget }) : {}),
            access_token: accessToken,
          }),
        }
      );
      const campaignData = await fetchMetaJson(campaignRes);
      campaignId = campaignData.id;
      if (!campaignId) throw new Error("Failed to create campaign: " + JSON.stringify(campaignData));
    }

    // ── STEP 3: Ad Set ────────────────────────────────────────────────────
    const adSetRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${adAccountId}/adsets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adSetName,
          campaign_id: campaignId,
          ...(!isCbo ? (budgetType === "DAILY" ? { daily_budget: dailyBudget } : { lifetime_budget: lifetimeBudget }) : {}),
          start_time: startTime,
          ...(stopTime ? { stop_time: stopTime } : {}),
          billing_event: "IMPRESSIONS",
          optimization_goal: "LINK_CLICKS",
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          targeting,
          dsa_beneficiary: dsaBeneficiary,
          dsa_payor: dsaPayor,
          status: "PAUSED",
          access_token: accessToken,
        }),
      }
    );
    const adSetData = await fetchMetaJson(adSetRes);
    const adSetId = adSetData.id;
    if (!adSetId) throw new Error("Failed to create ad set: " + JSON.stringify(adSetData));

    // ── STEP 4: Ad Creative ───────────────────────────────────────────────
    // Fetch the Page ID; if not explicitly configured in .env, fetch the first available page
    let pageId = process.env.META_PAGE_ID;
    if (!pageId || pageId === "me" || pageId === "YOUR_TOGAHH_PAGE_ID_HERE") {
      const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("No Facebook Pages found associated with this Meta Access Token. A Page is strictly required by Meta to create Ad Creatives. Please create a Page in your Facebook Business account.");
      }
      pageId = pagesData.data[0].id;
    }

    let objectStorySpec;
    if (isVideo) {
      objectStorySpec = {
        page_id: pageId,
        video_data: {
          video_id: mediaPayload.video_id,
          image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1080&q=80",
          title: headline,
          message: primaryText,
          link_description: headline,
          call_to_action: {
            type: ctaType,
            value: { link: websiteUrl },
          },
        },
      };
    } else {
      objectStorySpec = {
        page_id: pageId,
        link_data: {
          image_hash: mediaPayload.image_hash,
          link: websiteUrl,
          message: primaryText,
          name: headline,
          call_to_action: {
            type: ctaType,
            value: { link: websiteUrl },
          },
        },
      };
    }

    const creativeRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${adAccountId}/adcreatives`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Creative_${adName}`,
          object_story_spec: objectStorySpec,
          access_token: accessToken,
        }),
      }
    );
    const creativeData = await fetchMetaJson(creativeRes);
    const creativeId = creativeData.id;
    if (!creativeId) throw new Error("Failed to create ad creative: " + JSON.stringify(creativeData));

    // ── STEP 5: Ad ────────────────────────────────────────────────────────
    const adRes = await fetch(
      `https://graph.facebook.com/v21.0/act_${adAccountId}/ads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adName,
          adset_id: adSetId,
          creative: { creative_id: creativeId },
          status: "PAUSED",
          access_token: accessToken,
        }),
      }
    );
    const adFinalData = await fetchMetaJson(adRes);

    return Response.json({
      success: true,
      campaignId,
      adSetId,
      adId: adFinalData.id,
    });
  } catch (error) {
    console.error("Launch Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
